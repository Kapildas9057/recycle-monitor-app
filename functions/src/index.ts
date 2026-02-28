import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { validateComplaint, sanitizeString } from "./validation";

admin.initializeApp();

const db = admin.firestore();
const rateLimitWindow = 60 * 1000; // 1 minute
const maxSubmissionsPerWindow = 5;

/**
 * submitComplaint — HTTPS Callable Cloud Function
 * All complaint creation goes through here. Direct Firestore writes are blocked.
 */
export const submitComplaint = functions.https.onCall(async (data, context) => {
  // 1. Rate limiting by IP
  const ip = context.rawRequest.ip || "unknown";
  const now = Date.now();

  const logRef = db.collection("submissionLogs").doc(ip);
  const logSnap = await logRef.get();

  if (logSnap.exists) {
    const logData = logSnap.data()!;
    const timestamps: number[] = (logData.timestamps || []).filter(
      (t: number) => now - t < rateLimitWindow
    );

    if (timestamps.length >= maxSubmissionsPerWindow) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Too many submissions. Please try again later."
      );
    }

    await logRef.update({
      timestamps: admin.firestore.FieldValue.arrayUnion(now),
    });
  } else {
    await logRef.set({ timestamps: [now] });
  }

  // 2. Validate input
  const validation = validateComplaint(data);
  if (!validation.success) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Validation failed",
      { errors: validation.errors }
    );
  }

  const validated = validation.data!;

  // 3. Sanitize all string fields
  const sanitized = {
    fullName: sanitizeString(validated.fullName),
    phone: sanitizeString(validated.phone),
    address: sanitizeString(validated.address),
    zone: sanitizeString(validated.zone),
    wardNumber: sanitizeString(validated.wardNumber),
    complaintType: validated.complaintType,
    description: sanitizeString(validated.description),
  };

  // 4. Write to Firestore via Admin SDK (bypasses rules)
  const docRef = await db.collection("complaints").add({
    ...sanitized,
    imageUrl: null,
    status: "open",
    assignedEmployeeId: null,
    issueDate: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    resolvedAt: null,
  });

  return { success: true, complaintId: docRef.id };
});

/**
 * uploadComplaintImage — HTTPS Callable
 * Returns a signed upload URL for complaint images after validation.
 */
export const uploadComplaintImage = functions.https.onCall(
  async (data, context) => {
    const { complaintId, fileName, contentType } = data;

    if (!complaintId || typeof complaintId !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid complaint ID"
      );
    }

    // Verify complaint exists
    const complaintSnap = await db
      .collection("complaints")
      .doc(complaintId)
      .get();
    if (!complaintSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Complaint not found");
    }

    // Validate content type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!contentType || !allowedTypes.includes(contentType)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Only JPEG, PNG, WebP, and GIF images are allowed"
      );
    }

    // Sanitize file name
    const safeName = fileName
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100)
      : `complaint_${Date.now()}.jpg`;

    const bucket = admin.storage().bucket();
    const file = bucket.file(`complaintImages/${complaintId}/${safeName}`);

    const [url] = await file.generateSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
      conditions: [["content-length-range", 0, 5 * 1024 * 1024]], // max 5MB
    });

    return { uploadUrl: url, filePath: file.name };
  }
);

/**
 * finalizeComplaintImage — HTTPS Callable
 * Updates the complaint doc with the uploaded image URL after upload completes.
 */
export const finalizeComplaintImage = functions.https.onCall(
  async (data, context) => {
    const { complaintId, filePath } = data;

    if (!complaintId || !filePath) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing complaintId or filePath"
      );
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Uploaded file not found"
      );
    }

    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    await db.collection("complaints").doc(complaintId).update({ imageUrl });

    return { success: true, imageUrl };
  }
);
