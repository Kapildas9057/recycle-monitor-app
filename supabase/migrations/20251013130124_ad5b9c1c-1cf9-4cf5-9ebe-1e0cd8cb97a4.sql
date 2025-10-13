-- Migrate existing users to the new user_roles table
-- This is a one-time migration for users created before the role system was implemented

INSERT INTO public.user_roles (user_id, role)
SELECT 
  up.user_id,
  'user'::public.app_role as role
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = up.user_id
)
ON CONFLICT (user_id, role) DO NOTHING;
