// Lightweight fallback Toaster and toast to avoid runtime issues with external libs
// This project primarily uses Firebase; keep notifications minimal and safe.

export type ToasterProps = {
  className?: string;
  theme?: 'light' | 'dark' | 'system';
  toastOptions?: Record<string, unknown>;
};

const Toaster = (_props: ToasterProps) => {
  // No-op renderer; replace with real implementation if needed
  return null;
};

type ToastOptions = { description?: string } & Record<string, unknown>;

type ToastFn = ((message: string, opts?: ToastOptions) => void) & {
  success: (message: string, opts?: ToastOptions) => void;
  error: (message: string, opts?: ToastOptions) => void;
  info: (message: string, opts?: ToastOptions) => void;
};

const log = (level: string, message: string, opts?: ToastOptions) => {
  const payload = opts ? ` | ${JSON.stringify(opts)}` : '';
  const text = `[toast:${level}] ${message}${payload}`;
  if (level === 'error') console.error(text);
  else if (level === 'info') console.info(text);
  else console.log(text);
};

const toast = ((message: string, opts?: ToastOptions) => log('default', message, opts)) as ToastFn;

toast.success = (message: string, opts?: ToastOptions) => log('success', message, opts);

toast.error = (message: string, opts?: ToastOptions) => log('error', message, opts);

toast.info = (message: string, opts?: ToastOptions) => log('info', message, opts);

export { Toaster };
export { toast };
