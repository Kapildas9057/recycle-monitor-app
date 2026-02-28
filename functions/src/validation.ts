/**
 * Server-side validation for complaint submissions.
 * Mirrors the client Zod schema but runs independently on the server.
 */

const ALLOWED_COMPLAINT_TYPES = [
  "waste_not_collected",
  "late_collection",
  "mixed_waste_issue",
  "staff_behavior",
  "wrong_location",
  "other",
] as const;

const ALLOWED_FIELDS = new Set([
  "fullName",
  "phone",
  "address",
  "zone",
  "wardNumber",
  "complaintType",
  "description",
]);

interface ValidatedComplaint {
  fullName: string;
  phone: string;
  address: string;
  zone: string;
  wardNumber: string;
  complaintType: string;
  description: string;
}

interface ValidationResult {
  success: boolean;
  data?: ValidatedComplaint;
  errors?: Record<string, string>;
}

/**
 * Sanitize a string: trim, strip HTML tags, escape special chars.
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate complaint data server-side.
 */
export function validateComplaint(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { success: false, errors: { _form: "Invalid request data" } };
  }

  const input = data as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // Reject unexpected fields
  for (const key of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(key)) {
      errors[key] = `Unexpected field: ${key}`;
    }
  }

  // Validate fullName
  if (typeof input.fullName !== "string" || input.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters";
  } else if (input.fullName.trim().length > 100) {
    errors.fullName = "Name must be at most 100 characters";
  }

  // Validate phone
  if (typeof input.phone !== "string" || input.phone.trim().length < 10) {
    errors.phone = "Valid phone number required (min 10 digits)";
  } else if (input.phone.trim().length > 15) {
    errors.phone = "Phone number too long";
  } else if (!/^[\d\s\-\+\(\)]+$/.test(input.phone.trim())) {
    errors.phone = "Phone contains invalid characters";
  }

  // Validate address
  if (typeof input.address !== "string" || input.address.trim().length < 5) {
    errors.address = "Address must be at least 5 characters";
  } else if (input.address.trim().length > 300) {
    errors.address = "Address must be at most 300 characters";
  }

  // Validate zone
  if (typeof input.zone !== "string" || input.zone.trim().length < 1) {
    errors.zone = "Zone is required";
  } else if (input.zone.trim().length > 50) {
    errors.zone = "Zone must be at most 50 characters";
  }

  // Validate wardNumber
  if (
    typeof input.wardNumber !== "string" ||
    input.wardNumber.trim().length < 1
  ) {
    errors.wardNumber = "Ward number is required";
  } else if (input.wardNumber.trim().length > 10) {
    errors.wardNumber = "Ward number must be at most 10 characters";
  }

  // Validate complaintType (strict enum)
  if (
    typeof input.complaintType !== "string" ||
    !ALLOWED_COMPLAINT_TYPES.includes(input.complaintType as any)
  ) {
    errors.complaintType = "Invalid complaint type";
  }

  // Validate description
  if (
    typeof input.description !== "string" ||
    input.description.trim().length < 10
  ) {
    errors.description = "Description must be at least 10 characters";
  } else if (input.description.trim().length > 1000) {
    errors.description = "Description must be at most 1000 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      fullName: (input.fullName as string).trim(),
      phone: (input.phone as string).trim(),
      address: (input.address as string).trim(),
      zone: (input.zone as string).trim(),
      wardNumber: (input.wardNumber as string).trim(),
      complaintType: input.complaintType as string,
      description: (input.description as string).trim(),
    },
  };
}
