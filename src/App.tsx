import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  CarFront,
  Check,
  ChevronDown,
  Clock3,
  CircleHelp,
  Command,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
const OnboardingWizard = lazy(() => import("./onboarding/OnboardingWizard").then(module => ({ default: module.OnboardingWizard })));
import { appMode, hasApprovedLegalNotices, supabase } from "./lib/config";
import { formatMoney, getSetupFee, planDetails, type PlanCode } from "./lib/onboarding";
import { AcceptInvitePage, AccountPage, ClerkLogoutButton, ClerkProtected, ClerkSignInPage, ClerkSignUpPage, InviteStaffPage } from "./auth/ClerkAuth";
import { useAuth } from "@clerk/react";

type Workspace = { name: string; email: string; branch: string };
const zarFormatter = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""} ${compact ? "brand-compact" : ""}`}
      to="/"
      aria-label="MzansiMotorStack home"
    >
      {compact ? (
        <img className="brand-road-mark" src="/brand/mzansi-road-mark.png" alt="" width="32" height="32" />
      ) : (
        <img className="brand-wordmark" src="/brand/mzansi-motorstack-wordmark.png" alt="" width="180" height="60" />
      )}
    </Link>
  );
}

function Button({
  children,
  to,
  variant = "primary",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  to?: string;
  variant?: "primary" | "dark" | "light" | "quiet" | "outline";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `button button-${variant} ${className}`;
  return to ? (
    <Link to={to} className={classes}>
      {children}
    </Link>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const location = useLocation();
  const onHome = location.pathname === "/";
  useEffect(() => {
    let previousY = window.scrollY;
    const onScroll = () => {
      const nextY = window.scrollY;
      if (Math.abs(nextY - previousY) > 5 && !menuOpen) setHeaderHidden(nextY > previousY && nextY > 100);
      previousY = nextY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  return (
    <header className={`site-header page-wrap ${headerHidden && !menuOpen ? "site-header-hidden" : ""}`} onFocusCapture={() => setHeaderHidden(false)}>
      <div className="site-header-panel">
        <Brand />
        <nav className="site-nav" aria-label="Main navigation">
          <a href={onHome ? "#platform" : "/#platform"}>Platform</a>
          <a href={onHome ? "#how-it-works" : "/#how-it-works"}>How it works</a>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/privacy">Privacy</NavLink>
          <NavLink to="/terms">Terms</NavLink>
        </nav>
        <div className="header-utilities">
          <Link to="/demo">Try demo</Link>
          <Link to="/login">Sign in</Link>
        </div>
        <button className="public-menu-toggle icon-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-controls="public-mobile-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <Button to="/start" className="header-cta"><span className="header-cta-long">Start your workspace</span><span className="header-cta-short">Start</span><ArrowRight size={16} /></Button>
      <nav id="public-mobile-nav" className={`public-mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Mobile navigation" hidden={!menuOpen}>
        <a href={onHome ? "#platform" : "/#platform"} onClick={() => setMenuOpen(false)}>Platform</a>
        <a href={onHome ? "#how-it-works" : "/#how-it-works"} onClick={() => setMenuOpen(false)}>How it works</a>
        <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
        <Link to="/demo" onClick={() => setMenuOpen(false)}>Try demo</Link>
        <Link to="/tutorial" onClick={() => setMenuOpen(false)}>Setup tutorial</Link>
        <Link to="/privacy" onClick={() => setMenuOpen(false)}>Privacy policy</Link>
        <Link to="/terms" onClick={() => setMenuOpen(false)}>Terms of service</Link>
        <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
      </nav>
    </header>
  );
}

function Landing() {
  return (
    <div className="landing">
      <PublicHeader />

      <main>
        <section className="hero page-wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> A clearer day at the dealership
            </div>
            <h1>
              Good deals start with <span>a better view.</span>
            </h1>
            <p className="hero-lede">
              Keep your stock, leads and daily work moving together. Start with
              your dealership, then make the workspace your own.
            </p>
            <div className="hero-actions">
              <Button to="/start">
                Create your company workspace <ArrowRight size={17} />
              </Button>
              <Button to="/demo" variant="outline">
                Explore the demo
              </Button>
            </div>
            <div className="hero-footnote">
              <ShieldCheck size={15} /> Set up for independent dealerships and
              growing groups
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Preview of the mzansiMotorStack dealership dashboard"
          >
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="float-tag float-tag-stock">
              <span className="tag-icon">
                <CarFront size={15} />
              </span>
              <span>
                <b>Stock overview</b>
                <small>Clear from day one</small>
              </span>
              <ArrowUpRight size={15} />
            </div>
            <div className="dashboard-preview">
              <div className="preview-top">
                <div>
                  <span className="preview-caption">YOUR WORKSPACE</span>
                  <strong>Today at a glance</strong>
                </div>
                <span className="preview-avatar">M</span>
              </div>
              <div className="preview-metrics">
                <div className="preview-metric">
                  <span>On the floor</span>
                  <strong>24</strong>
                  <small>
                    <span className="metric-up">+3</span> this month
                  </small>
                </div>
                <div className="preview-metric">
                  <span>New enquiries</span>
                  <strong>08</strong>
                  <small>Ready for follow-up</small>
                </div>
              </div>
              <div className="preview-divider" />
              <div className="preview-row-title">
                <span>Recently added</span>
                <span>
                  See stock <ArrowRight size={12} />
                </span>
              </div>
              <div className="vehicle-row">
                <div className="vehicle-thumb vehicle-thumb-sand">
                  <CarSketch variant="sand" />
                </div>
                <div className="vehicle-name">
                  <strong>Volkswagen Polo</strong>
                  <span>2021 · 1.0 TSI Comfortline</span>
                </div>
                <span className="vehicle-price">R 239 900</span>
              </div>
              <div className="vehicle-row">
                <div className="vehicle-thumb vehicle-thumb-green">
                  <CarSketch variant="green" />
                </div>
                <div className="vehicle-name">
                  <strong>Toyota Corolla Cross</strong>
                  <span>2022 · 1.8 XS CVT</span>
                </div>
                <span className="vehicle-price">R 319 900</span>
              </div>
              <div className="preview-bottom">
                <span className="preview-status">
                  <i /> All systems ready
                </span>
                <span>Workspace preview</span>
              </div>
            </div>
            <div className="float-tag float-tag-flow">
              <span className="flow-spark">
                <Sparkles size={15} />
              </span>
              <span>
                <b>One place to begin</b>
                <small>Built around your team</small>
              </span>
            </div>
            <div className="hero-note">
              <span className="note-line" /> For the people behind every sale
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="page-wrap trust-inner">
            <span>MADE FOR THE WAY DEALERSHIPS WORK</span>
            <span className="trust-sep" />
            <span>Independent teams</span>
            <span>Multi-branch groups</span>
            <span>Growing businesses</span>
          </div>
        </section>

        <section className="platform-section page-wrap" id="platform">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> One workspace, your way
              </div>
              <h2>
                Less chasing.
                <br />
                More moving forward.
              </h2>
            </div>
            <p>
              Start with a company workspace that gives your people a shared
              picture of what needs attention, while each dealership keeps its
              own footing.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-card-stock">
              <div className="feature-icon">
                <CarFront size={19} />
              </div>
              <span className="feature-index">01 / STOCK</span>
              <h3>Know what’s on the floor.</h3>
              <p>
                Keep vehicle details and stock status easy to find, so the team
                can spend less time looking and more time doing.
              </p>
              <div className="feature-mini-stock">
                <span>
                  <i className="stock-dot dot-green" /> Available
                </span>
                <span>
                  <i className="stock-dot dot-amber" /> In preparation
                </span>
                <span>
                  <i className="stock-dot dot-grey" /> Reserved
                </span>
              </div>
            </article>
            <article className="feature-card feature-card-leads">
              <div className="feature-icon">
                <UsersRound size={19} />
              </div>
              <span className="feature-index">02 / PEOPLE</span>
              <h3>Keep every conversation in view.</h3>
              <p>
                Give new enquiries and follow-ups a clear home, so good
                opportunities don’t get lost between busy days.
              </p>
              <div className="lead-avatars">
                <span>TN</span>
                <span>AM</span>
                <span>SK</span>
                <small>One team, moving together</small>
              </div>
            </article>
            <article className="feature-card feature-card-day">
              <div className="feature-icon">
                <Gauge size={19} />
              </div>
              <span className="feature-index">03 / DAILY WORK</span>
              <h3>Start the day knowing where to look.</h3>
              <p>
                Bring important tasks and next steps into one calm view, ready
                for your team to pick up.
              </p>
              <div className="day-checks">
                <span>
                  <Check size={13} /> Follow up with a new buyer
                </span>
                <span>
                  <Check size={13} /> Confirm vehicle preparation
                </span>
              </div>
            </article>
          </div>
        </section>

        <section className="start-section" id="how-it-works">
          <div className="page-wrap start-wrap">
            <div className="start-copy">
              <div className="eyebrow eyebrow-light">
                <span className="eyebrow-dot" /> Your company, your starting
                point
              </div>
              <h2>
                It starts with
                <br />
                your dealership.
              </h2>
              <p>
                Create your company space, add your first branch and invite the
                people you work with. You choose how your workspace grows.
              </p>
              <Button to="/start" variant="light">
                Set up your company <ArrowRight size={16} />
              </Button>
              <div className="setup-note">
                <LockKeyhole size={14} /> Setup is a frontend preview until
                accounts are connected.
              </div>
            </div>
            <div className="start-steps">
              <div className="start-step">
                <span className="step-number">01</span>
                <div>
                  <strong>Set up your company</strong>
                  <p>Give your workspace a name and choose who it’s for.</p>
                </div>
                <Building2 size={19} />
              </div>
              <div className="step-rule" />
              <div className="start-step">
                <span className="step-number">02</span>
                <div>
                  <strong>Make it yours</strong>
                  <p>
                    Add your first branch and choose a few starting details.
                  </p>
                </div>
                <Settings2 size={19} />
              </div>
              <div className="step-rule" />
              <div className="start-step">
                <span className="step-number">03</span>
                <div>
                  <strong>Bring your team in</strong>
                  <p>Shape a shared place to manage the work ahead.</p>
                </div>
                <UsersRound size={19} />
              </div>
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
      <footer className="site-footer page-wrap">
        <Brand />
        <span>Dealership operations, with room to grow.</span>
        <div>
          <Link to="/pricing">Pricing</Link>
          <Link to="/tutorial">Setup tutorial</Link>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of service</Link>
          <a href="#contact">Contact</a>
          <Link to="/login">Sign in</Link>
          <Link to="/start">Create workspace</Link>
        </div>
        <small>© 2026 mzansiMotorStack</small>
      </footer>
    </div>
  );
}

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const signupReady = appMode === "production" && hasApprovedLegalNotices;

  return (
    <div className="tutorial-page">
      <PublicHeader />
      <main className="page-wrap pricing-main">
        <div className="eyebrow"><span className="eyebrow-dot" /> Plans for growing dealerships</div>
        <div className="pricing-intro">
          <div>
            <h1>Clear plans.<br /><span>Room to grow.</span></h1>
            <p>Choose a starting point for one dealership location. Compare the subscription, then review any setup work and the final quote during onboarding.</p>
          </div>
          <div className="billing-switch" role="group" aria-label="Billing interval">
            <button type="button" className={billing === "monthly" ? "selected" : ""} aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>Monthly</button>
            <button type="button" className={billing === "annual" ? "selected" : ""} aria-pressed={billing === "annual"} onClick={() => setBilling("annual")}>Annual</button>
          </div>
        </div>
        <div className="pricing-grid">
          {(Object.entries(planDetails) as [PlanCode, (typeof planDetails)[PlanCode]][]).map(([code, plan]) => (
            <article className={`pricing-card ${code === "growth" ? "pricing-card-featured" : ""}`} key={code}>
              <div className="pricing-card-top"><span className="pricing-card-index">{code === "essentials" ? "01" : code === "growth" ? "02" : "03"} / PLAN</span>{code === "growth" && <span className="pricing-badge">For growing teams</span>}</div>
              <h2>{plan.name}</h2>
              <p className="pricing-card-description">{code === "essentials" ? "The daily essentials for a small dealership team." : code === "growth" ? "More seats and support as your operation expands." : "A broader service with a managed website and social content."}</p>
              <div className="pricing-amount"><strong>{formatMoney(billing === "monthly" ? plan.monthly : plan.annual)}</strong><span>/{billing === "monthly" ? "month" : "year"}</span></div>
              <p className="pricing-billing-note">{billing === "monthly" ? `${formatMoney(plan.annual)} if billed annually · save ${formatMoney(plan.saving)}` : `Billed upfront · save ${formatMoney(plan.saving)} against 12 monthly payments`}</p>
              <Button to={signupReady ? "/start" : "/demo"} variant={code === "growth" ? "primary" : "outline"}>{signupReady ? "Continue to setup" : "Explore the demo"} <ArrowRight size={16} /></Button>
              <div className="pricing-features">
                <span><Check size={16} /> Stock, leads, tasks and sales pipeline</span>
                <span><Check size={16} /> {plan.users} user accounts</span>
                <span><Check size={16} /> {plan.support}</span>
                <span><Check size={16} /> AI: {plan.ai}</span>
                <span><Check size={16} /> Website: {plan.website}</span>
                <span><Check size={16} /> Social: {plan.social}</span>
              </div>
            </article>
          ))}
        </div>
        <section className="pricing-detail" aria-labelledby="pricing-setup-title">
          <div><span className="panel-kicker">BEFORE CHECKOUT</span><h2 id="pricing-setup-title">Setup and billing, upfront.</h2><p>Guided self-service has no assisted CRM migration fee on Essentials or Growth. Managed self-service includes a separate {formatMoney(getSetupFee("managed", "self_service"))} launch setup fee.</p></div>
          <div><h3>Assisted online setup</h3><ul>{(Object.entries(planDetails) as [PlanCode, (typeof planDetails)[PlanCode]][]).map(([code, plan]) => <li key={code}><span>{plan.name}</span><strong>{formatMoney(getSetupFee(code, "online"))}</strong></li>)}</ul><p>In-person assistance, unsupported imports, domain costs and advertising are quoted separately. Setup fees may be paid upfront or in three monthly instalments where offered.</p></div>
        </section>
        <p className="pricing-disclaimer">Prices are shown in ZAR. VAT treatment, AI usage allowances and any optional services must be confirmed in your final quote before checkout. {!signupReady && "The demo cannot create a paid plan; production signup remains paused until pricing and legal notices are approved."}</p>
        <div className="pricing-next"><span>Want to see the workspace first?</span><Button to="/demo" variant="dark">Explore the demo <ArrowRight size={16} /></Button></div>
      </main>
      <PublicFooter />
    </div>
  );
}

function ContactSection() {
  const [notice, setNotice] = useState(false);
  return (
    <section className="contact-section" id="contact">
      <div className="page-wrap contact-wrap">
        <div className="contact-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> Let’s talk about your setup
          </div>
          <h2>A better start begins with a conversation.</h2>
          <p>
            Tell us a little about your dealership and what you’d like to make
            easier. This preview form will show its validation, but it won’t
            send or save your message.
          </p>
          <div className="contact-side-note">
            <ShieldCheck size={16} /> Your details stay in this browser preview.
          </div>
        </div>
        <form
          className="contact-form"
          onSubmit={(event) => {
            event.preventDefault();
            setNotice(true);
          }}
        >
          <label className="field">
            <span>Your name</span>
            <input
              required
              name="name"
              autoComplete="name"
              placeholder="Name and surname"
            />
          </label>
          <label className="field">
            <span>Work email</span>
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@yourdealership.co.za"
            />
          </label>
          <label className="field">
            <span>Dealership</span>
            <input
              required
              name="company"
              autoComplete="organization"
              placeholder="Your company name"
            />
          </label>
          <label className="field">
            <span>What would you like help with?</span>
            <textarea
              required
              name="message"
              rows={3}
              placeholder="A little about your team and how you work…"
            />
          </label>
          {notice && (
            <p className="inline-notice" role="status">
              Thanks for trying the form. No message was sent or saved because
              contact is not connected yet.
            </p>
          )}
          <Button className="form-submit" type="submit">
            Preview contact form <ArrowRight size={16} />
          </Button>
          <small className="contact-disclaimer">
            Frontend preview only · No message is sent
          </small>
        </form>
      </div>
    </section>
  );
}

function Tutorial() {
  return (
    <div className="tutorial-page">
      <PublicHeader />
      <main className="page-wrap tutorial-main">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> A beginner-friendly walkthrough
        </div>
        <h1>
          Get to know your
          <br />
          <span>workspace preview.</span>
        </h1>
        <p className="tutorial-lede">
          The screens are ready to explore. Accounts and storage aren’t
          connected yet, so this guide walks through what you can try today and
          what still needs to be configured.
        </p>
        <div className="tutorial-banner">
          <ShieldCheck size={17} />
          <span>
            <b>Frontend preview only</b>
            <small>
              Nothing you enter here creates an account, saves business data, or
              sends a message.
            </small>
          </span>
        </div>
        <div className="tutorial-grid">
          <aside className="tutorial-contents">
            <span>IN THIS GUIDE</span>
            <a href="#local">Run it locally</a>
            <a href="#explore">Explore the demo</a>
            <a href="#workspace">Start a workspace</a>
            <a href="#later">Before going live</a>
          </aside>
          <div className="tutorial-steps">
            <article className="tutorial-step" id="local">
              <span className="tutorial-number">01</span>
              <div>
                <h2>Run the frontend locally</h2>
                <p>
                  Install a supported Node.js release and npm, open the project
                  folder in PowerShell, then start the Vite development server.
                </p>
                <pre>
                  <code>
                    npm install
                    <br />
                    npm run dev
                  </code>
                </pre>
                <p>
                  Open the local address printed in the terminal. To create a
                  production build, run{" "}
                  <code className="inline-code">npm run build</code>.
                </p>
              </div>
            </article>
            <article className="tutorial-step" id="explore">
              <span className="tutorial-number">02</span>
              <div>
                <h2>Explore a sample dealership</h2>
                <p>
                  The demo uses fictional vehicles, enquiries and tasks. Move
                  through Overview, Stock, Leads and My day from the left
                  navigation.
                </p>
                <Button to="/demo" variant="outline">
                  Open the demo <ArrowRight size={15} />
                </Button>
              </div>
            </article>
            <article className="tutorial-step" id="workspace">
              <span className="tutorial-number">03</span>
              <div>
                <h2>Set up a company preview</h2>
                <p>
                  Enter a company name, work email and password, then add a
                  branch and choose a team size. The next screen uses those
                  details in a local workspace preview.
                </p>
                <p>
                  Your details stay in the current browser session only.
                  Refreshing or closing the page clears this preview.
                </p>
                <Button to="/start">
                  Start company setup <ArrowRight size={15} />
                </Button>
              </div>
            </article>
            <article className="tutorial-step" id="later">
              <span className="tutorial-number">04</span>
              <div>
                <h2>What’s needed before real use</h2>
                <p>
                  Real sign-in, password recovery, invitations, branch
                  permissions and saved records need a configured backend. They
                  are not active in this preview. Production setup also needs
                  reviewed access policies, migrations, backups and deployment
                  checks.
                </p>
                <Button to="/privacy" variant="quiet">
                  Read the data notice <ArrowRight size={15} />
                </Button>
              </div>
            </article>
          </div>
        </div>
        <div className="tutorial-bottom">
          <span>Want to see what the interface looks like first?</span>
          <Button to="/demo" variant="dark">
            Explore the sample workspace <ArrowRight size={15} />
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function PrivacyNotice() {
  return (
    <div className="tutorial-page">
      <PublicHeader />
      <main className="page-wrap privacy-main">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> Draft notice · pending approval
        </div>
        <h1>Privacy policy</h1>
        <p className="tutorial-lede">
          Here is how the demo and planned production service handle information.
          This draft needs operator details, retention periods and legal review
          before production signup can open.
        </p>
        <div className="privacy-cards">
          <article>
            <span className="privacy-icon">
              <UsersRound size={18} />
            </span>
            <h2>Public demo</h2>
            <p>
              The sample workspace uses fictional dealership records. The home
              page contact form validates in your browser but does not send its
              message. Demo onboarding keeps progress in the browser session.
            </p>
          </article>
          <article>
            <span className="privacy-icon">
              <LockKeyhole size={18} />
            </span>
            <h2>Account and workspace data</h2>
            <p>
              When production services are configured, Clerk handles account
              identity. Supabase stores dealership setup details, memberships
              and operational records for the selected workspace.
            </p>
          </article>
          <article>
            <span className="privacy-icon">
              <Building2 size={18} />
            </span>
            <h2>Billing details</h2>
            <p>
              Paystack is the selected payment provider for checkout when live
              billing is enabled. The app stores billing status and references;
              payment card entry takes place with the provider.
            </p>
          </article>
        </div>
        <section className="legal-sections" aria-label="Privacy details">
          <article><h2>Why information is used</h2><p>Account and dealership details are used to set up access, manage the selected workspace, record service requests and support billing. Vehicle, lead and task records are used for the dealership workflows chosen by its team. Marketing email is a separate opt-in during onboarding.</p></article>
          <article><h2>Your choices and requests</h2><p>Account details can be reviewed in the account area when sign-in is configured. Requests to access, correct or delete personal information, and objections to processing, need a published operator contact before launch. South Africa’s <a href="https://inforegulator.org.za/" target="_blank" rel="noreferrer">Information Regulator</a> explains the rights available under POPIA.</p></article>
          <article><h2>Before this notice is final</h2><p>The responsible operator’s legal name and contact details, exact provider locations, retention periods, security and deletion procedures, and any analytics or marketing services must be confirmed and published. No production consent version should be marked approved until that review is complete.</p></article>
        </section>
        <div className="privacy-next">
          <h2>Explore the other public pages</h2>
          <p>
            Compare the subscription plans and read the draft service scope
            before starting a workspace.
          </p>
          <div className="legal-links"><Button to="/pricing" variant="outline">View pricing <ArrowRight size={15} /></Button><Button to="/terms" variant="outline">Read terms <ArrowRight size={15} /></Button></div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function TermsNotice() {
  return (
    <div className="tutorial-page">
      <PublicHeader />
      <main className="page-wrap privacy-main">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> Draft terms · pending approval
        </div>
        <h1>Terms of service</h1>
        <p className="tutorial-lede">
          This is the proposed service scope for review, not a final agreement.
          Production signup remains paused until approved terms are published.
        </p>
        <section className="legal-sections" aria-label="Service terms details">
          <article><h2>Plans and locations</h2><p>Each subscription covers one dealership location and the features listed for the selected plan. User limits and included website, social and support services vary by plan. The selected billing interval and amount are shown in the quote before checkout.</p></article>
          <article><h2>Setup and extra work</h2><p>Guided self-service and assisted setup have different fees and scopes. Imports are limited to supported formats and the accepted record count. Complex cleanup, paper transcription, custom integrations, travel, domains, advertising and paid usage need a separate reviewed quote unless expressly included.</p></article>
          <article><h2>Approval and payment</h2><p>Website drafts and social content require dealership approval before publication. Staff approve AI-assisted replies before sending. A subscription becomes active only after the configured payment provider verifies payment. Final VAT treatment and usage allowances must be shown before checkout.</p></article>
          <article><h2>Final agreement required</h2><p>Cancellation, renewals, refunds, support commitments, operator identity, dispute process and other binding terms still need approval. These draft terms cannot be used as the production service agreement.</p></article>
        </section>
        <div className="privacy-next">
          <h2>Review the plans and data notice</h2>
          <p>
            The public pricing page uses the same plan values as onboarding.
            The privacy page describes the information the app may process.
          </p>
          <div className="legal-links"><Button to="/pricing" variant="outline">View pricing <ArrowRight size={15} /></Button><Button to="/privacy" variant="outline">Read privacy policy <ArrowRight size={15} /></Button></div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="site-footer page-wrap">
      <Brand />
      <span>Dealership operations, with room to grow.</span>
      <div>
        <Link to="/pricing">Pricing</Link>
        <Link to="/tutorial">Tutorial</Link>
        <Link to="/privacy">Privacy policy</Link>
        <Link to="/terms">Terms of service</Link>
        <Link to="/demo">Try demo</Link>
        <Link to="/">Home</Link>
      </div>
      <small>© 2026 mzansiMotorStack</small>
    </footer>
  );
}

function CarSketch({ variant }: { variant: "sand" | "green" }) {
  return (
    <svg viewBox="0 0 160 70" role="img" aria-label="Vehicle illustration">
      <path
        d="M22 47h12l8-18c2-5 6-8 11-8h45c5 0 9 2 13 6l15 15 12 3c3 1 5 3 5 6v4H19v-3c0-3 1-5 3-5Z"
        fill={variant === "sand" ? "#B29A75" : "#4D7165"}
      />
      <path
        d="m48 30-6 14h42V25H55c-3 0-5 2-7 5Zm42-5v19h39l-14-14c-2-3-5-5-9-5H90Z"
        fill="#DCE4D8"
        opacity=".84"
      />
      <path
        d="M30 48h14m65 0h20"
        stroke="#29342F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="49" cy="54" r="8" fill="#27312E" />
      <circle cx="49" cy="54" r="3" fill="#D4D9D0" />
      <circle cx="122" cy="54" r="8" fill="#27312E" />
      <circle cx="122" cy="54" r="3" fill="#D4D9D0" />
      <path
        d="m24 46 7-1m103 0 8 2"
        stroke="#F1D77A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navItems = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/stock", label: "Stock", icon: CarFront },
  { to: "/app/leads", label: "Leads", icon: UsersRound },
  { to: "/app/tasks", label: "My day", icon: Check },
];

type OnboardingRequestSummary = {
  plan_code: string;
  billing_interval: string;
  status: string;
  payment_status: string;
  subscription_amount_minor: number;
  due_today_minor: number;
  setup_fee_minor: number;
  setup_installments: number;
  setup_schedule_minor: number[];
  tax_status: string;
};

function AppShell({ workspace, preview = false, identityKey = "" }: { workspace: Workspace | null; preview?: boolean; identityKey?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [accountMenu, setAccountMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [liveWorkspace, setLiveWorkspace] = useState<Workspace | null>(null);
  const [requestSummary, setRequestSummary] = useState<OnboardingRequestSummary | null>(null);
  const [serviceRequests, setServiceRequests] = useState<{ service_code: string; status: string }[]>([]);
  const [appointmentStatus, setAppointmentStatus] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);
  const location = useLocation();
  const isPreview = preview || appMode === "demo";
  const normalizedPath = location.pathname.startsWith("/demo")
    ? location.pathname.replace(/^\/demo/, "/app") || "/app"
    : location.pathname;
  const activeWorkspace = isPreview ? workspace : liveWorkspace;

  useEffect(() => {
    if (!menuOpen && !accountMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setAccountMenu(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen, accountMenu]);

  useEffect(() => {
    if (isPreview || appMode !== "production" || !supabase) return;
    let active = true;
    setLiveWorkspace(null);
    setProfileName("");
    setRequestSummary(null);
    setServiceRequests([]);
    setAppointmentStatus(null);
    setLiveLoading(true);
    void (async () => {
      try {
        const [organizationResult, profileResult] = await Promise.all([
          supabase.from("organizations").select("id, name, city, province").order("created_at", { ascending: true }).limit(1).maybeSingle(),
          supabase.from("profiles").select("full_name").maybeSingle(),
        ]);
        if (!active) return;
        if (organizationResult.error) throw organizationResult.error;
        if (profileResult.data) setProfileName(profileResult.data.full_name);
        if (!organizationResult.data) {
          setLiveWorkspace(null);
          return;
        }
        const organization = organizationResult.data;
        setLiveWorkspace({ name: organization.name, email: "", branch: `${organization.city}, ${organization.province}` });
        const [requestResult, servicesResult, appointmentResult] = await Promise.all([
          supabase.from("onboarding_requests").select("plan_code,billing_interval,status,payment_status,subscription_amount_minor,due_today_minor,setup_fee_minor,setup_installments,setup_schedule_minor,tax_status").eq("organization_id", organization.id).maybeSingle(),
          supabase.from("service_requests").select("service_code,status").eq("organization_id", organization.id),
          supabase.from("appointment_requests").select("status").eq("organization_id", organization.id).maybeSingle(),
        ]);
        if (!active) return;
        if (requestResult.data) setRequestSummary(requestResult.data as OnboardingRequestSummary);
        if (servicesResult.data) setServiceRequests(servicesResult.data);
        if (appointmentResult.data) setAppointmentStatus(appointmentResult.data.status);
      } catch {
        if (active) setToast("We couldn’t load this workspace. Check your connection and try again.");
      } finally {
        if (active) setLiveLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isPreview, identityKey]);

  const titleMap: Record<string, { title: string; sub: string }> = {
    "/app": {
      title: "Good morning, Alex",
      sub: "Here’s what’s happening with your dealership today.",
    },
    "/app/stock": {
      title: "Your stock",
      sub: "A clear view of the vehicles in your workspace.",
    },
    "/app/leads": {
      title: "Customer enquiries",
      sub: "Keep conversations moving, one next step at a time.",
    },
    "/app/tasks": {
      title: "Your day",
      sub: "The work you have lined up for today.",
    },
    "/app/components": {
      title: "Component gallery",
      sub: "Reusable controls and states used across the workspace.",
    },
  };
  const page = isPreview
    ? titleMap[normalizedPath] ?? titleMap["/app"]
    : normalizedPath === "/app"
      ? { title: activeWorkspace ? `Welcome to ${activeWorkspace.name}` : "Your dealership workspace", sub: "Your setup request and first steps are kept together here." }
      : titleMap[normalizedPath] ?? titleMap["/app"];
  return (
    <div className="app-shell">
      <div className="workspace-header">
      <aside id="workspace-navigation" className={`app-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-head">
          <Brand light />
          <button
            className="sidebar-close icon-button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="company-switcher">
          <span className="company-avatar">
            {(activeWorkspace?.name ?? "MM").slice(0, 2).toUpperCase()}
          </span>
          <span className="company-info">
            <b>{activeWorkspace?.name || "Mzansi Motors"}</b>
            <small>{activeWorkspace?.branch || "Company workspace"}</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="app-nav" aria-label="Workspace navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={isPreview ? item.to.replace("/app", "/demo") : item.to}
              end={"end" in item ? item.end : false}
              className={({ isActive }) =>
                `app-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <item.icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.label === "Leads" && <i className="nav-count">3</i>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        {isPreview ? <Link className="sidebar-help" to="/demo/components" onClick={() => setMenuOpen(false)}>
          <span className="help-icon"><CircleHelp size={17} /></span>
          <div><b>Component gallery</b><small>Explore the design system.</small></div>
          <ArrowUpRight size={14} />
        </Link> : <div className="sidebar-help">
          <span className="help-icon"><CircleHelp size={17} /></span>
          <div><b>New here?</b><small>Build your workspace as you go.</small></div>
          <ArrowUpRight size={14} />
        </div>}
        <div className="profile-row">
            <span className="profile-avatar">{profileName ? profileName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() : "AM"}</span>
          <span className="profile-info">
              <b>{profileName || (isPreview ? "Alex Morgan" : "Dealership member")}</b>
              <small>{isPreview ? "Workspace owner · Preview" : "Signed-in member"}</small>
          </span>
            <button className="icon-button account-menu-button" aria-label="Account options" aria-expanded={accountMenu} onClick={() => setAccountMenu(value => !value)}><MoreHorizontal size={18} /></button>
            {accountMenu && <div className="account-popover"><Link to="/account">Account settings</Link>{!isPreview && <ClerkLogoutButton />}</div>}
        </div>
      </aside>
      <Link className="workspace-header-cta button button-primary" to={isPreview ? "/demo/tasks" : "/app/team"}>
        {isPreview ? "Open my day" : "Invite staff"} <ArrowRight size={16} />
      </Link>
      </div>
      {menuOpen && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <main className="app-main">
        <header className="app-topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-controls="workspace-navigation"
            aria-expanded={menuOpen}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <b>{page.title.replace("Good morning, Alex", "Overview")}</b>
          </div>
          <div className="topbar-actions">
            <div className={`searchbox ${showSearch ? "search-open" : ""}`}>
              <Search size={16} />
              <input
                aria-label="Search this workspace view"
                placeholder="Search this view..."
                value={search}
                onFocus={() => setShowSearch(true)}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => setShowSearch(false)}
              />
              <kbd>
                <Command size={10} /> K
              </kbd>
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <i />
            </button>
            <span className="topbar-avatar">AM</span>
          </div>
        </header>
        <div className="app-content">
          {isPreview ? <div className="preview-banner">
            <span className="preview-label"><i /> PREVIEW WORKSPACE</span>
            <span>Sample data only · Nothing is connected or saved</span>
            <Link to="/start">Create your own <ArrowRight size={13} /></Link>
          </div> : <div className="workspace-state-banner"><span><i /> PRIVATE COMPANY WORKSPACE</span><b>{requestSummary ? requestSummary.status.replaceAll("_", " ") : "Subscription not active"}</b></div>}
          {toast && (
            <div className="preview-toast" role="status">
              {toast}
              <button onClick={() => setToast("")} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="app-view-transition" key={normalizedPath}>
          <div className="app-heading">
            <div>
              <span className="dashboard-date">
                {isPreview ? `${new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()).toUpperCase()} | JOHANNESBURG` : activeWorkspace?.branch || "SOUTH AFRICA"}
              </span>
              <h1>{page.title}</h1>
              <p>{page.sub}</p>
            </div>
            {isPreview && <Button
              className="app-add-button"
              onClick={() =>
                setToast(
                  "Quick actions will be available once the workspace is connected.",
                )
              }
            >
              <Plus size={16} /> Quick action
            </Button>}
          </div>
          {isPreview ? (normalizedPath === "/app" ? <Overview /> : normalizedPath === "/app/stock" ? <StockPage search={search} /> : normalizedPath === "/app/leads" ? <LeadsPage search={search} /> : normalizedPath === "/app/components" ? <ComponentGallery /> : <TasksPage search={search} />)
            : normalizedPath === "/app" ? <ProductionWorkspaceHome workspace={activeWorkspace} request={requestSummary} services={serviceRequests} appointmentStatus={appointmentStatus} loading={liveLoading} />
              : <ProductionModuleEmpty title={page.title} workspace={activeWorkspace} />}
          </div>
        </div>
      </main>
    </div>
  );
}

function WorkspaceRoute({ workspace, preview = false }: { workspace: Workspace | null; preview?: boolean }) {
  if (preview || appMode === "demo") return <AppShell workspace={workspace} preview />;
  return <ClerkProtected><LiveWorkspaceRoute /></ClerkProtected>;
}

function LiveWorkspaceRoute() {
  const { userId } = useAuth();
  return <AppShell workspace={null} identityKey={userId ?? ""} />;
}

function ProductionWorkspaceHome({ workspace, request, services, appointmentStatus, loading }: {
  workspace: Workspace | null;
  request: OnboardingRequestSummary | null;
  services: { service_code: string; status: string }[];
  appointmentStatus: string | null;
  loading: boolean;
}) {
  if (loading) return <section className="panel production-loading" role="status">Loading your company setup…</section>;
  if (!workspace) return <section className="panel production-empty"><span className="metric-icon metric-lime"><Building2 size={18} /></span><h2>Start with your dealership</h2><p>No dealership workspace is linked to this account yet. If you were invited to a team, accept that invitation first.</p><div><Button to="/start">Set up a dealership <ArrowRight size={15} /></Button><Button to="/invite" variant="outline">Accept an invitation</Button></div></section>;
  const planName = request?.plan_code ? request.plan_code[0].toUpperCase() + request.plan_code.slice(1) : "No plan selected";
  const serviceLabel: Record<string, string> = { website_review: "Website review", website_build: "Dealership website", social_profile_setup: "Social profile setup", managed_social: "Managed social content" };
  return <>
    <section className="panel production-status-panel">
      <div className="production-status-head"><span className="production-status-icon"><Building2 size={18} /></span><span><small>YOUR DEALERSHIP</small><b>{workspace.name}</b><em>{workspace.branch}</em></span><span className="pending-pill">{request?.status?.replaceAll("_", " ") || "Setup in progress"}</span></div>
      <div className="production-payment-note"><LockKeyhole size={16} /><span><b>{request?.payment_status === "paid" ? "Paystack payment verified." : request?.payment_status === "pending" ? "Subscription payment is pending." : "Subscription payment has not started."}</b><small>{request?.payment_status === "paid" ? "Your recurring subscription is active. Service setup still follows the approved scope and schedule." : request?.payment_status === "pending" ? "Complete Paystack checkout to activate this plan." : "Complete Paystack checkout after billing terms and inclusive tax treatment are configured."}</small></span></div>
      {request && <div className="live-plan-summary"><div><small>REQUESTED PLAN</small><b>{planName} · {request.billing_interval === "annual" ? "Annual upfront" : "Monthly"}</b></div><div><small>PROPOSED SUBSCRIPTION</small><b>{formatCurrencyMinor(request.subscription_amount_minor)}{request.billing_interval === "monthly" ? " / month" : " / year"}</b></div><div><small>SETUP SERVICE</small><b>{formatCurrencyMinor(request.setup_fee_minor)}{request.setup_installments === 3 ? " · 3 instalments" : ""}</b></div></div>}
      {request?.tax_status === "configuration_required" && <p className="quote-pending">VAT treatment is still being configured, so the displayed prices are not a final payable quote.</p>}
    </section>
    <section className="panel production-checklist"><div className="panel-header"><div><span className="panel-kicker">A GOOD PLACE TO BEGIN</span><h2>Your first steps</h2></div><span className="tasks-counter">Ready after activation</span></div><div className="production-todo-list"><ProductionTodo title="Add or import vehicles" detail="Supported CSV upload and duplicate review will be available after setup." /><ProductionTodo title="Capture your first customer enquiry" detail="Your lead workspace opens when the subscription is active." /><ProductionTodo title="Assign a customer follow-up" detail="Keep the next action visible for your team." /><ProductionTodo title="Invite your staff" detail="Team members join this dealership through an invitation." /><ProductionTodo title="Complete your selected service brief" detail="Website and social work needs an agreed scope and customer approval." /></div><Button to="/app/team" variant="outline">Manage team access <ArrowRight size={15} /></Button><p className="app-disclaimer">These are setup reminders. No demo records are shown in a production company workspace.</p></section>
    {(appointmentStatus || services.length > 0) && <section className="panel service-progress-panel"><div className="panel-header"><div><span className="panel-kicker">ASSISTANCE AND OPTIONAL SERVICES</span><h2>Setup progress</h2></div></div>{appointmentStatus && <div className="service-progress-row"><span className="progress-step-icon"><Clock3 size={14} /></span><span><b>Meeting request</b><small>{appointmentStatus === "confirmed" ? "Appointment confirmed" : "Appointment requested · confirmation pending"}</small></span></div>}{services.map(service => <div className="service-progress-row" key={service.service_code}><span className="progress-step-icon"><Clock3 size={14} /></span><span><b>{serviceLabel[service.service_code] ?? service.service_code}</b><small>{service.status.replaceAll("_", " ")} · work does not begin until activation and scope approval</small></span></div>)}<div className="service-progress-row"><span className="progress-step-icon"><LockKeyhole size={14} /></span><span><b>Secure data upload</b><small>Not enabled yet · upload opens after storage setup</small></span></div></section>}
  </>;
}

function ProductionTodo({ title, detail }: { title: string; detail: string }) {
  return <div className="production-todo-row"><span className="todo-empty-circle" /><span><b>{title}</b><small>{detail}</small></span><span className="todo-awaiting">Pending</span></div>;
}

function ProductionModuleEmpty({ title, workspace }: { title: string; workspace: Workspace | null }) {
  return <section className="panel production-empty"><span className="metric-icon metric-lime"><CarFront size={18} /></span><h2>{title}</h2><p>{workspace?.name ? `${workspace.name} has no ${title.toLowerCase()} records yet.` : "No live records are available for this workspace."} This module will show only records loaded from your company workspace; fictional demo data stays on the demo route.</p><Button to="/app">Return to workspace status <ArrowRight size={15} /></Button></section>;
}

function formatCurrencyMinor(amount: number) {
  return zarFormatter.format(amount / 100);
}

function Overview() {
  return (
    <>
      <div className="metric-grid">
        <MetricCard label="Vehicles in stock" value="24" trend="3 added this month" icon={<CarFront size={17} />} tone="pine" />
        <MetricCard label="Open enquiries" value="08" trend="3 need a follow-up" icon={<UsersRound size={17} />} tone="mint" />
        <MetricCard label="Appointments today" value="04" trend="Next one at 10:30" icon={<Command size={17} />} tone="gold" />
        <MetricCard label="Tasks to complete" value="06" trend="2 are due today" icon={<Check size={17} />} tone="paper" />
      </div>
      <div className="dashboard-grid">
        <section className="panel performance-panel" aria-labelledby="activity-heading">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">WORKSPACE ACTIVITY | PREVIEW</span>
              <h2 id="activity-heading">Activity this week</h2>
            </div>
            <span className="performance-period">Last 7 days</span>
          </div>
          <div className="activity-content">
            <div className="activity-chart" role="img" aria-label="Sample daily activity from Monday to Sunday, with Thursday highest and Sunday lowest">
              <div className="chart-y-labels" aria-hidden="true"><span>12</span><span>8</span><span>4</span><span>0</span></div>
              <div className="chart-bars" aria-hidden="true">
                <div className="chart-gridline" /><div className="chart-gridline" /><div className="chart-gridline" /><div className="chart-gridline" />
                <ChartBar day="MON" height="52%" /><ChartBar day="TUE" height="77%" /><ChartBar day="WED" height="45%" />
                <ChartBar day="THU" height="91%" active /><ChartBar day="FRI" height="64%" /><ChartBar day="SAT" height="27%" /><ChartBar day="SUN" height="12%" />
              </div>
            </div>
            <div className="activity-summary">
              <div><span>New enquiries</span><b>18</b><small><ArrowUpRight size={13} /> Across the week</small></div>
              <div><span>Follow-ups done</span><b>32</b><small><Check size={13} /> Across the week</small></div>
            </div>
          </div>
          <p className="chart-summary">Sample activity totals for the preview week. Bars show daily workspace activity.</p>
        </section>
        <section className="panel attention-panel" aria-labelledby="attention-heading">
          <div className="panel-header">
            <div><span className="panel-kicker">MAKE THE MOST OF TODAY</span><h2 id="attention-heading">Needs your attention</h2></div>
            <Button to="/app/tasks" variant="quiet">View all <ArrowRight size={14} /></Button>
          </div>
          <div className="attention-list">
            <TaskRow initials="TN" person="Thandi Ndlovu" detail="New enquiry - Toyota Corolla Cross" time="12 min ago" status="New lead" />
            <TaskRow initials="LM" person="Liam Moyo" detail="Follow-up - Volkswagen Polo" time="Due 10:30" status="Follow up" />
            <TaskRow initials="SK" person="Sihle Khumalo" detail="Vehicle prep - Ford EcoSport" time="Due today" status="In progress" />
          </div>
          <div className="attention-bottom">
            <span className="attention-clock"><Gauge size={15} /> Your team's next step, at a glance.</span>
            <Link to="/app/tasks">Open my day <ArrowUpRight size={13} /></Link>
          </div>
        </section>
      </div>
      <section className="panel stock-panel dashboard-stock-panel" aria-labelledby="recent-stock-heading">
        <div className="panel-header">
          <div><span className="panel-kicker">INVENTORY | PREVIEW</span><h2 id="recent-stock-heading">Recently added</h2></div>
          <Button to="/app/stock" variant="quiet">View stock <ArrowRight size={14} /></Button>
        </div>
        <div className="stock-list">
          <StockRow name="Volkswagen Polo" detail="2021 - 1.0 TSI Comfortline" price="R 239 900" swatch="sand" />
          <StockRow name="Toyota Corolla Cross" detail="2022 - 1.8 XS CVT" price="R 319 900" swatch="green" />
          <StockRow name="Ford EcoSport" detail="2020 - 1.0 EcoBoost" price="R 184 900" swatch="blue" />
        </div>
        <div className="stock-foot">
          <span><i className="stock-dot dot-green" /> 18 available</span>
          <span><i className="stock-dot dot-amber" /> 4 in prep</span>
          <span><i className="stock-dot dot-grey" /> 2 reserved</span>
        </div>
      </section>
      <div className="app-disclaimer">Illustrative preview data only. No dealership systems are connected.</div>
    </>
  );
}

function ComponentGallery() {
  return (
    <div className="component-gallery">
      <section className="panel gallery-intro">
        <img src="/brand/mzansi-road-mark.png" alt="" width="52" height="52" />
        <div><span className="panel-kicker">MZANSIMOTORSTACK | FOUNDATIONS</span><h2>Built for a clearer day at the dealership</h2><p>Shared controls use the same pine, lime, warm paper and restrained gold from the brand system.</p></div>
      </section>
      <div className="gallery-grid">
        <section className="panel gallery-panel"><div className="panel-header"><div><span className="panel-kicker">ACTIONS</span><h2>Buttons and links</h2></div></div><div className="gallery-actions"><Button to="/demo">Primary action <ArrowRight size={15} /></Button><Button to="/demo/stock" variant="dark">Open stock</Button><Button to="/demo/leads" variant="outline">Secondary action</Button><Button to="/demo/tasks" variant="quiet">Quiet action</Button></div></section>
        <section className="panel gallery-panel"><div className="panel-header"><div><span className="panel-kicker">FIELDS</span><h2>Search and selection</h2></div></div><label className="gallery-field">Vehicle or customer<input type="search" placeholder="e.g. Corolla Cross" /></label><label className="gallery-field">Stock status<select defaultValue="available"><option value="available">Available</option><option value="prep">In preparation</option><option value="reserved">Reserved</option></select></label></section>
        <section className="panel gallery-panel"><div className="panel-header"><div><span className="panel-kicker">STATUS</span><h2>Clear state labels</h2></div></div><div className="gallery-statuses"><span className="table-status status-available"><i />Available</span><span className="table-status status-reserved"><i />Reserved</span><span className="task-status status-new">New enquiry</span><span className="task-status status-progress">In preparation</span></div></section>
        <section className="panel gallery-panel"><div className="panel-header"><div><span className="panel-kicker">RECORDS</span><h2>Vehicle summary</h2></div><span className="task-status status-available">Available</span></div><div className="gallery-vehicle"><div className="stock-vehicle stock-green"><CarSketch variant="green" /></div><div><b>Toyota Corolla Cross</b><span>2022 - 1.8 XS CVT</span></div><strong>R 319 900</strong></div></section>
        <section className="panel gallery-panel gallery-wide"><div className="panel-header"><div><span className="panel-kicker">FEEDBACK</span><h2>Save and empty states</h2></div></div><div className="gallery-feedback" role="status"><Check size={16} /><span><b>Changes saved</b><small>Your vehicle details are up to date.</small></span></div><div className="gallery-empty"><CarFront size={18} /><b>No vehicles match this search</b><span>Try a different model or clear the stock filter.</span></div></section>
        <section className="panel gallery-panel"><div className="panel-header"><div><span className="panel-kicker">METRICS</span><h2>Quiet performance summary</h2></div></div><div className="gallery-metrics"><div><span>Available stock</span><b>18</b></div><div><span>Open enquiries</span><b>08</b></div><div><span>Price total</span><b>R 4.8m</b></div></div><div className="gallery-chart" role="img" aria-label="Illustrative weekly enquiry activity chart"><i style={{ height: "42%" }} /><i style={{ height: "68%" }} /><i style={{ height: "54%" }} /><i style={{ height: "78%" }} /><i style={{ height: "60%" }} /><i style={{ height: "91%" }} /><i style={{ height: "72%" }} /></div><div className="gallery-legend"><span><i />Enquiries this week</span><span>Illustrative preview values</span></div></section>
        <section className="panel gallery-panel"><div className="panel-header"><div><span className="panel-kicker">ACTIVITY</span><h2>Record history and checklist</h2></div><button className="icon-button" aria-label="More activity options"><MoreHorizontal size={17} /></button></div><ol className="gallery-timeline"><li><i /><span><b>New enquiry received</b><small>Thandi Ndlovu · Toyota Corolla Cross · Today, 09:12</small></span></li><li><i /><span><b>Viewing scheduled</b><small>Tomorrow, 14:30 · Dealership floor</small></span></li></ol><div className="gallery-checklist"><span><Check size={14} /> Confirm buyer details</span><span><i /> Prepare vehicle for viewing</span></div><button className="button button-outline" disabled>Save changes</button></section>
      </div>
      <GalleryExtended />
    </div>
  );
}

function GalleryExtended() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  return <>
    <div className="gallery-grid">
      <section className="panel gallery-panel">
        <div className="panel-header"><div><span className="panel-kicker">NAVIGATION</span><h2>Menus and overlays</h2></div></div>
        <div className="gallery-actions">
          <details className="gallery-menu"><summary className="button button-outline">Record actions <ChevronDown size={16} /></summary><div><Link to="/demo/stock">View stock</Link><Link to="/demo/leads">View enquiries</Link></div></details>
          <button className="button button-outline" onClick={() => drawerRef.current?.showModal()}>Open drawer</button>
          <button className="button button-dark" onClick={() => dialogRef.current?.showModal()}>Open dialog</button>
          <span className="gallery-tooltip-wrap"><button className="icon-button" aria-label="About preview data" aria-describedby="gallery-tooltip"><CircleHelp size={18} /></button><span id="gallery-tooltip" role="tooltip">Gallery records are illustrative.</span></span>
        </div>
        <p className="gallery-hint">Press Escape to close either overlay.</p>
      </section>
      <section className="panel gallery-panel">
        <div className="panel-header"><div><span className="panel-kicker">FEEDBACK</span><h2>Alerts and system states</h2></div></div>
        <div className="gallery-state gallery-state-error" role="alert"><X size={16} /><span><b>Could not save</b><small>Check the highlighted fields and try again.</small></span></div>
        <div className="gallery-state"><LockKeyhole size={16} /><span><b>Owner access required</b><small>Only an owner can invite staff.</small></span></div>
        <div className="gallery-state" role="status"><Clock3 size={16} /><span><b>Loading records</b><small>Getting the latest stock list…</small></span></div>
        <button className="button button-outline" onClick={() => setToast("Preview changes saved")}>Show toast</button>
        {toast && <div className="gallery-toast" role="status"><Check size={16} /> {toast}<button className="icon-button" aria-label="Dismiss toast" onClick={() => setToast("")}><X size={16} /></button></div>}
      </section>
      <section className="panel gallery-panel gallery-wide">
        <div className="panel-header"><div><span className="panel-kicker">DATA</span><h2>Table, selection and pagination</h2></div></div>
        <div className="gallery-table-scroll"><table className="gallery-table"><thead><tr><th scope="col">Select</th><th scope="col">Vehicle</th><th scope="col">Status</th><th scope="col">Price</th></tr></thead><tbody><tr><td><input type="checkbox" aria-label={`Select ${pageNumber === 1 ? "Toyota Corolla Cross" : "Volkswagen Polo"}`} checked={selected} onChange={event => setSelected(event.target.checked)} /></td><td>{pageNumber === 1 ? "Toyota Corolla Cross" : "Volkswagen Polo"}</td><td><span className="table-status status-available">Available</span></td><td>{pageNumber === 1 ? "R 319 900" : "R 239 900"}</td></tr></tbody></table></div>
        <div className="gallery-table-footer"><button className="button button-outline" disabled={!selected} onClick={() => setToast("Bulk actions are preview only")}>Bulk action</button><nav aria-label="Gallery table pages"><button className="button button-quiet" disabled={pageNumber === 1} onClick={() => {setPageNumber(1); setSelected(false);}}>Previous</button><span>Page {pageNumber} of 2</span><button className="button button-quiet" disabled={pageNumber === 2} onClick={() => {setPageNumber(2); setSelected(false);}}>Next</button></nav></div>
      </section>
    </div>
    <dialog ref={dialogRef} className="gallery-dialog" aria-labelledby="gallery-dialog-title"><form method="dialog"><span className="panel-kicker">PREVIEW DIALOG</span><h2 id="gallery-dialog-title">Confirm this action</h2><p>This example will not change dealership data.</p><div className="gallery-actions"><button type="submit" className="button button-outline">Cancel</button><button type="submit" className="button button-primary">Confirm preview</button></div></form></dialog>
    <dialog ref={drawerRef} className="gallery-dialog gallery-drawer" aria-labelledby="gallery-drawer-title"><form method="dialog"><div className="panel-header"><h2 id="gallery-drawer-title">Record details</h2><button type="submit" className="icon-button" aria-label="Close drawer"><X size={18} /></button></div><p>Toyota Corolla Cross</p><p>2022 · 1.8 XS CVT · R 319 900</p><span className="table-status status-available">Available</span></form></dialog>
  </>;
}

function MetricCard({
  label,
  value,
  trend,
  icon,
  tone,
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}>{icon}</div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-trend">{trend}</span>
      <ArrowUpRight className="metric-arrow" size={15} />
    </article>
  );
}
function TaskRow({
  initials,
  person,
  detail,
  time,
  status,
}: {
  initials: string;
  person: string;
  detail: string;
  time: string;
  status: string;
}) {
  return (
    <div className="task-row">
      <span className="task-avatar">{initials}</span>
      <div className="task-description">
        <b>{person}</b>
        <span>{detail}</span>
      </div>
      <span
        className={`task-status ${status === "New lead" ? "status-new" : status === "In progress" ? "status-progress" : ""}`}
      >
        {status}
      </span>
      <time>{time}</time>
      <ArrowUpRight size={14} className="task-open" />
    </div>
  );
}
function StockRow({
  name,
  detail,
  price,
  swatch,
}: {
  name: string;
  detail: string;
  price: string;
  swatch: string;
}) {
  return (
    <div className="stock-row">
      <div className={`stock-vehicle stock-${swatch}`}>
        <CarSketch variant={swatch === "green" ? "green" : "sand"} />
      </div>
      <div className="stock-model">
        <b>{name}</b>
        <span>{detail}</span>
      </div>
      <strong>{price}</strong>
    </div>
  );
}
function ChartBar({
  day,
  height,
  active = false,
}: {
  day: string;
  height: string;
  active?: boolean;
}) {
  return (
    <div className="chart-col">
      <div
        className={`chart-bar ${active ? "chart-active" : ""}`}
        style={{ height }}
      />{" "}
      <span>{day}</span>
    </div>
  );
}
function CompletionToggle({ task }: { task: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`task-check ${done ? "checked" : ""}`}
      aria-label={`${done ? "Mark" : "Complete"} ${task}`}
      aria-pressed={done}
      onClick={() => setDone((value) => !value)}
    >
      {done && <Check size={12} />}
    </button>
  );
}

function StockPage({ search }: { search: string }) {
  const [filter, setFilter] = useState("All stock");
  const vehicles = [
    ["Volkswagen Polo", "1.0 TSI Comfortline ? 2021", "Available", "Today", "R 239 900", "sand"],
    ["Toyota Corolla Cross", "1.8 XS CVT ? 2022", "Available", "Yesterday", "R 319 900", "green"],
    ["Ford EcoSport", "1.0 EcoBoost ? 2020", "In preparation", "4 Nov", "R 184 900", "blue"],
    ["Suzuki Swift", "1.2 GL ? 2022", "Reserved", "3 Nov", "R 169 900", "sand"],
  ];
  const filters = ["All stock", "Available", "In preparation", "Reserved"];
  const rows = vehicles.filter((row) => {
    const matchesFilter = filter === "All stock" || row[2] === filter;
    const matchesSearch = `${row[0]} ${row[1]} ${row[2]}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });
  return (
    <>
      <div className="table-toolbar">
        <div className="table-filters" role="group" aria-label="Filter vehicles by stock status">
          {filters.map((item) => <button key={item} className={`filter-pill ${filter === item ? "active" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}<span>{item === "All stock" ? "24" : item === "Available" ? "18" : item === "In preparation" ? "4" : "2"}</span></button>)}
        </div>
        <span className="table-result-count" aria-live="polite">{rows.length} shown</span>
      </div>
      <section className="panel data-panel local-scroll" aria-label="Preview vehicle inventory">
        <div className="data-table-head"><span>VEHICLE</span><span>STOCK STATUS</span><span>ADDED</span><span>ASKING PRICE</span><span /></div>
        {rows.map((row) => <div className="data-table-row" key={row[0]}>
          <div className="table-vehicle"><div className={`stock-vehicle stock-${row[5]}`}><CarSketch variant={row[5] === "green" ? "green" : "sand"} /></div><span><b>{row[0]}</b><small>{row[1]}</small></span></div>
          <span className={`table-status ${row[2] === "Available" ? "status-available" : row[2] === "Reserved" ? "status-reserved" : "status-progress"}`}><i />{row[2]}</span>
          <span className="table-muted">{row[3]}</span><b className="currency-value">{row[4]}</b>
          <button className="icon-button" aria-label={`More actions for ${row[0]}`}><MoreHorizontal size={17} /></button>
        </div>)}
        {rows.length === 0 && <div className="table-empty" role="status">No vehicles match this search and filter.</div>}
      </section>
      <div className="app-disclaimer">Sample vehicle details for preview only.</div>
    </>
  );
}

function LeadsPage({ search }: { search: string }) {
  const [filter, setFilter] = useState("All enquiries");
  const leads = [
    ["Thandi Ndlovu", "Toyota Corolla Cross", "New enquiry", "12 min ago", "TN"],
    ["Liam Moyo", "Volkswagen Polo", "Follow up", "Today, 09:15", "LM"],
    ["Sihle Khumalo", "Ford EcoSport", "Appointment", "Yesterday", "SK"],
    ["Amara Mwale", "Suzuki Swift", "Follow up", "Yesterday", "AM"],
  ];
  const filters = ["All enquiries", "New enquiry", "Follow up", "Appointment"];
  const rows = leads.filter((row) => {
    const matchesFilter = filter === "All enquiries" || row[2] === filter;
    const matchesSearch = `${row[0]} ${row[1]} ${row[2]}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });
  return <section className="panel data-panel local-scroll" aria-label="Preview customer enquiries">
    <div className="table-toolbar">
      <div className="table-filters" role="group" aria-label="Filter enquiries by status">
        {filters.map((item) => <button key={item} className={`filter-pill ${filter === item ? "active" : ""}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}<span>{item === "All enquiries" ? "08" : item === "New enquiry" ? "3" : item === "Follow up" ? "5" : "1"}</span></button>)}
      </div>
      <span className="table-result-count" aria-live="polite">{rows.length} shown</span>
    </div>
    <div className="data-table-head lead-table-head"><span>PERSON</span><span>INTERESTED IN</span><span>STATUS</span><span>LAST ACTIVITY</span><span /></div>
    {rows.map((row, i) => <div className="data-table-row lead-table-row" key={row[0]}>
      <div className="lead-person"><span className={`task-avatar lead-color-${i}`}>{row[4]}</span><span><b>{row[0]}</b><small>Buyer enquiry ? Preview</small></span></div>
      <span className="lead-car-name">{row[1]}</span><span className={`task-status ${row[2] === "New enquiry" ? "status-new" : row[2] === "Appointment" ? "status-available" : "status-progress"}`}>{row[2]}</span><span className="table-muted">{row[3]}</span>
      <button className="icon-button" aria-label={`More actions for ${row[0]}`}><MoreHorizontal size={17} /></button>
    </div>)}
    {rows.length === 0 && <div className="table-empty" role="status">No enquiries match this search and filter.</div>}
  </section>;
}

function TasksPage({ search }: { search: string }) {
  const tasks = [
    ["Follow up with Liam Moyo", "Volkswagen Polo enquiry ? confirm viewing time", "10:30", "LM"],
    ["Check in on Ford EcoSport prep", "Workshop update ? Sihle is assigned", "12:00", "SK"],
    ["Review the new enquiry from Thandi", "Toyota Corolla Cross ? today?s first response", "14:00", "TN"],
  ];
  const rows = tasks.filter((row) => `${row[0]} ${row[1]}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <>
    <div className="myday-overview">
      <div className="day-date-card"><span>SUNDAY</span><b>08</b><small>NOVEMBER 2026</small><div><i /> JOHANNESBURG, SA</div></div>
      <div className="myday-stats"><div><span>To do today</span><b>06</b><small>Across your workspace</small></div><div><span>Completed</span><b>04</b><small>Nice work so far</small></div><div><span>Coming up next</span><b>10:30</b><small>Buyer follow-up</small></div></div>
    </div>
    <section className="panel myday-panel">
      <div className="panel-header"><div><span className="panel-kicker">A GOOD PLACE TO BEGIN</span><h2>Your next steps</h2></div><span className="tasks-counter">{rows.length} shown</span></div>
      {rows.map((row) => <div className="myday-row" key={row[0]}>
        <CompletionToggle task={row[0]} /><div><b>{row[0]}</b><span>{row[1]}</span></div><span className="myday-time">{row[2]}</span><span className="task-avatar">{row[3]}</span><button className="icon-button" aria-label={`More actions for ${row[0]}`}><MoreHorizontal size={17} /></button>
      </div>)}
      {rows.length === 0 && <div className="table-empty" role="status">No tasks match this search.</div>}
    </section>
    <div className="app-disclaimer">The sample tasks are local preview content; completion is not saved.</div>
  </>;
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const location = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = {
      "/pricing": "Pricing | mzansiMotorStack",
      "/privacy": "Privacy policy | mzansiMotorStack",
      "/terms": "Terms of service | mzansiMotorStack",
      "/tutorial": "Setup tutorial | mzansiMotorStack",
    };
    document.title = titles[location.pathname] ?? "mzansiMotorStack — Dealership operations, in one place";
  }, [location.pathname]);
  return (
    <Suspense fallback={<main className="route-loading" role="status">Loading your workspace…</main>}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/demo" element={<AppShell workspace={null} preview />} />
      <Route path="/demo/stock" element={<AppShell workspace={null} preview />} />
      <Route path="/demo/leads" element={<AppShell workspace={null} preview />} />
      <Route path="/demo/tasks" element={<AppShell workspace={null} preview />} />
      <Route path="/demo/components" element={<AppShell workspace={null} preview />} />
      <Route path="/tutorial" element={<Tutorial />} />
      <Route path="/privacy" element={<PrivacyNotice />} />
      <Route path="/terms" element={<TermsNotice />} />
      <Route path="/start" element={<Navigate to="/signup" replace />} />
      <Route path="/invite" element={<Navigate to="/accept-invite" replace />} />
      <Route path="/signup/*" element={<ClerkSignUpPage />} />
      <Route path="/login/*" element={<ClerkSignInPage />} />
      <Route path="/account/*" element={<ClerkProtected><AccountPage /></ClerkProtected>} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/onboarding" element={<ClerkProtected><OnboardingWizard onSubmitted={(name) => setWorkspace({ name, email: "", branch: "Default dealership" })} /></ClerkProtected>} />
      <Route path="/app/team" element={<ClerkProtected><InviteStaffPage /></ClerkProtected>} />
      <Route path="/access-denied" element={<main className="clerk-auth-page"><p className="auth-kicker">ACCESS</p><h1>You don’t have access to this dealership</h1><p>Ask a dealership owner to invite you with the correct work email and role.</p><Link to="/account">Manage your account</Link></main>} />
      <Route path="/app" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="/app/stock" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="/app/leads" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="/app/tasks" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
