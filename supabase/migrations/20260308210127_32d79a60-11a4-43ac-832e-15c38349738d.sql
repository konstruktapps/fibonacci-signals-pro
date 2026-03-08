
-- Attach the trigger to auth.users so admin role is auto-assigned on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin();

-- Manually assign admin role to existing user (andreiamartinss882@gmail.com)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'andreiamartinss882@gmail.com'
ON CONFLICT DO NOTHING;
