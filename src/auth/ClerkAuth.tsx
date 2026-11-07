import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { SignIn, SignUp, UserProfile, useAuth, useUser, useClerk } from "@clerk/react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { hasClerkConfig, hasSupabaseConfig, setClerkAccessTokenProvider, supabase } from "../lib/config";
import { safeInternalPath } from "./redirect";

const appearance = {
  variables: {
    colorPrimary: "#24352f",
    colorText: "#18211e",
    colorTextSecondary: "#59635e",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#18211e",
    borderRadius: "0.75rem",
    fontFamily: "DM Sans, system-ui, sans-serif",
  },
  elements: {
    card: "clerk-card",
    formButtonPrimary: "clerk-primary-button",
    footer: "clerk-footer",
  },
};

export function ClerkSupabaseBridge() {
  const { getToken, userId, isLoaded } = useAuth();
  const provider = useMemo(() => async () => isLoaded && userId ? getToken() : null, [getToken, isLoaded, userId]);

  useEffect(() => {
    setClerkAccessTokenProvider(provider);
    return () => setClerkAccessTokenProvider(null);
  }, [provider]);

  useEffect(() => {
    if (!supabase) return;
    // A user switch or logout must not retain channels authenticated as the previous session.
    void supabase.removeAllChannels();
  }, [userId]);

  return null;
}

export function ClerkSetupRequired() {
  return <main className="auth-config-required"><a className="brand" href="/">mzansi<span className="brand-mid">Motor</span>Stack</a><h1>Sign-in setup is required</h1><p>Add the Clerk publishable key and Supabase project values to the site environment, then reload.</p><code>VITE_CLERK_PUBLISHABLE_KEY</code><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></main>;
}

export function ClerkSignInPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = safeInternalPath(searchParams.get("redirect_url"));
  if (!hasClerkConfig) return <ClerkSetupRequired />;
  return <main className="clerk-auth-page"><a className="brand" href="/">mzansi<span className="brand-mid">Motor</span>Stack</a><p className="auth-kicker">WELCOME BACK</p><h1>Sign in to your workspace</h1><p>Pick up where your team left off.</p><SignIn routing="path" path="/login" signUpUrl="/signup" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} appearance={appearance} /></main>;
}

export function ClerkSignUpPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = safeInternalPath(searchParams.get("redirect_url"));
  if (!hasClerkConfig) return <ClerkSetupRequired />;
  return <main className="clerk-auth-page"><a className="brand" href="/">mzansi<span className="brand-mid">Motor</span>Stack</a><p className="auth-kicker">GET STARTED</p><h1>Create your account</h1><p>Verify your email to continue to dealership setup.</p><SignUp routing="path" path="/signup" signInUrl="/login" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} appearance={appearance} /></main>;
}

export function AccountPage() {
  if (!hasClerkConfig) return <ClerkSetupRequired />;
  return <main className="clerk-account-page"><UserProfile routing="path" path="/account" appearance={appearance} /></main>;
}

export function ClerkLogoutButton() {
  const clerk = useClerk();
  return <button onClick={() => void clerk.signOut({ redirectUrl: "/login" })}><LogOut size={14} /> Sign out</button>;
}

export function AcceptInvitePage() {
  if (!hasClerkConfig) return <ClerkSetupRequired />;
  return <AcceptInvitePageConfigured />;
}

function AcceptInvitePageConfigured() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState("Checking your invitation…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !token) return;
    let active = true;
    void (async () => {
      try {
        if (user?.primaryEmailAddress?.verification?.status !== "verified") {
          setStatus("Verify your email address in Clerk, then return to this invitation.");
          return;
        }
        if (!supabase) throw new Error("The Supabase project is not configured.");
        const provision = await supabase.functions.invoke("provision-clerk-profile", { body: {} });
        if (provision.error) throw provision.error;
        const result = await supabase.functions.invoke("accept-clerk-invitation", { body: { token } });
        if (result.error) {
          const response = (result.error as Error & { context?: Response }).context;
          const body = response instanceof Response ? await response.clone().json().catch(() => ({})) : {};
          throw new Error(body.error ?? result.error.message);
        }
        if (active) {
          setStatus("Invitation accepted. Opening your dealership…");
          navigate("/app", { replace: true });
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "We couldn’t accept this invitation.");
      }
    })();
    return () => { active = false; };
  }, [isLoaded, isSignedIn, token, user, navigate]);

  if (!isLoaded) return <main className="route-loading" role="status">Checking your sign-in…</main>;
  if (!token) return <main className="clerk-auth-page"><h1>Open your invitation link</h1><p>This link is missing its secure invitation token. Ask the dealership owner to send a new invitation.</p><Link to="/login">Sign in</Link></main>;
  if (!isSignedIn) return <main className="clerk-auth-page"><a className="brand" href="/">mzansi<span className="brand-mid">Motor</span>Stack</a><p className="auth-kicker">JOIN YOUR DEALERSHIP</p><h1>Accept your invitation</h1><p>Sign in with the invited email address, or create an account to continue.</p><SignIn routing="hash" signUpUrl={`/signup?redirect_url=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token)}`)}`} signUpForceRedirectUrl={`/accept-invite?token=${encodeURIComponent(token)}`} fallbackRedirectUrl={`/accept-invite?token=${encodeURIComponent(token)}`} appearance={appearance} /></main>;
  return <main className="clerk-auth-page"><p className="auth-kicker">JOIN YOUR DEALERSHIP</p><h1>Accept your invitation</h1><p role={error ? "alert" : "status"}>{error || status}</p>{error && <p>Check that you are signed in with the invited verified email. Expired, revoked, and already used links need a new invitation.</p>}<Link to="/account">Manage account</Link></main>;
}

export function InviteStaffPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "salesperson">("salesperson");
  const [organizationId, setOrganizationId] = useState("");
  const [members, setMembers] = useState<{ user_id: string; role: string; status: string }[]>([]);
  const [invitations, setInvitations] = useState<{ id: string; email: string; role: string; status: string; expires_at: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refreshTeam = async (orgId: string) => {
    if (!supabase) return;
    const [membershipResult, invitationResult] = await Promise.all([
      supabase.from("organization_memberships").select("user_id,role,status").eq("organization_id", orgId),
      supabase.from("organization_invitations").select("id,email,role,status,expires_at").eq("organization_id", orgId).order("created_at", { ascending: false }),
    ]);
    if (membershipResult.error) throw membershipResult.error;
    if (invitationResult.error) throw invitationResult.error;
    setMembers(membershipResult.data ?? []);
    setInvitations(invitationResult.data ?? []);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error: queryError } = await supabase?.from("organization_memberships").select("organization_id")
          .eq("role", "owner").eq("status", "active").limit(1).maybeSingle() ?? { data: null, error: null };
        if (queryError) throw queryError;
        if (!data) { if (active) setError("Only an active dealership owner can manage team access."); return; }
        if (!active) return;
        setOrganizationId(data.organization_id);
        await refreshTeam(data.organization_id);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "We couldn?t load team access.");
      }
    })();
    return () => { active = false; };
  }, []);

  const responseError = async (invokeError: Error) => {
    const response = (invokeError as Error & { context?: Response }).context;
    const body = response instanceof Response ? await response.clone().json().catch(() => ({})) : {};
    return body.error ?? invokeError.message;
  };

  const sendInvitation = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (!supabase || !organizationId) throw new Error("No owner dealership is available for this account");
      const { error: invokeError } = await supabase.functions.invoke("create-clerk-invitation", { body: { organizationId, email: email.trim().toLowerCase(), role } });
      if (invokeError) throw new Error(await responseError(invokeError));
      setNotice(`Invitation sent to ${email.trim().toLowerCase()}.`); setEmail("");
      await refreshTeam(organizationId);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn?t send the invitation."); }
    finally { setBusy(false); }
  };

  const revokeInvitation = async (invitationId: string) => {
    if (!supabase || !organizationId) return;
    setBusy(true); setError("");
    try {
      const { error: invokeError } = await supabase.functions.invoke("revoke-clerk-invitation", { body: { invitationId, organizationId } });
      if (invokeError) throw new Error(await responseError(invokeError));
      setNotice("Invitation revoked."); await refreshTeam(organizationId);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn?t revoke that invitation."); }
    finally { setBusy(false); }
  };

  const suspendMember = async (profileId: string) => {
    if (!supabase || !organizationId) return;
    setBusy(true); setError("");
    try {
      const { error: rpcError } = await supabase.rpc("suspend_dealership_member", { p_organization_id: organizationId, p_member_profile_id: profileId });
      if (rpcError) throw rpcError;
      setNotice("Team member access suspended."); await refreshTeam(organizationId);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn?t suspend this membership."); }
    finally { setBusy(false); }
  };

  return <main className="clerk-auth-page team-page">
    <a className="brand" href="/app">mzansi<span className="brand-mid">Motor</span>Stack</a>
    <p className="auth-kicker">TEAM ACCESS</p><h1>Manage dealership access</h1>
    <p>Only an active owner can issue invitations or suspend a team membership. Invitation links expire after seven days.</p>
    {error && <p className="inline-notice wizard-error" role="alert">{error}</p>}
    {notice && <p className="inline-notice" role="status">{notice}</p>}
    <form className="team-invite-form" onSubmit={sendInvitation}>
      <label className="field"><span>Work email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value as "manager" | "salesperson")}><option value="salesperson">Salesperson</option><option value="manager">Manager</option></select></label>
      <button className="button button-primary form-submit" type="submit" disabled={busy || !organizationId}>{busy ? "Working?" : "Send invitation"}</button>
    </form>
    <section className="team-list" aria-labelledby="members-heading"><h2 id="members-heading">Memberships</h2>{members.length ? members.map((member) => <div className="team-row" key={member.user_id}><span><b>{member.role === "owner" ? "Owner" : member.role === "manager" ? "Manager" : "Salesperson"}</b><small>{member.status === "active" ? "Active" : "Suspended"}</small></span>{member.role !== "owner" && member.status === "active" && <button className="button button-outline" disabled={busy} onClick={() => void suspendMember(member.user_id)}>Suspend access</button>}</div>) : <p>Loading memberships?</p>}</section>
    <section className="team-list" aria-labelledby="invitations-heading"><h2 id="invitations-heading">Invitations</h2>{invitations.length ? invitations.map((invitation) => <div className="team-row" key={invitation.id}><span><b>{invitation.email}</b><small>{invitation.role} ? {invitation.status} ? expires {new Date(invitation.expires_at).toLocaleDateString()}</small></span>{invitation.status === "pending" && <button className="button button-outline" disabled={busy} onClick={() => void revokeInvitation(invitation.id)}>Revoke</button>}</div>) : <p>No invitations yet.</p>}</section>
    <p><Link to="/app">Return to your workspace</Link></p>
  </main>;
}

export function ClerkProtected({ children }: { children: React.ReactNode }) {
  if (!hasClerkConfig || !hasSupabaseConfig) return <ClerkSetupRequired />;
  return <ClerkProtectedSession>{children}</ClerkProtectedSession>;
}

function ClerkProtectedSession({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const location = useLocation();
  const [provisioning, setProvisioning] = useState(true);
  const [provisionError, setProvisionError] = useState("");
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    let active = true;
    setProvisioning(true);
    setProvisionError("");
    if (!supabase) {
      setProvisionError("Supabase is not configured. Add the project URL and publishable key, then reload.");
      setProvisioning(false);
      return;
    }
    void supabase.functions.invoke("provision-clerk-profile", { body: {} }).then(({ error }) => {
      if (!active) return;
      if (error) setProvisionError("Verify your email address and try again. We couldn’t prepare your secure dealership profile yet.");
      setProvisioning(false);
    }).catch(() => {
      if (active) { setProvisionError("We couldn’t prepare your secure dealership profile. Check your connection and retry."); setProvisioning(false); }
    });
    return () => { active = false; };
  }, [isLoaded, isSignedIn, userId]);
  if (!isLoaded) return <main className="route-loading" role="status">Checking your sign-in…</main>;
  if (!isSignedIn) {
    const returnPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect_url=${encodeURIComponent(safeInternalPath(returnPath))}`} replace />;
  }
  if (provisioning) return <main className="route-loading" role="status">Securing your account…</main>;
  if (provisionError) return <main className="clerk-auth-page"><h1>Account setup is incomplete</h1><p role="alert">{provisionError}</p><button className="button button-primary" disabled={!supabase} onClick={() => { if (!supabase) return; setProvisioning(true); setProvisionError(""); void supabase.functions.invoke("provision-clerk-profile", { body: {} }).then(({ error }) => { if (error) setProvisionError("Profile setup failed. Check your configuration and try again."); setProvisioning(false); }).catch(() => { setProvisionError("Profile setup failed. Check your connection and try again."); setProvisioning(false); }); }}>Try again</button></main>;
  return children;
}

