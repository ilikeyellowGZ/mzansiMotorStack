import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { MessageCircle, X } from "lucide-react";
import { hasClerkConfig } from "../lib/config";
import "./assistant.css";
import { clearSessionThread } from "./assistantStorage";

const AssistantWidget = lazy(() => import("./AssistantWidget"));
const greetingKey = "mzansimotorstack.assistant.greeting.v1";

function Host({ identity }: { identity: string }) {
  const [open, setOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const [greeting, setGreeting] = useState(() => sessionStorage.getItem(greetingKey) !== "shown");
  const launcher = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (greeting) sessionStorage.setItem(greetingKey, "shown"); }, [greeting]);
  function show() {
    setActivated(true);
    setOpen(true);
    setGreeting(false);
    sessionStorage.setItem(greetingKey, "shown");
  }
  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }
  return (
    <div className="assistant-host">
      {!open && greeting && <div className="assistant-welcome">
        <span className="assistant-welcome-avatar"><img src="/brand/mzansi-road-mark.png" alt="" width="30" height="30" /></span>
        <button type="button" className="assistant-welcome-dismiss" aria-label="Dismiss assistant greeting" onClick={() => { setGreeting(false); sessionStorage.setItem(greetingKey, "shown"); }}><X size={16} /></button>
        <strong>Need a hand getting started?</strong>
        <span>Ask about plans or setting up your dealership.</span>
      </div>}
      <button ref={launcher} type="button" className="assistant-launcher" aria-label={open ? "MotorStack Assistant is open" : "Open MotorStack Assistant"} aria-expanded={open} onClick={show} hidden={open}>
        <MessageCircle size={26} strokeWidth={1.9} />
      </button>
      {activated && <Suspense fallback={<div className="assistant-loading" role="status">Opening assistant…</div>}>
        <AssistantWidget identity={identity} open={open} onClose={close} />
      </Suspense>}
    </div>
  );
}

function ClerkHost() {
  const { isLoaded, userId } = useAuth();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (previous.current && previous.current !== userId) clearSessionThread(previous.current);
    previous.current = userId;
  }, [isLoaded, userId]);
  if (!isLoaded) return null;
  return <Host key={userId ?? "anonymous"} identity={userId ?? "anonymous"} />;
}

export function AssistantHost() {
  return hasClerkConfig ? <ClerkHost /> : <Host identity="anonymous" />;
}
