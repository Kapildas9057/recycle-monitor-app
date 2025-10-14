-- Update handle_new_user function to properly assign roles based on employee_id prefix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Determine role based on employee_id prefix from metadata
  IF NEW.raw_user_meta_data->>'employee_id' LIKE 'ADM%' THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;

  -- Create basic profile
  INSERT INTO public.user_profiles (user_id, name, employee_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Unnamed'),
    NEW.raw_user_meta_data->>'employee_id'
  );

  -- Assign role based on employee_id prefix
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Create function to get next employee ID
CREATE OR REPLACE FUNCTION public.get_next_employee_id(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
  next_id TEXT;
BEGIN
  -- Get the highest number for the given prefix
  SELECT COALESCE(MAX(
    CASE 
      WHEN employee_id ~ ('^' || prefix || '[0-9]+$')
      THEN CAST(SUBSTRING(employee_id FROM LENGTH(prefix) + 1) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.user_profiles
  WHERE employee_id LIKE prefix || '%';
  
  -- Format with leading zeros (e.g., EMP001, ADM001)
  next_id := prefix || LPAD(next_num::TEXT, 3, '0');
  
  RETURN next_id;
END;
$function$;

-- Create function to login with employee ID
CREATE OR REPLACE FUNCTION public.get_email_by_employee_id(emp_id TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT u.email
  FROM auth.users u
  JOIN public.user_profiles p ON p.user_id = u.id
  WHERE p.employee_id = emp_id
  LIMIT 1;
$function$;