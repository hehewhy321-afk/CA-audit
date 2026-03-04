-- Add status and suspension_reason columns to profiles
alter table public.profiles
  add column if not exists status text default 'active',
  add column if not exists suspension_reason text;

-- Create function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert into profiles
  insert into public.profiles (user_id, email, full_name, status)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'active')
  on conflict (user_id) do nothing;
  
  -- Insert into user_roles with default 'client' role
  insert into public.user_roles (user_id, role)
  values (new.id, 'client')
  on conflict (user_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Recreate trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
