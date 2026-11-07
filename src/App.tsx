import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
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
  LogOut,
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
  useNavigate,
} from "react-router-dom";
const AuthReturn = lazy(() => import("./onboarding/OnboardingWizard").then(module => ({ default: module.AuthReturn })));
const InviteAccept = lazy(() => import("./onboarding/OnboardingWizard").then(module => ({ default: module.InviteAccept })));
const OnboardingWizard = lazy(() => import("./onboarding/OnboardingWizard").then(module => ({ default: module.OnboardingWizard })));
const PasswordUpdate = lazy(() => import("./onboarding/OnboardingWizard").then(module => ({ default: module.PasswordUpdate })));
import { appMode, hasSupabaseConfig, supabase } from "./lib/config";
import {
  sendPasswordReset,
  signIn as signInWithSupabase,
  signOut as signOutFromSupabase,
} from "./lib/onboardingRepository";

type Workspace = { name: string; email: string; branch: string };
const zarFormatter = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      to="/"
      aria-label="mzansiMotorStack home"
    >
      <span className="brand-mark">
        <CarFront size={19} strokeWidth={2.2} />
      </span>
      <span>
        mzansi<span className="brand-mid">Motor</span>Stack
      </span>
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

function Landing() {
  return (
    <div className="landing">
      <header className="site-header page-wrap">
        <Brand />
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="header-actions">
          <Button to="/demo" variant="quiet" className="signin-link">
            Try demo
          </Button>
          <Button to="/login" variant="quiet" className="signin-link">
            Sign in
          </Button>
          <Button to="/start" className="header-cta">
            Start your workspace <ArrowRight size={16} />
          </Button>
        </div>
      </header>

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
          <Link to="/tutorial">Setup tutorial</Link>
          <Link to="/privacy">Data notice</Link>
          <a href="#contact">Contact</a>
          <Link to="/login">Sign in</Link>
          <Link to="/start">Create workspace</Link>
        </div>
        <small>© 2026 mzansiMotorStack</small>
      </footer>
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
      <header className="site-header page-wrap">
        <Brand />
        <nav className="site-nav" aria-label="Main navigation">
          <Link to="/demo">Try demo</Link>
          <Link to="/privacy">Data notice</Link>
        </nav>
        <div className="header-actions">
          <Button to="/" variant="quiet" className="signin-link">
            Home
          </Button>
          <Button to="/start" className="header-cta">
            Start your workspace <ArrowRight size={16} />
          </Button>
        </div>
      </header>
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
      <header className="site-header page-wrap">
        <Brand />
        <nav className="site-nav" aria-label="Main navigation">
          <Link to="/tutorial">Setup tutorial</Link>
          <Link to="/demo">Try demo</Link>
        </nav>
        <div className="header-actions">
          <Button to="/" variant="quiet" className="signin-link">
            Home
          </Button>
          <Button to="/start" className="header-cta">
            Start your workspace <ArrowRight size={16} />
          </Button>
        </div>
      </header>
      <main className="page-wrap privacy-main">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> Current prototype behavior
        </div>
        <h1>Data notice</h1>
        <p className="tutorial-lede">
          This page describes the frontend preview as it exists today. It is not
          a full privacy policy or a legal compliance statement.
        </p>
        <div className="privacy-cards">
          <article>
            <span className="privacy-icon">
              <LockKeyhole size={18} />
            </span>
            <h2>Forms stay in the page</h2>
            <p>
              Company setup, sign-in, password reset and contact forms do not
              submit to a server. They only show local interface feedback.
            </p>
          </article>
          <article>
            <span className="privacy-icon">
              <Building2 size={18} />
            </span>
            <h2>Workspace is temporary</h2>
            <p>
              Company and branch details are kept in the current app session to
              preview the workspace. They are not written to a database or
              browser storage.
            </p>
          </article>
          <article>
            <span className="privacy-icon">
              <UsersRound size={18} />
            </span>
            <h2>Demo records are fictional</h2>
            <p>
              Vehicles, customer names, activities and task summaries are sample
              content. No real dealership or customer records are connected.
            </p>
          </article>
        </div>
        <div className="privacy-next">
          <h2>Before accounts are enabled</h2>
          <p>
            A production data notice must be written against the actual
            services, collection points, retention settings and user controls.
            Authentication, storage, analytics and contact submissions are not
            configured in this preview.
          </p>
          <Button to="/tutorial" variant="outline">
            Read the setup tutorial <ArrowRight size={15} />
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function TermsNotice() {
  return (
    <div className="tutorial-page">
      <header className="site-header page-wrap">
        <Brand />
        <nav className="site-nav" aria-label="Main navigation">
          <Link to="/tutorial">Setup tutorial</Link>
          <Link to="/privacy">Data notice</Link>
        </nav>
        <div className="header-actions">
          <Button to="/" variant="quiet" className="signin-link">
            Home
          </Button>
          <Button to="/start" className="header-cta">
            Start your workspace <ArrowRight size={16} />
          </Button>
        </div>
      </header>
      <main className="page-wrap privacy-main">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> Proposed service scope
        </div>
        <h1>Service terms preview</h1>
        <p className="tutorial-lede">
          This page is a plain-language summary for product planning. It is not
          an approved contract or a final legal agreement.
        </p>
        <div className="privacy-next">
          <h2>What the planned service covers</h2>
          <p>
            Subscriptions are for one dealership location and include the
            features listed for the selected plan. Assisted setup, website work,
            social content, travel, domain costs, advertising and paid usage are
            separate unless an approved quote explicitly includes them.
          </p>
          <p>
            Any import is limited to supported formats and the accepted record
            count. Complex cleanup, paper transcription, custom integrations and
            unsupported imports require a reviewed, itemised quote. Work starts
            only after scope and any applicable charges are accepted.
          </p>
          <p>
            Website drafts and social content require dealership review and
            approval before publication. Staff approve AI-assisted replies
            before sending. Payment is not taken and subscriptions are not
            activated until a configured provider verifies payment.
          </p>
          <p>
            These terms must be reviewed and replaced with the approved service
            agreement before production signup is enabled.
          </p>
          <Button to="/privacy" variant="outline">
            Read the data notice <ArrowRight size={15} />
          </Button>
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
        <Link to="/tutorial">Tutorial</Link>
        <Link to="/privacy">Data notice</Link>
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

function AuthFrame({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Brand light />
        <div className="auth-aside-content">
          <div className="auth-orb">
            <CarFront size={58} strokeWidth={1.1} />
            <span className="orb-glint" />
          </div>
          <span className="auth-kicker">A GOOD PLACE TO START</span>
          <h2>
            Build a workspace
            <br />
            around <em>your business.</em>
          </h2>
          <p>
            One company at a time. Set the pace, add your branches and bring
            your people in when you’re ready.
          </p>
          <div className="auth-steps-preview">
            <span>
              <i className="auth-step-active">1</i> Company
            </span>
            <span className="auth-step-line" />
            <span>
              <i>2</i> Branches
            </span>
            <span className="auth-step-line" />
            <span>
              <i>3</i> Team
            </span>
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
            <ArrowLeft size={16} /> Back to home
          </Link>
          <span>
            Already have a workspace? <Link to="/login">Sign in</Link>
          </span>
        </div>
        <div className="auth-content">
          <div className="auth-content-brand">
            <Brand />
          </div>
          {subtitle && (
            <div className="eyebrow">
              <span className="eyebrow-dot" /> {subtitle}
            </div>
          )}
          {children}
        </div>
        <div className="auth-footer">
          <span>
            <ShieldCheck size={14} /> Your company setup stays yours
          </span>
          <Link to="/">
            mzansiMotorStack <ArrowUpRight size={12} />
          </Link>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
  required = true,
  hint,
  minLength,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  minLength?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <AuthFrame subtitle="WELCOME BACK">
      <div className="auth-title-row">
        <div>
          <h1>Sign in to your workspace</h1>
          <p>Pick up where your team left off.</p>
        </div>
      </div>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setNotice("");
          if (appMode === "demo") {
            setNotice(
              "Demo mode does not sign in or create accounts. Open the sample workspace or continue through preview onboarding.",
            );
            return;
          }
          if (appMode !== "production" || !hasSupabaseConfig) {
            setError(
              "Production sign-in is unavailable until Supabase is configured. See the setup tutorial.",
            );
            return;
          }
          setBusy(true);
          try {
            const { error: signInError } = await signInWithSupabase(
              email,
              password,
            );
            if (signInError) throw signInError;
            navigate("/app");
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : "We couldn’t sign you in. Check your details and try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Work email"
          type="email"
          placeholder="you@yourdealership.co.za"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className="form-between">
          <span>Use your company account</span>
          <Link to="/reset-password">Forgot password?</Link>
        </div>
        {notice && (
          <p className="inline-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="inline-notice wizard-error" role="alert">
            {error} <Link to="/tutorial">Setup help</Link>
          </p>
        )}
        <Button className="form-submit" type="submit" disabled={busy}>
          {busy ? (
            "Signing in…"
          ) : (
            <>
              Sign in <ArrowRight size={16} />
            </>
          )}
        </Button>
        <div className="form-separator">
          <span /> <small>NEW TO MZANSIMOTORSTACK?</small> <span />
        </div>
        <Button
          to="/start"
          variant="outline"
          className="form-submit outline-submit"
        >
          Create a company workspace <Plus size={16} />
        </Button>
      </form>
      <div className="auth-helper">
        <CircleHelp size={16} />
        <span>
          Need help getting started?{" "}
          <Link to="/start">Create your company space</Link> and set it up at
          your pace.
        </span>
      </div>
    </AuthFrame>
  );
}

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <AuthFrame subtitle="ACCOUNT ACCESS">
      <h1>Reset your password</h1>
      <p className="auth-intro">
        Enter the work email linked to your company. We’ll show the next step
        here.
      </p>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setNotice("");
          setError("");
          if (appMode === "demo") {
            setNotice(
              "Password recovery is unavailable in demo mode. No email was sent.",
            );
            return;
          }
          if (appMode !== "production" || !hasSupabaseConfig) {
            setError(
              "Password recovery is unavailable until Supabase is configured.",
            );
            return;
          }
          setBusy(true);
          try {
            const { error: resetError } = await sendPasswordReset(email);
            if (resetError) throw resetError;
            setNotice(
              "If an account is registered with that email, Supabase Auth will send a password recovery link.",
            );
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : "We couldn’t request password recovery.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Work email"
          type="email"
          placeholder="you@yourdealership.co.za"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        {notice && (
          <p className="inline-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="inline-notice wizard-error" role="alert">
            {error}
          </p>
        )}
        <Button className="form-submit" type="submit" disabled={busy}>
          {busy ? (
            "Requesting…"
          ) : (
            <>
              Continue <ArrowRight size={16} />
            </>
          )}
        </Button>
        <Link className="form-back reset-back" to="/login">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </form>
    </AuthFrame>
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

function AppShell({ workspace, preview = false }: { workspace: Workspace | null; preview?: boolean }) {
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
  const navigate = useNavigate();
  const isPreview = preview || appMode === "demo";
  const normalizedPath = location.pathname.startsWith("/demo")
    ? location.pathname.replace(/^\/demo/, "/app") || "/app"
    : location.pathname;
  const activeWorkspace = isPreview ? workspace : liveWorkspace ?? workspace;

  useEffect(() => {
    if (isPreview || appMode !== "production" || !supabase) return;
    let active = true;
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
  }, [isPreview]);

  const signOut = async () => {
    try {
      await signOutFromSupabase();
      navigate("/login", { replace: true });
    } catch {
      setToast("We couldn’t sign you out. Check your connection and try again.");
    }
  };
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
  };
  const page = isPreview
    ? titleMap[normalizedPath] ?? titleMap["/app"]
    : normalizedPath === "/app"
      ? { title: activeWorkspace ? `Welcome to ${activeWorkspace.name}` : "Your dealership workspace", sub: "Your setup request and first steps are kept together here." }
      : titleMap[normalizedPath] ?? titleMap["/app"];
  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
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
        <div className="sidebar-help">
          <span className="help-icon">
            <CircleHelp size={17} />
          </span>
          <div>
            <b>New here?</b>
            <small>Build your workspace as you go.</small>
          </div>
          <ArrowUpRight size={14} />
        </div>
        <div className="profile-row">
            <span className="profile-avatar">{profileName ? profileName.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase() : "AM"}</span>
          <span className="profile-info">
              <b>{profileName || (isPreview ? "Alex Morgan" : "Dealership member")}</b>
              <small>{isPreview ? "Workspace owner · Preview" : "Signed-in member"}</small>
          </span>
            <button className="icon-button account-menu-button" aria-label="Account options" aria-expanded={accountMenu} onClick={() => setAccountMenu(value => !value)}><MoreHorizontal size={18} /></button>
            {accountMenu && <div className="account-popover"><button onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div>}
        </div>
      </aside>
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
                aria-label="Search workspace preview"
                placeholder="Search anything..."
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
          <div className="app-heading">
            <div>
              <span className="dashboard-date">
                {isPreview ? "SATURDAY, 7 NOVEMBER 2026 · JOHANNESBURG" : activeWorkspace?.branch || "SOUTH AFRICA"}
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
          {isPreview ? (normalizedPath === "/app" ? <Overview /> : normalizedPath === "/app/stock" ? <StockPage /> : normalizedPath === "/app/leads" ? <LeadsPage /> : <TasksPage />)
            : normalizedPath === "/app" ? <ProductionWorkspaceHome workspace={activeWorkspace} request={requestSummary} services={serviceRequests} appointmentStatus={appointmentStatus} loading={liveLoading} />
              : <ProductionModuleEmpty title={page.title} workspace={activeWorkspace} />}
        </div>
      </main>
    </div>
  );
}

function WorkspaceRoute({ workspace, preview = false }: { workspace: Workspace | null; preview?: boolean }) {
  const [authState, setAuthState] = useState<"checking" | "signed_in" | "signed_out">("checking");
  useEffect(() => {
    if (preview || appMode === "demo") return;
    if (appMode !== "production" || !hasSupabaseConfig || !supabase) {
      setAuthState("signed_out");
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthState(data.session ? "signed_in" : "signed_out");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthState(session ? "signed_in" : "signed_out");
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [preview]);
  if (preview || appMode === "demo") return <AppShell workspace={workspace} preview />;
  if (authState === "checking") return <main className="route-loading" role="status">Checking your sign-in…</main>;
  if (authState === "signed_out") return <Navigate to="/login" replace />;
  return <AppShell workspace={workspace} />;
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
    <section className="panel production-checklist"><div className="panel-header"><div><span className="panel-kicker">A GOOD PLACE TO BEGIN</span><h2>Your first steps</h2></div><span className="tasks-counter">Ready after activation</span></div><div className="production-todo-list"><ProductionTodo title="Add or import vehicles" detail="Supported CSV upload and duplicate review will be available after setup." /><ProductionTodo title="Capture your first customer enquiry" detail="Your lead workspace opens when the subscription is active." /><ProductionTodo title="Assign a customer follow-up" detail="Keep the next action visible for your team." /><ProductionTodo title="Invite your staff" detail="Team members join this dealership through an invitation." /><ProductionTodo title="Complete your selected service brief" detail="Website and social work needs an agreed scope and customer approval." /></div><p className="app-disclaimer">These are setup reminders. No demo records are shown in a production company workspace.</p></section>
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
        <MetricCard
          label="Vehicles in stock"
          value="24"
          trend="3 added this month"
          icon={<CarFront size={17} />}
          tone="lime"
        />
        <MetricCard
          label="Open enquiries"
          value="08"
          trend="3 need a follow-up"
          icon={<UsersRound size={17} />}
          tone="lavender"
        />
        <MetricCard
          label="Appointments today"
          value="04"
          trend="Next one at 10:30"
          icon={<Command size={17} />}
          tone="peach"
        />
        <MetricCard
          label="Tasks to complete"
          value="06"
          trend="2 are due today"
          icon={<Check size={17} />}
          tone="blue"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel attention-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">MAKE THE MOST OF TODAY</span>
              <h2>Needs your attention</h2>
            </div>
            <Button to="/app/tasks" variant="quiet">
              View all <ArrowRight size={14} />
            </Button>
          </div>
          <div className="attention-list">
            <TaskRow
              initials="TN"
              person="Thandi Ndlovu"
              detail="New enquiry · Toyota Corolla Cross"
              time="12 min ago"
              status="New lead"
            />
            <TaskRow
              initials="LM"
              person="Liam Moyo"
              detail="Follow-up · Volkswagen Polo"
              time="Due 10:30"
              status="Follow up"
            />
            <TaskRow
              initials="SK"
              person="Sihle Khumalo"
              detail="Vehicle prep · Ford EcoSport"
              time="Due today"
              status="In progress"
            />
          </div>
          <div className="attention-bottom">
            <span className="attention-clock">
              <Gauge size={15} /> Your team’s next step, at a glance.
            </span>
            <Link to="/app/tasks">
              Open my day <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>
        <section className="panel stock-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">A FRESH LOOK AT STOCK</span>
              <h2>Recently added</h2>
            </div>
            <Button to="/app/stock" variant="quiet">
              View stock <ArrowRight size={14} />
            </Button>
          </div>
          <div className="stock-list">
            <StockRow
              name="Volkswagen Polo"
              detail="2021 · 1.0 TSI Comfortline"
              price="R 239 900"
              swatch="sand"
            />
            <StockRow
              name="Toyota Corolla Cross"
              detail="2022 · 1.8 XS CVT"
              price="R 319 900"
              swatch="green"
            />
            <StockRow
              name="Ford EcoSport"
              detail="2020 · 1.0 EcoBoost"
              price="R 184 900"
              swatch="blue"
            />
          </div>
          <div className="stock-foot">
            <span>
              <i className="stock-dot dot-green" /> 18 available
            </span>
            <span>
              <i className="stock-dot dot-amber" /> 4 in prep
            </span>
            <span>
              <i className="stock-dot dot-grey" /> 2 reserved
            </span>
          </div>
        </section>
      </div>
      <section className="panel activity-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">THE LAST FEW DAYS</span>
            <h2>Activity in your workspace</h2>
          </div>
          <button className="activity-filter">
            This week <ChevronDown size={14} />
          </button>
        </div>
        <div className="activity-content">
          <div className="activity-chart">
            <div className="chart-y-labels">
              <span>12</span>
              <span>8</span>
              <span>4</span>
              <span>0</span>
            </div>
            <div className="chart-bars">
              <div className="chart-gridline" />
              <div className="chart-gridline" />
              <div className="chart-gridline" />
              <div className="chart-gridline" />
              <ChartBar day="MON" height="52%" />
              <ChartBar day="TUE" height="77%" />
              <ChartBar day="WED" height="45%" />
              <ChartBar day="THU" height="91%" active />
              <ChartBar day="FRI" height="64%" />
              <ChartBar day="SAT" height="27%" />
              <ChartBar day="SUN" height="12%" />
            </div>
          </div>
          <div className="activity-summary">
            <div>
              <span>New enquiries</span>
              <b>18</b>
              <small>
                <ArrowUpRight size={13} /> Across the week
              </small>
            </div>
            <div>
              <span>Follow-ups done</span>
              <b>32</b>
              <small>
                <Check size={13} /> Across the week
              </small>
            </div>
          </div>
        </div>
      </section>
      <div className="app-disclaimer">
        A sample workspace to explore the interface. No authentication, customer
        data or dealership systems are connected.
      </div>
    </>
  );
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

function StockPage() {
  return (
    <>
      <div className="table-toolbar">
        <div className="table-filters">
          <button className="filter-pill active">
            All stock <span>24</span>
          </button>
          <button className="filter-pill">
            Available <span>18</span>
          </button>
          <button className="filter-pill">
            In preparation <span>4</span>
          </button>
        </div>
        <button className="activity-filter">
          <Search size={14} /> Search stock
        </button>
      </div>
      <section className="panel data-panel">
        <div className="data-table-head">
          <span>VEHICLE</span>
          <span>STOCK STATUS</span>
          <span>ADDED</span>
          <span>ASKING PRICE</span>
          <span />
        </div>
        {[
          [
            "Volkswagen Polo",
            "1.0 TSI Comfortline · 2021",
            "Available",
            "Today",
            "R 239 900",
            "sand",
          ],
          [
            "Toyota Corolla Cross",
            "1.8 XS CVT · 2022",
            "Available",
            "Yesterday",
            "R 319 900",
            "green",
          ],
          [
            "Ford EcoSport",
            "1.0 EcoBoost · 2020",
            "In preparation",
            "4 Nov",
            "R 184 900",
            "blue",
          ],
          [
            "Suzuki Swift",
            "1.2 GL · 2022",
            "Reserved",
            "3 Nov",
            "R 169 900",
            "sand",
          ],
        ].map((row) => (
          <div className="data-table-row" key={row[0]}>
            <div className="table-vehicle">
              <div className={`stock-vehicle stock-${row[5]}`}>
                <CarSketch variant={row[5] === "green" ? "green" : "sand"} />
              </div>
              <span>
                <b>{row[0]}</b>
                <small>{row[1]}</small>
              </span>
            </div>
            <span
              className={`table-status ${row[2] === "Available" ? "status-available" : row[2] === "Reserved" ? "status-reserved" : ""}`}
            >
              <i />
              {row[2]}
            </span>
            <span className="table-muted">{row[3]}</span>
            <b>{row[4]}</b>
            <button
              className="icon-button"
              aria-label={`More actions for ${row[0]}`}
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
        ))}
      </section>
      <div className="app-disclaimer">
        Sample vehicle details for preview only.
      </div>
    </>
  );
}
function LeadsPage() {
  return (
    <section className="panel data-panel">
      <div className="table-toolbar">
        <div className="table-filters">
          <button className="filter-pill active">
            All enquiries <span>08</span>
          </button>
          <button className="filter-pill">
            New <span>3</span>
          </button>
          <button className="filter-pill">
            Follow up <span>5</span>
          </button>
        </div>
        <button className="activity-filter">
          <Search size={14} /> Search people
        </button>
      </div>
      <div className="data-table-head lead-table-head">
        <span>PERSON</span>
        <span>INTERESTED IN</span>
        <span>STATUS</span>
        <span>LAST ACTIVITY</span>
        <span />
      </div>
      {[
        [
          "Thandi Ndlovu",
          "Toyota Corolla Cross",
          "New enquiry",
          "12 min ago",
          "TN",
        ],
        ["Liam Moyo", "Volkswagen Polo", "Follow up", "Today, 09:15", "LM"],
        ["Sihle Khumalo", "Ford EcoSport", "Appointment", "Yesterday", "SK"],
        ["Amara Mwale", "Suzuki Swift", "Follow up", "Yesterday", "AM"],
      ].map((row, i) => (
        <div className="data-table-row lead-table-row" key={row[0]}>
          <div className="lead-person">
            <span className={`task-avatar lead-color-${i}`}>{row[4]}</span>
            <span>
              <b>{row[0]}</b>
              <small>Buyer enquiry · Preview</small>
            </span>
          </div>
          <span className="lead-car-name">{row[1]}</span>
          <span className={`task-status ${i === 0 ? "status-new" : ""}`}>
            {row[2]}
          </span>
          <span className="table-muted">{row[3]}</span>
          <button
            className="icon-button"
            aria-label={`More actions for ${row[0]}`}
          >
            <MoreHorizontal size={17} />
          </button>
        </div>
      ))}
    </section>
  );
}
function TasksPage() {
  return (
    <>
      <div className="myday-overview">
        <div className="day-date-card">
          <span>SATURDAY</span>
          <b>07</b>
          <small>NOVEMBER 2026</small>
          <div>
            <i /> JOHANNESBURG, SA
          </div>
        </div>
        <div className="myday-stats">
          <div>
            <span>To do today</span>
            <b>06</b>
            <small>Across your workspace</small>
          </div>
          <div>
            <span>Completed</span>
            <b>04</b>
            <small>Nice work so far</small>
          </div>
          <div>
            <span>Coming up next</span>
            <b>10:30</b>
            <small>Buyer follow-up</small>
          </div>
        </div>
      </div>
      <section className="panel myday-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">A GOOD PLACE TO BEGIN</span>
            <h2>Your next steps</h2>
          </div>
          <span className="tasks-counter">3 open</span>
        </div>
        {[
          [
            "Follow up with Liam Moyo",
            "Volkswagen Polo enquiry · confirm viewing time",
            "10:30",
            "LM",
          ],
          [
            "Check in on Ford EcoSport prep",
            "Workshop update · Sihle is assigned",
            "12:00",
            "SK",
          ],
          [
            "Review the new enquiry from Thandi",
            "Toyota Corolla Cross · today’s first response",
            "14:00",
            "TN",
          ],
        ].map((row) => (
          <div className="myday-row" key={row[0]}>
            <CompletionToggle task={row[0]} />
            <div>
              <b>{row[0]}</b>
              <span>{row[1]}</span>
            </div>
            <span className="myday-time">{row[2]}</span>
            <span className="task-avatar">{row[3]}</span>
            <button
              className="icon-button"
              aria-label={`More actions for ${row[0]}`}
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
        ))}
      </section>
      <div className="app-disclaimer">
        The sample tasks are local preview content; completion isn’t saved.
      </div>
    </>
  );
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  return (
    <Suspense fallback={<main className="route-loading" role="status">Loading your workspace…</main>}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<AppShell workspace={null} preview />} />
      <Route path="/demo/stock" element={<AppShell workspace={null} preview />} />
      <Route path="/demo/leads" element={<AppShell workspace={null} preview />} />
      <Route path="/demo/tasks" element={<AppShell workspace={null} preview />} />
      <Route path="/tutorial" element={<Tutorial />} />
      <Route path="/privacy" element={<PrivacyNotice />} />
      <Route path="/terms" element={<TermsNotice />} />
      <Route
        path="/start"
        element={
          <OnboardingWizard
            onSubmitted={(name) =>
              setWorkspace({ name, email: "", branch: "Default dealership" })
            }
          />
        }
      />
      <Route
        path="/invite"
        element={
          <InviteAccept
            onJoined={() =>
              setWorkspace({
                name: "Dealership workspace",
                email: "",
                branch: "Company workspace",
              })
            }
          />
        }
      />
      <Route path="/auth/callback" element={<AuthReturn />} />
      <Route path="/reset-password/confirm" element={<PasswordUpdate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="/app/stock" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="/app/leads" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="/app/tasks" element={<WorkspaceRoute workspace={workspace} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
