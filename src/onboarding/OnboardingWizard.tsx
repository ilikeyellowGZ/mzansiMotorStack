import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleHelp,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  appMode,
  hasApprovedLegalNotices,
  hasSupabaseConfig,
  isPreviewMode,
  supabase,
} from "../lib/config";
import {
  calculateQuote,
  emptyAnswers,
  formatMoney,
  getSetupFee,
  getSetupScope,
  normaliseWebsiteUrl,
  planDetails,
  type OnboardingAnswers,
  type PlanCode,
  type SetupMethod,
  type SocialPlatform,
} from "../lib/onboarding";
import {
  acceptTerms,
  loadOnboardingDraft,
  saveOnboardingDraft,
  submitOnboarding,
  startPaystackCheckout,
  verifyPaystackPayment,
  type SubmitRequestResult,
} from "../lib/onboardingRepository";

const stepTitles = [
  "Create your account",
  "About your dealership",
  "Website and social media",
  "Choose your setup",
  "Choose a subscription",
  "Request assistance",
  "Review your setup",
];

const focusAreas = [
  "Managing vehicle stock",
  "Keeping track of leads",
  "Following up with customers",
  "Improving my website",
  "Managing social media",
  "Responding to enquiries faster",
  "Understanding sales performance",
];
const southAfricanDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Johannesburg",
});

const socialOptions: (SocialPlatform | "None yet")[] = [
  "Facebook",
  "Instagram",
  "TikTok",
  "Other",
  "None yet",
];

const recordSources = [
  "Excel or Google Sheets",
  "Another software system",
  "Paper records",
  "WhatsApp or phone contacts",
  "A mixture",
  "I am starting fresh",
];

const provinceOptions = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

function BrandMark({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link className={`brand onboarding-brand ${light ? "onboarding-brand-light" : ""}`} to="/" aria-label="MzansiMotorStack home">
      {compact ? <img className="brand-road-mark" src="/brand/mzansi-road-mark.png" alt="" width="32" height="32" /> : <img className="brand-wordmark" src="/brand/mzansi-motorstack-wordmark.png" alt="" width="180" height="60" />}
      {light && <span>MzansiMotorStack</span>}
    </Link>
  );
}

function WizardFrame({
  children,
  step = 1,
}: {
  children: React.ReactNode;
  step?: number;
}) {
  return (
    <div className="auth-page wizard-page">
      <aside className="auth-aside">
        <BrandMark compact light />
        <div className="auth-aside-content">
          <div className="auth-orb">
            <Building2 size={46} strokeWidth={1.2} />
            <span className="orb-glint" />
          </div>
          <span className="auth-kicker">A GOOD PLACE TO START</span>
          <h2>
            Build a workspace
            <br />
            around <em>your business.</em>
          </h2>
          <p>
            One dealership location to begin. Choose the help that suits your
            team and make your way through at your own pace.
          </p>
          <div
            className="wizard-progress-list"
            aria-label={`Onboarding step ${step} of 7`}
          >
            {stepTitles.map((title, index) => (
              <div
                className={`wizard-progress-item ${step === index + 1 ? "current" : step > index + 1 ? "complete" : ""}`}
                key={title}
              >
                <span>
                  {step > index + 1 ? (
                    <Check size={11} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <small>{title}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-aside-foot">
          <span>mzansiMotorStack</span>
          <span>Independent by design</span>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-main-top">
          <Link to="/" className="back-home">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <span>
            Already have an account? <Link to="/login">Sign in</Link>
          </span>
        </div>
        <div className="auth-content wizard-content">
          <div className="auth-content-brand">
            <BrandMark />
          </div>
          {children}
        </div>
        <div className="auth-footer">
          <span>
            <ShieldCheck size={14} /> Your progress is saved as you go
          </span>
          <Link to="/privacy">
            Data notice <ArrowRight size={12} />
          </Link>
        </div>
      </main>
    </div>
  );
}

function WizardButton({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "quiet" | "dark";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`button button-${variant}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  autoComplete,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <i className="required-mark">*</i>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        min={min}
        max={max}
      />
    </label>
  );
}

function ChoiceButton({
  selected,
  children,
  onClick,
  description,
  compact = false,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  description?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`wizard-choice-card ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="choice-indicator">
        {selected && <Check size={12} />}
      </span>
      <span className="choice-copy">
        <b>{children}</b>
        {description && <small>{description}</small>}
      </span>
    </button>
  );
}

function ToggleGrid({
  options,
  value,
  onChange,
  multiple = false,
  columns = 2,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  columns?: number;
}) {
  const selectedValues = Array.isArray(value) ? value : [value];
  const selectedValueSet = new Set(selectedValues);
  return (
    <div
      className={`wizard-choice-grid cols-${columns}`}
      role={multiple ? "group" : "radiogroup"}
    >
      {options.map((option) => {
        const selected = selectedValueSet.has(option.value);
        return (
          <ChoiceButton
            key={option.value}
            selected={selected}
            description={option.description}
            compact={columns > 2}
            onClick={() => {
              if (!multiple) onChange(option.value);
              else
                onChange(
                  selected
                    ? selectedValues.filter((item) => item !== option.value)
                    : [...selectedValues, option.value],
                );
            }}
          >
            {option.label}
          </ChoiceButton>
        );
      })}
    </div>
  );
}

function StepHeader({
  step,
  title,
  description,
  saving,
}: {
  step: number;
  title: string;
  description: string;
  saving: string;
}) {
  return (
    <>
      <div className="eyebrow">
        <span className="eyebrow-dot" /> COMPANY ONBOARDING · STEP{" "}
        {String(step).padStart(2, "0")} OF 07
      </div>
      <div className="auth-title-row wizard-title-row">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="setup-step-badge">
          {String(step).padStart(2, "0")} <span>/ 07</span>
        </span>
      </div>
      <div className="progress-track">
        <i style={{ width: `${(step / 7) * 100}%` }} />
      </div>
      <div className="wizard-save-status" aria-live="polite">
        <span className={`save-pip ${saving}`} />
        {saving === "saving"
          ? "Saving your progress…"
          : saving === "error"
            ? "Couldn’t save · check your connection"
            : "Progress saved automatically"}
      </div>
    </>
  );
}

function StepNavigation({
  step,
  onBack,
  onSkip,
  busy = false,
  continueLabel = "Continue",
}: {
  step: number;
  onBack: () => void;
  onSkip?: () => void;
  busy?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="wizard-navigation">
      {step > 1 ? (
        <WizardButton variant="quiet" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </WizardButton>
      ) : (
        <span />
      )}
      <div>
        {onSkip && (
          <button className="wizard-skip" type="button" onClick={onSkip}>
            Skip for now
          </button>
        )}
        <WizardButton type="submit" disabled={busy}>
          {busy ? (
            "Please wait…"
          ) : (
            <>
              {continueLabel} <ArrowRight size={15} />
            </>
          )}
        </WizardButton>
      </div>
    </div>
  );
}

function ConfigurationRequired() {
  return (
    <WizardFrame>
      <div className="eyebrow">
        <span className="eyebrow-dot" /> ACCOUNT SETUP
      </div>
      <h1 className="config-title">Connect your workspace first</h1>
      <p className="auth-intro">
        Production onboarding needs Clerk and Supabase settings. This
        app will not create a pretend account or store your details locally.
      </p>
      <div className="config-card">
        <b>Required configuration</b>
        <code>VITE_CLERK_PUBLISHABLE_KEY</code>
        <code>VITE_SUPABASE_URL</code>
        <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
        <small>
          Copy <code>.env.example</code> to <code>.env.local</code>, add these
          public project values, and restart Vite.
        </small>
      </div>
      <WizardButton
        variant="outline"
        onClick={() => window.location.assign("/demo")}
      >
        Explore the sample demo <ArrowRight size={15} />
      </WizardButton>
      <p className="auth-legal">
        Do not add a Supabase secret or service-role key to a VITE_ variable.
      </p>
    </WizardFrame>
  );
}

export function OnboardingWizard({
  onSubmitted,
}: {
  onSubmitted: (name: string) => void;
}) {
  const navigate = useNavigate();
  const { user, isLoaded: clerkLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const paymentReference = searchParams.get("reference") ?? searchParams.get("trxref");
  const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers);
  const [step, setStep] = useState(appMode === "demo" ? 1 : 2);
  const [userReady, setUserReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState("saved");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<SubmitRequestResult | null>(null);

  useEffect(() => {
    let active = true;
    async function restore() {
      setLoading(true);
      try {
        if (appMode === "production" && hasSupabaseConfig && clerkLoaded && user) {
          const email = user.primaryEmailAddress;
          if (email?.verification?.status !== "verified") {
            setError("Verify your email address in your Clerk account before continuing.");
            return;
          }
          if (!supabase) throw new Error("Supabase is not configured.");
          setUserReady(true);
          const { data: memberships, error: membershipError } = await supabase.from("organization_memberships")
            .select("organization_id").eq("status", "active").limit(1);
          if (membershipError) throw membershipError;
          if (memberships?.length) {
            navigate("/app", { replace: true });
            return;
          }
          const { data: invitation, error: invitationError } = await supabase.functions.invoke("check-pending-invitation", { body: {} });
          if (invitationError) throw invitationError;
          if (invitation?.hasInvitation) {
            navigate("/accept-invite?pending=1", { replace: true });
            return;
          }
          const draft = await loadOnboardingDraft();
          if (draft) {
            setAnswers({ ...emptyAnswers, ...draft.answers, email: email.emailAddress, fullName: user.fullName ?? "" });
            setStep(Math.min(7, Math.max(2, draft.currentStep)));
          } else {
            setAnswers((current) => ({ ...current, fullName: user.fullName ?? "", email: email.emailAddress }));
            setStep(2);
          }
        } else if (isPreviewMode) {
          const draft = await loadOnboardingDraft();
          if (draft) {
            setAnswers({ ...emptyAnswers, ...draft.answers });
            setStep(Math.min(7, Math.max(2, draft.currentStep)));
            setUserReady(true);
          }
        }
      } catch {
        if (active) setError("We couldn?t restore your saved progress. Check your connection and try again.");
      } finally {
        if (active && (isPreviewMode || clerkLoaded)) setLoading(false);
      }
    }
    void restore();
    return () => { active = false; };
  }, [clerkLoaded, user, navigate]);

  useEffect(() => {
    if (loading || !userReady || !paymentReference || submitted) return;
    let active = true;
    setBusy(true);
    setError("");
    void verifyPaystackPayment(paymentReference)
      .then(async (result) => {
        if (!active) return;
        if (result.status === "paid" && result.id) {
          const paidRequest: SubmitRequestResult = {
            id: result.id,
            status: result.requestStatus ?? "active",
            currency: result.currency ?? "ZAR",
            dueTodayMinor: result.dueTodayMinor ?? 0,
            setupFeeMinor: result.setupFeeMinor ?? 0,
            installments: result.installments ?? 1,
            setupScheduleMinor: result.setupScheduleMinor ?? [],
          };
          setSubmitted(paidRequest);
          setStep(7);
          await saveOnboardingDraft({ currentStep: 7, answers, submittedRequestId: result.id });
          navigate("/start", { replace: true });
          return;
        }
        setError(result.status === "processing"
          ? "Paystack is confirming your payment. Refresh this page in a moment."
          : "The payment was not completed. Review your quote and try checkout again.");
        navigate("/start", { replace: true });
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "We couldn’t verify the payment yet.");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => { active = false; };
  }, [answers, loading, navigate, paymentReference, submitted, userReady]);

  useEffect(() => {
    if (loading || step < 2 || !userReady || submitted) return;
    setSaving("saving");
    const timeout = window.setTimeout(() => {
      void saveOnboardingDraft({ currentStep: step, answers })
        .then(() => setSaving("saved"))
        .catch(() => setSaving("error"));
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [answers, loading, step, submitted, userReady]);

  const update = <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K],
  ) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const quote = useMemo(() => {
    if (!answers.plan || !answers.setupMethod) return null;
    return calculateQuote(
      answers.plan,
      answers.billingInterval,
      getSetupFee(answers.plan, answers.setupMethod),
      answers.setupPayment,
    );
  }, [
    answers.plan,
    answers.setupMethod,
    answers.billingInterval,
    answers.setupPayment,
  ]);

  const handleAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setUserReady(true);
    setStep(2);
    if (isPreviewMode) await saveOnboardingDraft({ currentStep: 2, answers });
  };

  const next = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (step === 3) {
      const requiredWebsite =
        answers.websiteStatus === "happy" ||
        answers.websiteStatus === "needs_improvement";
      if (requiredWebsite && !answers.addWebsiteLater) {
        const url = normaliseWebsiteUrl(answers.websiteUrl);
        if (url === null || url === "") {
          setError(
            "Add a valid website address, or choose “I’ll add the link later”.",
          );
          return;
        }
        update("websiteUrl", url);
      }
    }
    if (step === 4 && !answers.setupMethod) {
      setError(
        "Choose how you’d like to get set up, or select “Do it myself”.",
      );
      return;
    }
    if (step === 5 && !answers.plan) {
      setError("Choose a subscription to continue.");
      return;
    }
    if (step === 6) {
      if (
        !answers.preferredDate ||
        !answers.preferredTime ||
        !answers.contactPerson ||
        !answers.contactPhone
      ) {
        setError(
          "Add a preferred date, time and contact person for the request.",
        );
        return;
      }
      if (
        answers.setupMethod === "in_person" &&
        !answers.appointmentAddress.trim()
      ) {
        setError(
          "Add the dealership address so the in-person visit can be reviewed.",
        );
        return;
      }
    }
    setStep((current) =>
      current === 5 && answers.setupMethod === "self_service"
        ? 7
        : Math.min(7, current + 1),
    );
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!answers.plan || !quote) return;
    if (!answers.termsAccepted || !answers.privacyAcknowledged) {
      setError("Accept the service terms and acknowledge the privacy notice before continuing.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!isPreviewMode) await acceptTerms();
      const result = await submitOnboarding(answers);
      await saveOnboardingDraft({
        currentStep: 7,
        answers,
        submittedRequestId: result.id,
      });
      if (isPreviewMode) {
        setSubmitted(result);
      } else {
        const checkout = await startPaystackCheckout(result.id);
        window.location.assign(checkout.checkoutUrl);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "We couldn’t save the setup request. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (
    appMode === "unconfigured" ||
    (appMode === "production" && !hasSupabaseConfig)
  )
    return <ConfigurationRequired />;
  if (appMode === "production" && !hasApprovedLegalNotices)
    return <LegalNoticesRequired />;
  if (loading)
    return (
      <WizardFrame>
        <div className="wizard-loading" role="status">
          Loading your saved progress…
        </div>
      </WizardFrame>
    );

  if (submitted && quote)
    return (
      <WizardFrame step={7}>
        <div className="onboarding-done">
          <div className="done-mark">
            <Check size={27} />
          </div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />{" "}
            {isPreviewMode ? "PREVIEW COMPLETE" : "PAYMENT VERIFIED"}
          </div>
          <h1>
            {isPreviewMode
              ? "Your sample setup is ready."
              : "Your payment is confirmed."}
          </h1>
          <p>
            {isPreviewMode
              ? "This demo stored a draft only in this browser session. No account, payment or service request was created."
              : "Paystack verified your first charge and your recurring subscription is set up. We’ll begin activation from the verified payment record."}
          </p>
          <div className="done-request-summary">
            <span>
              {planDetails[answers.plan as PlanCode].name} ·{" "}
              {answers.billingInterval === "annual"
                ? "Annual upfront"
                : "Monthly"}
            </span>
            <b>
              {formatMoney(submitted.dueTodayMinor)}{" "}
                <small>paid today</small>
            </b>
            <span>Payment status · {submitted.status.replaceAll("_", " ")}</span>
          </div>
          <div className="done-checklist">
            <b>What happens next</b>
            <span>
              <Check size={14} /> Dealership and owner details recorded
            </span>
            {answers.setupMethod !== "self_service" && (
              <span>
                <Clock3 size={14} /> Assistance appointment requested ·
                confirmation pending
              </span>
            )}
            <span>
              <Check size={14} /> Paystack card subscription verified
            </span>
            <span>
              <CircleHelp size={14} /> Secure record upload will be available
              after setup is approved
            </span>
          </div>
          <WizardButton
            onClick={() => {
              onSubmitted(answers.dealershipName);
              navigate(isPreviewMode ? "/demo" : "/app");
            }}
          >
            {isPreviewMode
              ? "Open the sample workspace"
              : "Continue to workspace status"}{" "}
            <ArrowRight size={15} />
          </WizardButton>
        </div>
      </WizardFrame>
    );

  const currentStep = Math.max(1, Math.min(7, step));
  const meetingDateMin = southAfricanDateFormatter.format(new Date());

  return (
    <WizardFrame step={currentStep}>
      <StepHeader
        step={currentStep}
        title={stepTitles[currentStep - 1]}
        description={stepDescriptions[currentStep - 1]}
        saving={saving}
      />
      {error && (
        <p className="inline-notice wizard-error" role="alert">
          {error}
        </p>
      )}

      {currentStep === 1 && (
        <form className="auth-form wizard-form" onSubmit={handleAccount}>
          <TextField label="Full name" value={answers.fullName} onChange={(value) => update("fullName", value)} autoComplete="name" required />
          <TextField label="Email address" type="email" value={answers.email} onChange={(value) => update("email", value)} autoComplete="email" required />
          <p className="form-note"><ShieldCheck size={15} /><span>The sample demo keeps this draft in this browser session only. Live accounts are managed through Clerk.</span></p>
          <WizardButton type="submit">Continue <ArrowRight size={15} /></WizardButton>
          <p className="auth-legal">Already have an account? <Link to="/login">Sign in</Link>. Invited to a dealership? <Link to="/accept-invite">Accept your invitation</Link>.</p>
        </form>
      )}

      {currentStep === 2 && (
        <form className="wizard-form" onSubmit={next}>
          <div className="wizard-fields two-col">
            <TextField
              label="Dealership name"
              value={answers.dealershipName}
              onChange={(value) => update("dealershipName", value)}
              placeholder="Your business name"
              required
            />
            <TextField
              label="Main contact number"
              type="tel"
              autoComplete="tel"
              value={answers.phone}
              onChange={(value) => update("phone", value)}
              placeholder="e.g. 011 555 0123"
              required
            />
          </div>
          <div className="wizard-fields two-col">
            <TextField
              label="City or town"
              autoComplete="address-level2"
              value={answers.city}
              onChange={(value) => update("city", value)}
              placeholder="e.g. Johannesburg"
              required
            />
            <label className="field">
              <span>
                Province <i className="required-mark">*</i>
              </span>
              <select
                value={answers.province}
                onChange={(event) => update("province", event.target.value)}
                required
              >
                <option value="">Choose a province</option>
                {provinceOptions.map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
          </div>
          <TextField
            label="Business address"
            value={answers.address}
            onChange={(value) => update("address", value)}
            autoComplete="street-address"
            placeholder="Optional for now"
          />
          <fieldset className="wizard-fieldset">
            <legend>Your role in the dealership</legend>
            <ToggleGrid
              columns={3}
              value={answers.role}
              onChange={(value) =>
                update("role", value as OnboardingAnswers["role"])
              }
              options={[
                { value: "Owner", label: "Owner" },
                { value: "Manager", label: "Manager" },
                { value: "Other", label: "Other" },
              ]}
            />
          </fieldset>
          <div className="wizard-fields two-col">
            <fieldset className="wizard-fieldset">
              <legend>Number of staff</legend>
              <ToggleGrid
                columns={2}
                value={answers.staffSize}
                onChange={(value) =>
                  update("staffSize", value as OnboardingAnswers["staffSize"])
                }
                options={["Just me", "2–5", "6–10", "More than 10"].map(
                  (value) => ({ value, label: value }),
                )}
              />
            </fieldset>
            <fieldset className="wizard-fieldset">
              <legend>Approximate vehicle stock</legend>
              <ToggleGrid
                columns={2}
                value={answers.stockBand}
                onChange={(value) =>
                  update("stockBand", value as OnboardingAnswers["stockBand"])
                }
                options={["1–10", "11–30", "31–60", "More than 60"].map(
                  (value) => ({ value, label: value }),
                )}
              />
            </fieldset>
          </div>
          <fieldset className="wizard-fieldset">
            <legend>
              What would you most like help with?{" "}
              <small>Select any that apply</small>
            </legend>
            <ToggleGrid
              columns={2}
              multiple
              value={answers.helpAreas}
              onChange={(value) => update("helpAreas", value as string[])}
              options={focusAreas.map((value) => ({ value, label: value }))}
            />
          </fieldset>
          <StepNavigation step={2} onBack={() => setStep(1)} />
        </form>
      )}

      {currentStep === 3 && (
        <form className="wizard-form" onSubmit={next}>
          <fieldset className="wizard-fieldset">
            <legend>Does your dealership have a website?</legend>
            <ToggleGrid
              columns={2}
              value={answers.websiteStatus}
              onChange={(value) =>
                update(
                  "websiteStatus",
                  value as OnboardingAnswers["websiteStatus"],
                )
              }
              options={[
                { value: "happy", label: "Yes, and I’m happy with it" },
                {
                  value: "needs_improvement",
                  label: "Yes, but it needs improvement",
                },
                { value: "want_one", label: "No, I would like one" },
                { value: "not_now", label: "No, not right now" },
              ]}
            />
          </fieldset>
          {(answers.websiteStatus === "happy" ||
            answers.websiteStatus === "needs_improvement") && (
            <div className="conditional-panel">
              <TextField
                label="Website address"
                type="url"
                value={answers.websiteUrl}
                onChange={(value) => update("websiteUrl", value)}
                placeholder="www.yourdealership.co.za"
              />
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={answers.addWebsiteLater}
                  onChange={(event) =>
                    update("addWebsiteLater", event.target.checked)
                  }
                />
                <span>I’ll add the link later.</span>
              </label>
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={answers.websiteReview}
                  onChange={(event) =>
                    update("websiteReview", event.target.checked)
                  }
                />
                <span>I’d like an optional website review.</span>
              </label>
              <p className="conditional-note">
                Connecting enquiry forms depends on your website platform and
                available access. We’ll review compatibility with you; it isn’t
                automatic.
              </p>
            </div>
          )}
          {answers.websiteStatus === "want_one" && (
            <div className="website-benefit-card">
              <div className="eyebrow">
                <span className="eyebrow-dot" /> A WEBSITE THAT WORKS WITH YOUR
                TEAM
              </div>
              <h2>
                Put your available vehicles in a place customers can browse.
              </h2>
              <div className="benefit-list">
                <span>
                  <Check size={14} /> Your dealership’s brand and contact
                  details
                </span>
                <span>
                  <Check size={14} /> Mobile-friendly vehicle browsing
                </span>
                <span>
                  <Check size={14} /> Enquiry forms can feed into your CRM,
                  subject to platform and access
                </span>
                <span>
                  <Check size={14} /> Clear contact and WhatsApp buttons
                </span>
              </div>
              <div className="website-choice-actions">
                <WizardButton
                  variant={answers.websiteOptions ? "primary" : "outline"}
                  onClick={() => update("websiteOptions", true)}
                >
                  Show me website options
                </WizardButton>
                <WizardButton
                  variant={!answers.websiteOptions ? "quiet" : "quiet"}
                  onClick={() => update("websiteOptions", false)}
                >
                  Continue without a website
                </WizardButton>
              </div>
              <p className="conditional-note">
                No option is selected for you. Website scope and any fee are
                confirmed before work begins.
              </p>
            </div>
          )}
          <fieldset className="wizard-fieldset">
            <legend>
              Which social media accounts does your dealership use?{" "}
              <small>Select any that apply</small>
            </legend>
            <ToggleGrid
              columns={3}
              multiple
              value={answers.socialPlatforms}
              onChange={(value) => {
                const selected = value as SocialPlatform[];
                if (selected.includes("None yet") && selected.length > 1) {
                  update(
                    "socialPlatforms",
                    answers.socialPlatforms.includes("None yet")
                      ? selected.filter((item) => item !== "None yet")
                      : ["None yet"],
                  );
                } else update("socialPlatforms", selected);
              }}
              options={socialOptions.map((value) => ({ value, label: value }))}
            />
          </fieldset>
          {answers.socialPlatforms
            .filter((item) => item !== "None yet")
            .map((platform) => (
              <TextField
                key={platform}
                label={`${platform} profile link or handle (optional)`}
                value={answers.socialProfiles[platform] ?? ""}
                onChange={(value) =>
                  update("socialProfiles", {
                    ...answers.socialProfiles,
                    [platform]: value,
                  })
                }
                placeholder={
                  platform === "Other"
                    ? "Platform and profile"
                    : `@yourdealership on ${platform}`
                }
              />
            ))}
          <fieldset className="wizard-fieldset">
            <legend>Would you like help with social media?</legend>
            <ToggleGrid
              columns={2}
              value={answers.socialHelp}
              onChange={(value) =>
                update("socialHelp", value as OnboardingAnswers["socialHelp"])
              }
              options={[
                { value: "self", label: "I will manage it myself" },
                { value: "profile_setup", label: "Help me set up my profiles" },
                {
                  value: "ongoing",
                  label: "I want ongoing content management",
                },
                { value: "discuss", label: "I would like to discuss it first" },
              ]}
            />
          </fieldset>
          {(answers.websiteStatus === "want_one" ||
            answers.socialHelp === "profile_setup" ||
            answers.socialHelp === "ongoing" ||
            answers.socialHelp === "discuss") && (
            <div className="recommendation-note">
              <CircleHelp size={16} />
              <span>
                {answers.websiteStatus === "want_one" &&
                answers.socialHelp === "ongoing"
                  ? "A Managed plan includes the standard website service and eight approved social content pieces per month. You can also request a separate quote later."
                  : answers.websiteStatus === "want_one"
                    ? "A website can help customers browse current vehicles and contact your team. You can continue without one and decide later."
                    : "We can review profile setup or content needs with you. No social service is selected or started at this step."}
              </span>
            </div>
          )}
          <StepNavigation
            step={3}
            onBack={() => setStep(2)}
            onSkip={() => setStep(4)}
          />
        </form>
      )}

      {currentStep === 4 && (
        <form className="wizard-form" onSubmit={next}>
          <fieldset className="wizard-fieldset">
            <legend>
              How would you like to move your dealership onto MzansiMotorStack?
            </legend>
            <div className="setup-method-grid">
              <ChoiceButton
                selected={answers.setupMethod === "self_service"}
                onClick={() => {
                  update("setupMethod", "self_service");
                  update("meetingFormat", "");
                }}
                description="Add records yourself using guided steps and supported CSV templates."
              >
                Do it myself
              </ChoiceButton>
              <ChoiceButton
                selected={answers.setupMethod === "online"}
                onClick={() => {
                  update("setupMethod", "online");
                  update("meetingFormat", "online");
                }}
                description="Meet online for help preparing records, setup and a team walkthrough."
              >
                Set it up with me online
              </ChoiceButton>
              <ChoiceButton
                selected={answers.setupMethod === "in_person"}
                onClick={() => {
                  update("setupMethod", "in_person");
                  update("meetingFormat", "in_person");
                }}
                description="Request an on-site setup visit, subject to service area and confirmation."
              >
                Come and help me in person
              </ChoiceButton>
            </div>
          </fieldset>
          {answers.setupMethod === "self_service" && (
            <div className="setup-info-card">
              <b>Guided self-service</b>
              <span>
                Enter records manually or use a supported CSV import template.
                Essentials and Growth include no assisted CRM setup fee. Any
                separately selected website or managed service work remains
                subject to its own quote.
              </span>
            </div>
          )}
          {answers.setupMethod === "online" && (
            <div className="setup-info-card">
              <b>Online assistance</b>
              <span>
                We’ll request a meeting to help prepare supported records,
                configure the dealership account and staff access, then walk
                your team through the workspace.
              </span>
            </div>
          )}
          {answers.setupMethod === "in_person" && (
            <div className="setup-info-card">
              <b>In-person assistance</b>
              <span>
                Visits depend on service area and appointment confirmation.
                Travel pricing is handled separately and must be quoted and
                accepted before a visit.
              </span>
            </div>
          )}
          <fieldset className="wizard-fieldset">
            <legend>
              Where are your current records stored?{" "}
              <small>Select any that apply, or skip if you’re not sure</small>
            </legend>
            <ToggleGrid
              columns={2}
              multiple
              value={answers.recordSources}
              onChange={(value) => {
                const selected = value as string[];
                update(
                  "recordSources",
                  selected.includes("I am starting fresh")
                    ? ["I am starting fresh"]
                    : selected,
                );
              }}
              options={recordSources.map((value) => ({ value, label: value }))}
            />
          </fieldset>
          {!answers.recordSources.includes("I am starting fresh") && (
            <div className="wizard-fields two-col">
              <TextField
                label="Approximate total records"
                type="number"
                min="0"
                value={answers.recordCount}
                onChange={(value) => update("recordCount", value)}
                placeholder="Combined vehicles, customers and leads"
              />
              <fieldset className="wizard-fieldset">
                <legend>Can you export your current data?</legend>
                <ToggleGrid
                  columns={3}
                  value={answers.canExport}
                  onChange={(value) =>
                    update("canExport", value as OnboardingAnswers["canExport"])
                  }
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not_sure", label: "Not sure" },
                  ]}
                />
              </fieldset>
            </div>
          )}
          {answers.recordSources.includes("Paper records") && (
            <div className="migration-warning">
              <CircleHelp size={15} />
              <span>
                Paper transcription, extensive cleanup and unsupported formats
                need a reviewed, itemised quote. WhatsApp history is not
                automatically extracted.
              </span>
            </div>
          )}
          <div className="setup-info-card">
            <b>Supported records and secure uploads</b>
            <span>
              Import previews, field mapping, validation and duplicate review
              happen after your account is created. Secure file upload is not
              enabled until the storage service is configured.
            </span>
          </div>
          <StepNavigation
            step={4}
            onBack={() => setStep(3)}
          />
        </form>
      )}

      {currentStep === 5 && (
        <form className="wizard-form" onSubmit={next}>
          <div className="billing-switch">
            <span>Choose how you’d like to pay for the subscription</span>
            <div role="radiogroup" aria-label="Subscription billing frequency">
              <button
                type="button"
                className={
                  answers.billingInterval === "monthly" ? "active" : ""
                }
                aria-pressed={answers.billingInterval === "monthly"}
                onClick={() => update("billingInterval", "monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={answers.billingInterval === "annual" ? "active" : ""}
                aria-pressed={answers.billingInterval === "annual"}
                onClick={() => update("billingInterval", "annual")}
              >
                Annual <span>Save 10%</span>
              </button>
            </div>
          </div>
          <div className="plan-card-grid">
            {(Object.keys(planDetails) as PlanCode[]).map((plan) => {
              const detail = planDetails[plan];
              const selected = answers.plan === plan;
              return (
                <article
                  className={`plan-choice ${selected ? "selected" : ""} ${plan === "managed" ? "managed-choice" : ""}`}
                  key={plan}
                >
                  {plan === "growth" && (
                    <span className="plan-popular">GROWING DEALERSHIPS</span>
                  )}
                  {plan === "managed" && (
                    <span className="plan-popular managed-tag">
                      WE HANDLE MORE WITH YOU
                    </span>
                  )}
                  <button
                    type="button"
                    className="plan-select"
                    aria-pressed={selected}
                    onClick={() => update("plan", plan)}
                  >
                    <span className="choice-indicator">
                      {selected && <Check size={12} />}
                    </span>
                    <span>
                      <b>{detail.name}</b>
                      <small>One dealership location</small>
                    </span>
                  </button>
                  <div className="plan-price">
                    <b>{formatMoney(detail.monthly)}</b>
                    <span>/ month</span>
                  </div>
                  <div className="plan-annual">
                    {formatMoney(detail.annual)} billed upfront · saves{" "}
                    {formatMoney(detail.saving)} yearly
                  </div>
                  <div className="plan-features">
                    <span>
                      <Check size={13} /> Inventory, customers and leads
                    </span>
                    <span>
                      <Check size={13} /> Tasks, sales pipeline and standard
                      reports
                    </span>
                    <span>
                      <Check size={13} /> Follow-up reminders
                    </span>
                    <span>
                      <Check size={13} /> {detail.users} user accounts
                    </span>
                    <span
                      className={
                        plan === "essentials" ? "feature-excluded" : ""
                      }
                    >
                      <Check size={13} /> AI-assisted replies and summaries:{" "}
                      {detail.ai}
                    </span>
                    <span>
                      <Check size={13} /> {detail.website}
                    </span>
                    <span>
                      <Check size={13} /> {detail.social}
                    </span>
                    <span>
                      <Check size={13} /> {detail.support}
                    </span>
                  </div>
                  {plan !== "essentials" && (
                    <div className="ai-guardrail">
                      AI drafts need staff approval before sending. It must not
                      invent vehicle availability, discounts, finance approvals
                      or delivery promises. Usage limits and opt-in paid usage
                      will be shown before checkout.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {answers.plan && answers.setupMethod && (
            <div className="quote-preview">
              {(() => {
                const scope = getSetupScope(answers.plan, answers.setupMethod);
                return (
                  <section className="setup-scope-card" aria-labelledby="setup-scope-title">
                    <span className="panel-kicker">INCLUDED SCOPE</span>
                    <h4 id="setup-scope-title">{scope.title}</h4>
                    <ul>
                      {scope.included.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <p>{scope.excluded.join(". ")}.</p>
                    <small>For assisted imports, “total records” combines vehicles, customers and leads.</small>
                  </section>
                );
              })()}
              <div className="quote-preview-heading">
                <div>
                  <span className="panel-kicker">YOUR PROPOSED PRICING</span>
                  <h3>
                    {planDetails[answers.plan].name} ·{" "}
                    {answers.billingInterval === "annual"
                      ? "Annual upfront"
                      : "Monthly"}
                  </h3>
                </div>
                <strong>
                  {formatMoney(quote?.dueToday ?? 0)}
                  <small> proposed amount due at activation</small>
                </strong>
              </div>
              <div className="quote-lines">
                <span>
                  Subscription{" "}
                  {answers.billingInterval === "annual"
                    ? "(charged annually upfront)"
                    : "(recurring monthly)"}
                  <b>{formatMoney(quote?.subscriptionDue ?? 0)}</b>
                </span>
                <span>
                  One-time setup service
                  <b>{formatMoney(quote?.setupFee ?? 0)}</b>
                </span>
                {quote?.installments === 3 && (
                  <>
                    <span>
                      Setup instalment 1
                      <b>{formatMoney(quote.setupSchedule[0])}</b>
                    </span>
                    <span>
                      Setup instalment 2
                      <b>{formatMoney(quote.setupSchedule[1])}</b>
                    </span>
                    <span>
                      Setup instalment 3
                      <b>{formatMoney(quote.setupSchedule[2])}</b>
                    </span>
                  </>
                )}
                {answers.billingInterval === "annual" && (
                  <span>
                    Annual subscription saving
                    <b>−{formatMoney(quote?.annualSaving ?? 0)}</b>
                  </span>
                )}
              </div>
              {quote?.installments === 3 && (
                <p className="quote-explanation">
                  Setup is split into three monthly instalments. These are
                  separate from the recurring subscription; any later instalment
                  is shown in your review.
                </p>
              )}
              {answers.setupMethod === "in_person" && (
                <p className="quote-explanation">
                  Travel is not included in this subtotal. Any travel amount
                  will be quoted separately for your approval.
                </p>
              )}
              <p className="quote-pending">
                Paystack is selected for checkout. This subtotal becomes payable
                after the final tax treatment is configured. AI and messaging
                allowances will be confirmed separately.
              </p>
            </div>
          )}
          {answers.websiteOptions && answers.plan !== "managed" && (
            <div className="recommendation-note">
              <CircleHelp size={16} />
              <span>
                You asked about a website. It is not included in this plan.
                We’ll record your interest for a separate scope and quote; no
                website service is selected here.
              </span>
            </div>
          )}
          {answers.socialHelp === "ongoing" && answers.plan !== "managed" && (
            <div className="recommendation-note">
              <CircleHelp size={16} />
              <span>
                Ongoing social content is not included in this plan. We’ll
                record the request for a separate scope and quote; nothing is
                scheduled or published.
              </span>
            </div>
          )}
          {answers.setupMethod &&
            getSetupFee(answers.plan as PlanCode, answers.setupMethod) > 0 && (
              <fieldset className="wizard-fieldset">
                <legend>How would you like to pay the setup fee?</legend>
                <ToggleGrid
                  columns={2}
                  value={answers.setupPayment}
                  onChange={(value) =>
                    update(
                      "setupPayment",
                      value as OnboardingAnswers["setupPayment"],
                    )
                  }
                  options={[
                    { value: "upfront", label: "Pay setup upfront" },
                    {
                      value: "three_monthly",
                      label: "Split setup into 3 monthly instalments",
                      description:
                        "Subject to service terms; separate from subscription.",
                    },
                  ]}
                />
              </fieldset>
            )}
          <StepNavigation step={5} onBack={() => setStep(4)} />
        </form>
      )}

      {currentStep === 6 && (
        <form className="wizard-form" onSubmit={next}>
          <div className="appointment-request-banner">
            <Clock3 size={17} />
            <span>
              <b>Appointment requested, not booked</b>
              <small>
                These are your preferences. We’ll need to confirm availability
                before the meeting is reserved.
              </small>
            </span>
          </div>
          <div className="wizard-fields two-col">
            <TextField
              label="Preferred date"
              type="date"
              min={meetingDateMin}
              value={answers.preferredDate}
              onChange={(value) => update("preferredDate", value)}
              required
            />
            <TextField
              label="Preferred time (South African time)"
              type="time"
              value={answers.preferredTime}
              onChange={(value) => update("preferredTime", value)}
              required
            />
          </div>
          <div className="meeting-format-summary">
            <span>Meeting format</span>
            <b>
              {answers.setupMethod === "in_person"
                ? "In person at your dealership"
                : "Online meeting"}
            </b>
            <small>Time zone: Africa/Johannesburg</small>
          </div>
          <div className="wizard-fields two-col">
            <TextField
              label="Contact person"
              value={answers.contactPerson}
              onChange={(value) => update("contactPerson", value)}
              autoComplete="name"
              placeholder={answers.fullName}
              required
            />
            <TextField
              label="Contact phone number"
              type="tel"
              value={answers.contactPhone}
              onChange={(value) => update("contactPhone", value)}
              autoComplete="tel"
              placeholder={answers.phone}
              required
            />
          </div>
          {answers.setupMethod === "in_person" && (
            <TextField
              label="Dealership visit address"
              value={answers.appointmentAddress}
              onChange={(value) => update("appointmentAddress", value)}
              placeholder={answers.address || "Street address and suburb"}
              required
            />
          )}
          <label className="field">
            <span>Notes about your records (optional)</span>
            <textarea
              rows={3}
              value={answers.appointmentNotes}
              onChange={(event) =>
                update("appointmentNotes", event.target.value)
              }
              placeholder="What would be useful for us to know before we meet?"
            />
          </label>
          {answers.setupMethod === "in_person" && (
            <p className="quote-pending">
              Travel pricing is pending. No travel charge is included or
              accepted here.
            </p>
          )}
          <StepNavigation step={6} onBack={() => setStep(5)} />
        </form>
      )}

      {currentStep === 7 && quote && answers.plan && (
        <form className="wizard-form review-form" onSubmit={submitRequest}>
          <p className="review-intro">
            Check your details before sending the setup request. Each section
            can be changed.
          </p>
          <ReviewSection
            title="Account and dealership"
            step={2}
            onEdit={setStep}
          >
            <b>{answers.dealershipName}</b>
            <span>
              {answers.fullName} · {answers.email}
            </span>
            <span>
              {answers.phone} · {answers.city}, {answers.province}
            </span>
            <span>
              {answers.role} · {answers.staffSize} staff · {answers.stockBand}{" "}
              vehicles
            </span>
          </ReviewSection>
          <ReviewSection
            title="Website and social media"
            step={3}
            onEdit={setStep}
          >
            <span>{websiteSummary(answers)}</span>
            <span>
              {answers.socialPlatforms.length
                ? answers.socialPlatforms.join(", ")
                : "Social platforms not selected"}
            </span>
            <span>Social help: {socialHelpLabel(answers.socialHelp)}</span>
          </ReviewSection>
          <ReviewSection title="Records and setup" step={4} onEdit={setStep}>
            <span>{setupMethodLabel(answers.setupMethod as SetupMethod)}</span>
            <span>
              {answers.recordSources.length
                ? answers.recordSources.join(", ")
                : "Record source not specified"}
            </span>
            <span>
              {answers.recordCount
                ? `About ${answers.recordCount} total records`
                : "Record count not specified"}
            </span>
            {answers.setupMethod === "in_person" && (
              <span>Travel quote: pending</span>
            )}
          </ReviewSection>
          <ReviewSection
            title="Subscription and proposed amount"
            step={5}
            onEdit={setStep}
          >
            <b>
              {planDetails[answers.plan].name} ·{" "}
              {answers.billingInterval === "annual"
                ? "Annual, charged upfront"
                : "Monthly"}
            </b>
            <span>
              Subscription: {formatMoney(quote.subscriptionDue)}{" "}
              {answers.billingInterval === "monthly" ? "per month" : "per year"}
            </span>
            <span>
              Setup fee: {formatMoney(quote.setupFee)}
              {quote.installments === 3
                ? ` in 3 parts (${quote.setupSchedule.map(formatMoney).join(" + ")})`
                : ""}
            </span>
            <b>
              Proposed amount due at activation: {formatMoney(quote.dueToday)}
            </b>
            <span>
              Renewal: {formatMoney(quote.recurringRenewal)}{" "}
              {answers.billingInterval === "monthly" ? "monthly" : "annually"}
            </span>
          </ReviewSection>
          {answers.setupMethod !== "self_service" && (
            <ReviewSection
              title="Assistance appointment"
              step={6}
              onEdit={setStep}
            >
              <b>Requested · confirmation pending</b>
              <span>
                {answers.preferredDate} at {answers.preferredTime} ·
                Africa/Johannesburg
              </span>
              <span>
                {answers.meetingFormat === "in_person"
                  ? answers.appointmentAddress
                  : "Online"}
              </span>
              <span>
                {answers.contactPerson} · {answers.contactPhone}
              </span>
            </ReviewSection>
          )}
          <div className="final-amount">
            <span>CHARGE DUE TODAY</span>
            <strong>{formatMoney(quote.dueToday)}</strong>
            <small>
              VAT treatment must be configured before checkout can proceed.
            </small>
            <small>
              The subscription renews automatically monthly or annually. Any
              remaining setup instalments are charged monthly and do not change
              the subscription renewal date.
            </small>
          </div>
          <label className="consent-check">
            <input type="checkbox" checked={answers.termsAccepted} onChange={(event) => update("termsAccepted", event.target.checked)} required />
            <span>I accept the <Link to="/terms" target="_blank">service terms</Link>.</span>
          </label>
          <label className="consent-check">
            <input type="checkbox" checked={answers.privacyAcknowledged} onChange={(event) => update("privacyAcknowledged", event.target.checked)} required />
            <span>I have read the <Link to="/privacy" target="_blank">privacy notice</Link>.</span>
          </label>
          <label className="consent-check final-confirm">
            <input type="checkbox" required />
            <span>
              I authorize Paystack to charge the amount shown today and to set
              up recurring card payments for the selected subscription. If I
              chose three setup instalments, I also authorize the two remaining
              monthly instalments shown above.
            </span>
          </label>
          {error && (
            <p className="inline-notice wizard-error" role="alert">
              {error}
            </p>
          )}
          <div className="wizard-navigation">
            <WizardButton
              variant="quiet"
              onClick={() =>
                setStep(answers.setupMethod === "self_service" ? 5 : 6)
              }
            >
              <ArrowLeft size={15} /> Back
            </WizardButton>
            <WizardButton type="submit" disabled={busy}>
              {busy ? (
                "Opening secure checkout…"
              ) : (
                <>
                  Continue to Paystack <ArrowRight size={15} />
                </>
              )}
            </WizardButton>
          </div>
          <p className="auth-legal">
            Paystack checkout will open in a secure window. Your card details
            are entered on Paystack, and recurring charges start on the selected
            billing schedule. Checkout remains unavailable until the final tax
            treatment is configured.
          </p>
        </form>
      )}
    </WizardFrame>
  );
}

function ReviewSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="review-section">
      <div className="review-section-header">
        <h2>{title}</h2>
        <button type="button" onClick={() => onEdit(step)}>
          Change
        </button>
      </div>
      <div className="review-section-body">{children}</div>
    </section>
  );
}

const stepDescriptions = [
  "Create your owner account. We’ll verify your email before you continue.",
  "Tell us a little about the dealership. We’ll add one starting location for you.",
  "Optional questions. Skip anything you’re not ready to decide.",
  "Choose how you’d like help moving your records and team across.",
  "Compare the plans and review the proposed subscription and setup amounts.",
  "Share a preferred time. We’ll confirm it before any appointment is booked.",
  "Review the scope and payment schedule before continuing to Paystack checkout.",
];

function websiteSummary(answers: OnboardingAnswers) {
  const labels: Record<string, string> = {
    happy: "Website in place; happy with it",
    needs_improvement: "Website needs improvement",
    want_one: "Would like a website",
    not_now: "No website for now",
  };
  const label = labels[answers.websiteStatus] ?? "Website question skipped";
  return answers.websiteUrl ? `${label} · ${answers.websiteUrl}` : label;
}

function socialHelpLabel(value: OnboardingAnswers["socialHelp"]) {
  return {
    self: "I’ll manage it",
    profile_setup: "Help setting up profiles",
    ongoing: "Ongoing content management",
    discuss: "Discuss first",
    "": "Not specified",
  }[value];
}

function setupMethodLabel(value: SetupMethod) {
  return {
    self_service: "Do it myself",
    online: "Set it up with me online",
    in_person: "In-person assistance requested",
  }[value];
}

function LegalNoticesRequired() {
  return (
    <WizardFrame>
      <div className="eyebrow">
        <span className="eyebrow-dot" /> ACCOUNT SETUP
      </div>
      <h1 className="config-title">Service terms need approval</h1>
      <p className="auth-intro">
        Production signup is paused until the final service terms and privacy
        notice are approved and their versions are configured. The current pages
        are product previews, not binding legal documents.
      </p>
      <div className="config-card">
        <b>Required before enabling production signup</b>
        <span>Publish the approved service terms and privacy notice.</span>
        <code>VITE_SERVICE_TERMS_STATUS=approved</code>
        <code>VITE_SERVICE_TERMS_VERSION=your-approved-version</code>
        <code>VITE_PRIVACY_NOTICE_STATUS=approved</code>
        <code>VITE_PRIVACY_NOTICE_VERSION=your-approved-version</code>
        <small>
          Set the same versions in Supabase pricing configuration so acceptance
          timestamps match the published documents.
        </small>
      </div>
      <WizardButton
        variant="outline"
        onClick={() => window.location.assign("/demo")}
      >
        Explore the sample demo <ArrowRight size={15} />
      </WizardButton>
    </WizardFrame>
  );
}

