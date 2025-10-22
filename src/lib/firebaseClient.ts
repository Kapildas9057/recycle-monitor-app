// src/integrations/firebase/client.ts
// Re-export your existing firebase exports so old imports still work.
// Edit the right-hand import path below to match where your real firebase file is.

export { auth, db } from "@/integrations/firebase/client";
// OR if your file is src/firebase.config.ts use:
// export { auth, db } from "@/firebase.config";
