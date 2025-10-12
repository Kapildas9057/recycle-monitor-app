-- Drop all public access policies
DROP POLICY IF EXISTS "Allow public read access" ON public.waste_entries;
DROP POLICY IF EXISTS "Allow public insert access" ON public.waste_entries;
DROP POLICY IF EXISTS "Allow public update access" ON public.waste_entries;
DROP POLICY IF EXISTS "Allow public delete access" ON public.waste_entries;

-- Create user_profiles table to store user roles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- Function to get user's employee_id
CREATE OR REPLACE FUNCTION public.get_employee_id(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT employee_id FROM public.user_profiles
  WHERE user_id = user_uuid
  LIMIT 1;
$$;

-- Secure RLS policies for waste_entries

-- Employees can view their own entries, admins can view all
CREATE POLICY "Users can view relevant waste entries"
  ON public.waste_entries
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_admin(auth.uid()) OR
      employee_id = public.get_employee_id(auth.uid())
    )
  );

-- Employees can insert their own entries
CREATE POLICY "Employees can create waste entries"
  ON public.waste_entries
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    employee_id = public.get_employee_id(auth.uid())
  );

-- Only admins can update entries (for approval/rejection)
CREATE POLICY "Admins can update waste entries"
  ON public.waste_entries
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    public.is_admin(auth.uid())
  );

-- Only admins can delete entries
CREATE POLICY "Admins can delete waste entries"
  ON public.waste_entries
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    public.is_admin(auth.uid())
  );

-- Add trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for user_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;