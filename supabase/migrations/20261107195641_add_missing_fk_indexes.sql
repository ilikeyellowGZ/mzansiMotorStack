-- Cover foreign keys reported by Supabase's database performance advisor.
create index appointment_requests_organization_idx
  on public.appointment_requests (organization_id);
create index audit_events_actor_idx
  on public.audit_events (actor_user_id) where actor_user_id is not null;
create index onboarding_drafts_submitted_request_idx
  on public.onboarding_drafts (submitted_request_id) where submitted_request_id is not null;
create index onboarding_requests_submitter_idx
  on public.onboarding_requests (submitted_by_user_id);
create index organization_invitations_inviter_idx
  on public.organization_invitations (invited_by_user_id);
create index organization_invitations_acceptor_idx
  on public.organization_invitations (accepted_by_user_id) where accepted_by_user_id is not null;
create index organizations_default_assignment_idx
  on public.organizations (id, default_lead_assignment_user_id)
  where default_lead_assignment_user_id is not null;
create index user_notification_preferences_user_idx
  on public.user_notification_preferences (user_id);
