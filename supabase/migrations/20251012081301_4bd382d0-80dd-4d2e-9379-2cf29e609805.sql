-- Fix linter: set search_path on function and enable full replica identity for realtime
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Ensure updates/deletes payloads have full row data for realtime
ALTER TABLE public.waste_entries REPLICA IDENTITY FULL;