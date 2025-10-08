// Legacy shim: we migrated to Sonner. This component remains for backward compatibility.
// It renders nothing to avoid invalid hook calls from the old custom toast system.
export function Toaster() {
  return null;
}

