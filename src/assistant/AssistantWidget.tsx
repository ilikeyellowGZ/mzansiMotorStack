import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Maximize2, MessageCircle, Minimize2, RotateCcw, Send, UserRound, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { hasApprovedLegalNotices } from "../lib/config";
import { emptyAnswers, formatMoney, normaliseWebsiteUrl, type SetupMethod } from "../lib/onboarding";
import { loadOnboardingDraft } from "../lib/onboardingRepository";
import { askAssistant, saveAssistantSetupChoices, submitEnquiry, type Enquiry, type WireMessage } from "./assistantApi";
import { loadThread, saveThread, type ChatItem } from "./assistantStorage";

const greeting = "Hi, I’m MotorStack’s AI assistant. I can help you choose a plan or get your dealership set up. What would you like to do?";
const opening: ChatItem = { id: "greeting", role: "assistant", text: greeting };
const stepQuestions = ["", "", "What dealership details should I add?", "What should I add for my website and social pages?", "Should I set up myself or request assistance?", "Which plan fits my team?", "How do I request assisted setup?", "What should I review before submitting?"];

function suggestions(path: string, step: number | null) {
  if (path === "/pricing") return ["Which plan fits a small dealership?", "What does assisted setup cost?", "Can I add a website?"];
  if (path === "/onboarding") return [stepQuestions[step ?? 2] ?? stepQuestions[2], "How does assisted setup work?", "Talk to a person"];
  if (path.endsWith("/stock")) return ["How do I add vehicles?", "Can I import stock?", "What inventory tools are available?"];
  if (path.startsWith("/app")) return ["How do I finish setup?", "How do I add my team?", "Compare plans"];
  return ["Help me choose a plan", "How does setup work?", "Compare features"];
}

function isNearBottom(node: HTMLDivElement) {
  return node.scrollHeight - node.scrollTop - node.clientHeight < 72;
}
function append(items: ChatItem[], item: ChatItem): ChatItem[] { return [...items, item].slice(-40); }

function SetupPanel({ identity, path, onDone }: { identity: string; path: string; onDone: (message: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(2);
  const [website, setWebsite] = useState("");
  const [noWebsite, setNoWebsite] = useState(false);
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [setup, setSetup] = useState<SetupMethod | "">("");
  const [websiteService, setWebsiteService] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    void loadOnboardingDraft().then((draft) => {
      if (!active) return;
      const answers = { ...emptyAnswers, ...draft?.answers };
      setStep(draft?.currentStep ?? 2);
      setWebsite(answers.websiteUrl); setNoWebsite(answers.addWebsiteLater);
      setFacebook(answers.socialProfiles.Facebook ?? ""); setInstagram(answers.socialProfiles.Instagram ?? "");
      setSetup(answers.setupMethod); setWebsiteService(answers.websiteOptions); setLoaded(true);
    }).catch(() => { if (active) { setError("Your saved setup could not be loaded. Open the setup form to continue."); setLoaded(true); } });
    return () => { active = false; };
  }, [identity]);

  if (identity === "anonymous") return <div className="assistant-context-card"><p>Sign in to save your dealership setup. The ordinary setup form is always available.</p><Link to="/start">Start dealership setup</Link></div>;
  if (path === "/onboarding") return <div className="assistant-context-card"><p>You are already in the dealership setup form. Continue there so your current edits stay together.</p><Link to="/tutorial">Read the setup guide</Link></div>;
  if (!loaded) return <p className="assistant-context-card" role="status">Checking saved setup…</p>;
  if (error) return <div className="assistant-context-card" role="alert"><p>{error}</p><Link to="/onboarding">Open setup form</Link></div>;

  function validUrl(value: string) { return value.trim() ? normaliseWebsiteUrl(value) : ""; }
  function review() {
    if (!noWebsite && website.trim() && !validUrl(website)) return setError("Enter a valid website URL or choose ‘I don’t have a website’.");
    if (facebook.trim() && !validUrl(facebook)) return setError("Enter a valid Facebook page URL or leave it blank.");
    if (instagram.trim() && !validUrl(instagram)) return setError("Enter a valid Instagram page URL or leave it blank.");
    if (!setup) return setError("Choose how you want to set up your dealership.");
    setError(""); setReviewing(true);
  }
  async function save() {
    setSaving(true); setError("");
    try {
      await saveAssistantSetupChoices({
        websiteUrl: noWebsite ? "" : validUrl(website)!, noWebsite,
        facebook: validUrl(facebook)!, instagram: validUrl(instagram)!,
        setupMethod: setup as SetupMethod, websiteService,
      });
      onDone("Your website, social and setup choices were saved. Continue in the setup form to complete required details and review your request.");
    } catch { setError("Your choices were not saved. Please retry or use the setup form."); }
    finally { setSaving(false); }
  }
  return <div className="assistant-context-card assistant-setup-card">
    <strong>Dealership setup</strong>
    <p>Saved progress: step {step} of 7. This quick review updates only these choices. Complete the remaining details in the <Link to="/onboarding">setup form</Link>.</p>
    {!reviewing ? <>
      <label>Website URL <input value={website} onChange={(event) => setWebsite(event.target.value)} disabled={noWebsite} placeholder="https://yourdealership.co.za" /></label>
      <label className="assistant-checkbox"><input type="checkbox" checked={noWebsite} onChange={(event) => setNoWebsite(event.target.checked)} /> I don’t have a website</label>
      <label>Facebook page (optional) <input value={facebook} onChange={(event) => setFacebook(event.target.value)} placeholder="https://facebook.com/…" /></label>
      <label>Instagram page (optional) <input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="https://instagram.com/…" /></label>
      <label>Setup choice <select value={setup} onChange={(event) => setSetup(event.target.value as SetupMethod | "")}><option value="">Choose one</option><option value="self_service">I’ll set it up myself</option><option value="online">Request paid online assistance</option><option value="in_person">Request paid in-person assistance</option></select></label>
      <label className="assistant-checkbox"><input type="checkbox" checked={websiteService} onChange={(event) => setWebsiteService(event.target.checked)} /> I’d like to discuss a dealership website</label>
      <p className="assistant-small">Your choices are saved only after review. See our <Link to="/privacy">privacy notice</Link>.</p>
      <button className="assistant-action" type="button" onClick={review}>Review choices</button>
    </> : <>
      <dl className="assistant-review-list"><dt>Website</dt><dd>{noWebsite ? "None yet" : website || "Not provided"}</dd><dt>Social pages</dt><dd>{[facebook, instagram].filter(Boolean).join(", ") || "None"}</dd><dt>Setup</dt><dd>{setup === "self_service" ? "Self setup" : setup === "online" ? "Paid online assistance" : "Paid in-person assistance"}</dd><dt>Website service</dt><dd>{websiteService ? "Interested" : "Not requested"}</dd></dl>
      <div className="assistant-row"><button type="button" onClick={() => setReviewing(false)}>Edit</button><button className="assistant-action" type="button" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save choices"}</button></div>
    </>}
    {error && <p className="assistant-error" role="alert">{error}</p>}
  </div>;
}

export default function AssistantWidget({ identity, open, onClose }: { identity: string; open: boolean; onClose: () => void }) {
  const location = useLocation();
  const [messages, setMessages] = useState<ChatItem[]>([opening]);
  const [threadId, setThreadId] = useState<string>(() => crypto.randomUUID());
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mobile, setMobile] = useState(() => matchMedia("(max-width: 600px)").matches);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [newMessages, setNewMessages] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [reviewEnquiry, setReviewEnquiry] = useState(false);
  const [requestReceived, setRequestReceived] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const wasAtBottom = useRef(true);

  useEffect(() => {
    const id = "assistant-lexend-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;500;600;700&display=swap";
      document.head.append(link);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void loadThread(identity).then((saved) => { if (active && saved) { setThreadId(saved.threadId); setMessages(saved.messages.length ? saved.messages : [opening]); setDraft(saved.draft); } })
      .catch(() => { /* A fresh local thread remains available. */ })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; controller.current?.abort(); };
  }, [identity]);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => { void saveThread(identity, { threadId, messages, draft }).catch(() => { /* The active session still holds the thread. */ }); }, 400);
    return () => clearTimeout(timer);
  }, [identity, ready, threadId, messages, draft]);
  useEffect(() => {
    const media = matchMedia("(max-width: 600px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (mobile && event.key === "Tab" && panelRef.current) {
        const controls = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],textarea:not([disabled]),input:not([disabled]),select:not([disabled])')].filter((node) => node.getClientRects().length > 0);
        if (!controls.length) return;
        const first = controls[0], last = controls.at(-1)!;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mobile, onClose]);
  useEffect(() => {
    const node = transcriptRef.current;
    if (!node || !open) return;
    if (wasAtBottom.current) { node.scrollTop = node.scrollHeight; setNewMessages(false); }
    else setNewMessages(true);
  }, [messages, pending, open, setupOpen, enquiry]);
  useEffect(() => {
    if (location.pathname !== "/onboarding" || identity === "anonymous") return;
    void loadOnboardingDraft().then((draft) => setOnboardingStep(draft?.currentStep ?? 2)).catch(() => setOnboardingStep(null));
  }, [identity, location.pathname]);

  const pageSuggestions = useMemo(() => suggestions(location.pathname, onboardingStep), [location.pathname, onboardingStep]);
  async function respond(next: ChatItem[]) {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setPending(true); setError("");
    try {
      const history: WireMessage[] = next.filter((item) => item.id !== "greeting").map(({ role, text }) => ({ role, text }));
      const result = await askAssistant(history, location.pathname, current.signal);
      if (current.signal.aborted) return;
      setMessages((items) => append(items, { id: crypto.randomUUID(), role: "assistant", text: result.text, sources: result.sources, plan: result.plan, setupFees: result.setupFees }));
      if (result.handoff) startEnquiry(/demo|appointment|meeting/i.test(next.at(-1)?.text ?? "") ? "demo" : "person", next);
    } catch (cause) {
      if (!current.signal.aborted) setError(cause instanceof Error ? cause.message : "The assistant is unavailable. Please retry.");
    } finally { if (controller.current === current) { setPending(false); controller.current = null; } }
  }
  function send(value = draft) {
    const text = value.trim(); if (!text || pending) return;
    if (/\b(password|one.time password|otp|api key|bank (account|details)|identity document)\b/i.test(text)) { setError("Please use the secure account or billing screens for sensitive details. Don’t enter them in chat."); return; }
    const next = append(messages, { id: crypto.randomUUID(), role: "user", text: text.slice(0, 800) });
    wasAtBottom.current = true; setMessages(next); setDraft(""); setSetupOpen(false);
    if (/\b(?:talk|speak|connect|handoff)\b.{0,40}\b(?:person|human|agent|representative|someone|team|support)\b|\b(?:human|person|agent|representative)\s+(?:help|support)\b/i.test(text)) {
      setMessages(append(next, { id: crypto.randomUUID(), role: "assistant", text: "I can pass a reviewed request to the team. Please check the details below before sending it." }));
      startEnquiry("person", next);
      return;
    }
    if (/\b(book|request|schedule)\b.*\b(demo|meeting|appointment)\b/i.test(text)) {
      setMessages(append(next, { id: crypto.randomUUID(), role: "assistant", text: "I can take a demo request. A time is only confirmed when the team follows up." }));
      startEnquiry("demo", next);
      return;
    }
    if (/\b(?:i want|i need|request|book)\b.{0,50}\b(?:assisted setup|setup help)\b/i.test(text)) {
      setMessages(append(next, { id: crypto.randomUUID(), role: "assistant", text: identity === "anonymous" ? "I can record a reviewed setup request for the team." : "I can save your setup choices, then the onboarding form will collect the remaining details and review your request." }));
      if (identity === "anonymous") startEnquiry("assisted_setup", next); else setSetupOpen(true);
      return;
    }
    void respond(next);
  }
  function startEnquiry(kind: Enquiry["kind"], current = messages) {
    controller.current?.abort();
    setPending(false);
    const summary = current.slice(-8).map((item) => `${item.role === "user" ? "Visitor" : "Assistant"}: ${item.text}`).join("\n").slice(0, 1700);
    setEnquiry({ requestId: crypto.randomUUID(), kind, name: "", email: "", dealership: "", summary: summary.length >= 5 ? summary : "I would like someone to contact me about MzansiMotorStack." });
    setReviewEnquiry(false); setRequestReceived(false); setError("");
  }
  function validateEnquiry() {
    if (!enquiry) return;
    if (enquiry.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email) || enquiry.dealership.trim().length < 2 || enquiry.summary.trim().length < 5) {
      setError("Add your name, email, dealership and a short request summary."); return;
    }
    setError(""); setReviewEnquiry(true);
  }
  async function confirmEnquiry() {
    if (!enquiry) return;
    setSendingRequest(true); setError("");
    try { await submitEnquiry(enquiry); setRequestReceived(true); setMessages((items) => append(items, { id: crypto.randomUUID(), role: "assistant", text: "Your request was received. The team can review it, but no appointment or live chat has been confirmed." })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The request could not be sent. Please retry."); }
    finally { setSendingRequest(false); }
  }
  function newConversation() {
    controller.current?.abort(); setThreadId(crypto.randomUUID()); setMessages([opening]); setDraft(""); setError(""); setSetupOpen(false); setEnquiry(null); setExpanded(false); wasAtBottom.current = true;
  }
  function setupSaved(text: string) {
    setSetupOpen(false);
    void loadOnboardingDraft().then((saved) => setOnboardingStep(saved?.currentStep ?? null)).catch(() => setOnboardingStep(null));
    setMessages((items) => append(items, { id: crypto.randomUUID(), role: "assistant", text, sources: [{ title: "Setup guide", href: "/tutorial" }] }));
  }

  return <section ref={panelRef} className={`assistant-panel ${expanded ? "assistant-expanded" : ""} ${open ? "is-open" : ""}`} role="dialog" aria-modal={mobile ? "true" : "false"} aria-label="MotorStack Assistant" hidden={!open}>
    <span className="sr-only" role="status" aria-live="polite">{pending ? "MotorStack Assistant is thinking" : messages.at(-1)?.role === "assistant" ? messages.at(-1)?.text : ""}</span>
    <header className="assistant-header">
      <span className="assistant-avatar"><img src="/brand/mzansi-road-mark.png" alt="" width="30" height="30" /></span>
      <span className="assistant-title"><strong>MotorStack Assistant</strong><small>Powered by AI</small></span>
      <button type="button" className="assistant-header-button assistant-new" onClick={newConversation} aria-label="New conversation" title="New conversation"><RotateCcw size={18} /></button>
      {!mobile && <button type="button" className="assistant-header-button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Shrink chat" : "Expand chat"} title={expanded ? "Shrink chat" : "Expand chat"}>{expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>}
      <button type="button" className="assistant-header-button" onClick={onClose} aria-label="Close chat" title="Close chat"><X size={20} /></button>
    </header>
    <div className="assistant-transcript" ref={transcriptRef} onScroll={(event) => { wasAtBottom.current = isNearBottom(event.currentTarget); if (wasAtBottom.current) setNewMessages(false); }} aria-label="Conversation">
      {messages.map((item) => <div className={`assistant-message assistant-message-${item.role}`} key={item.id}>
        {item.role === "assistant" && <span className="assistant-message-avatar"><img src="/brand/mzansi-road-mark.png" alt="" width="22" height="22" /></span>}
        <div className="assistant-message-content"><p>{item.text}</p>
          {item.sources?.length ? <div className="assistant-sources">Sources: {item.sources.map((source) => <Link key={source.href} to={source.href}>{source.title}</Link>)}</div> : null}
          {item.plan && <div className="assistant-plan-card"><span>Suggested starting point</span><strong>{item.plan.name}</strong><b>{formatMoney(item.plan.monthly)} <small>/ month</small></b>{item.plan.reason && <p>{item.plan.reason}</p>}<p>{item.plan.users} users · {item.plan.support}</p><p>AI: {item.plan.ai}</p>{item.plan.website && <p>Website: {item.plan.website}</p>}{item.plan.social && <p>Social: {item.plan.social}</p>}<small>Annual: {formatMoney(item.plan.annual)}. VAT and final entitlements require confirmation.</small><Link to="/pricing">Check plan details <ArrowUp size={14} /></Link><Link to={hasApprovedLegalNotices ? "/start" : "/demo"}>{hasApprovedLegalNotices ? "Continue to setup" : "Explore the demo"} <ArrowUp size={14} /></Link></div>}
          {item.setupFees?.length ? <div className="assistant-plan-card"><span>Assisted online setup</span>{item.setupFees.map((fee) => <p key={fee.code}><strong>{fee.name}</strong> · {formatMoney(fee.onlineMinor)}</p>)}<small>In-person travel and unsupported imports are quoted separately. Confirm the final quote before checkout.</small><Link to="/pricing">Check setup pricing <ArrowUp size={14} /></Link></div> : null}
        </div>
      </div>)}
      {messages.length === 1 && <div className="assistant-entry-actions">
        <button type="button" onClick={() => send("Help me choose a plan")}>Help me choose a plan</button>
        <button type="button" onClick={() => send("Compare features")}>Compare features</button>
        <button type="button" onClick={() => setSetupOpen(true)}>Set up my dealership</button>
      </div>}
      {messages.length > 1 && !enquiry && !setupOpen && <div className="assistant-suggestions" aria-label="Suggested questions">{pageSuggestions.map((question) => <button type="button" key={question} onClick={() => question === "Talk to a person" ? startEnquiry("person") : send(question)}>{question}</button>)}</div>}
      {setupOpen && <SetupPanel identity={identity} path={location.pathname} onDone={setupSaved} />}
      {enquiry && <div className="assistant-context-card assistant-enquiry-card">
        <strong>{enquiry.kind === "demo" ? "Request a demo" : enquiry.kind === "assisted_setup" ? "Request setup help" : "Talk to a person"}</strong>
        {requestReceived ? <p role="status">Request received. This is a request for follow-up; no appointment or live agent is confirmed.</p> : <>
          <p>We need contact details to pass your reviewed request to the team. Read our <Link to="/privacy">privacy notice</Link>. This is separate from marketing consent.</p>
          {!reviewEnquiry ? <>
            <label>Your name <input value={enquiry.name} autoComplete="name" onChange={(event) => setEnquiry({ ...enquiry, name: event.target.value })} /></label>
            <label>Work email <input type="email" value={enquiry.email} autoComplete="email" onChange={(event) => setEnquiry({ ...enquiry, email: event.target.value })} /></label>
            <label>Dealership <input value={enquiry.dealership} autoComplete="organization" onChange={(event) => setEnquiry({ ...enquiry, dealership: event.target.value })} /></label>
            <label>Request summary <textarea rows={4} value={enquiry.summary} onChange={(event) => setEnquiry({ ...enquiry, summary: event.target.value })} /></label>
            <div className="assistant-row"><button type="button" onClick={() => setEnquiry(null)}>Cancel</button><button type="button" className="assistant-action" onClick={validateEnquiry}>Review request</button></div>
          </> : <>
            <dl className="assistant-review-list"><dt>Name</dt><dd>{enquiry.name}</dd><dt>Email</dt><dd>{enquiry.email}</dd><dt>Dealership</dt><dd>{enquiry.dealership}</dd><dt>Summary</dt><dd>{enquiry.summary}</dd></dl>
            <div className="assistant-row"><button type="button" onClick={() => setReviewEnquiry(false)}>Edit</button><button type="button" className="assistant-action" disabled={sendingRequest} onClick={() => void confirmEnquiry()}>{sendingRequest ? "Sending…" : "Send request"}</button></div>
          </>}
        </>}
      </div>}
      {pending && <div className="assistant-message assistant-message-assistant" role="status"><span className="assistant-message-avatar"><MessageCircle size={18} /></span><div className="assistant-message-content"><p>Thinking…</p></div></div>}
      {error && <div className="assistant-error" role="alert"><span>{error}</span>{messages.at(-1)?.role === "user" && !pending && <button type="button" onClick={() => void respond(messages)}>Retry</button>}</div>}
    </div>
    {newMessages && <button type="button" className="assistant-new-messages" onClick={() => { const node = transcriptRef.current; if (node) node.scrollTop = node.scrollHeight; wasAtBottom.current = true; setNewMessages(false); }}>New messages <ArrowDown size={14} /></button>}
    <div className="assistant-bottom">
      <div className="assistant-help-row"><button type="button" onClick={() => startEnquiry("person")}><UserRound size={15} /> Talk to a person</button><button type="button" onClick={() => startEnquiry("demo")}>Request a demo</button></div>
      <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <label className="sr-only" htmlFor="assistant-input">Ask MotorStack Assistant</label>
        <textarea id="assistant-input" ref={inputRef} rows={1} maxLength={800} placeholder="Ask me anything…" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
        {pending ? <button type="button" aria-label="Stop response" title="Stop response" onClick={() => { controller.current?.abort(); setPending(false); setError("Response stopped. You can retry."); }}><X size={18} /></button> : <button type="submit" disabled={!draft.trim()} aria-label="Send message" title="Send message"><Send size={18} /></button>}
      </form>
      <small className="assistant-accuracy">AI can make mistakes.</small>
    </div>
  </section>;
}
