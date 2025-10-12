-- Create waste_entries table
CREATE TABLE public.waste_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  waste_type JSONB NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waste_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Allow public read access" ON public.waste_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.waste_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.waste_entries
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON public.waste_entries
  FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waste_entries_updated_at
BEFORE UPDATE ON public.waste_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for waste images
INSERT INTO storage.buckets (id, name, public)
VALUES ('waste-images', 'waste-images', true);

-- Create storage policies
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'waste-images');

CREATE POLICY "Allow public insert access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'waste-images');

CREATE POLICY "Allow public update access" ON storage.objects
  FOR UPDATE USING (bucket_id = 'waste-images');

CREATE POLICY "Allow public delete access" ON storage.objects
  FOR DELETE USING (bucket_id = 'waste-images');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.waste_entries;