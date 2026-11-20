-- =====================================================================
-- OreLink database, part 2: API access
-- Supabase projects created after May 30, 2026 do not let the app reach
-- new tables until they are granted. Run this after 01_schema.sql.
-- The Row Level Security rules in part 1 still decide what each member
-- can see or change. Signed-out visitors (anon) get nothing.
-- =====================================================================
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on
  public.profiles, public.contacts, public.kyc, public.kyc_docs,
  public.listings, public.equipment, public.services,
  public.threads, public.messages, public.ratings,
  public.reports, public.blocks, public.feed, public.quotes,
  public.verifications, public.suspensions, public.admins
to authenticated;

grant all on all tables in schema public to service_role;

grant execute on function
  public.is_admin(uuid), public.is_verified(uuid), public.in_thread(uuid, uuid),
  public.agree_to_proceed(uuid), public.get_contact(uuid)
to authenticated;
