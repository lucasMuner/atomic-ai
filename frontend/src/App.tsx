import { useEffect, useRef, useState } from "react";
import PromptBar from "./components/PromptBar";
import ThinkingState from "./components/ThinkingState";
import StreamingText, { type StreamingToken } from "./components/StreamingText";
import MessageBubble, { type Message } from "./components/MessageBubble";
import Sidebar, { type Conversation } from "./components/Sidebar";
import { streamChat, type ChatHistoryItem } from "./lib/chatApi";

type Phase = "idle" | "thinking" | "streaming" | "error";

let nextId = 0;
const uid = () => `${Date.now()}-${nextId++}`;

const makeConversation = (): Conversation => ({
  id: uid(),
  title: "Nova conversa",
  messages: [],
});

const STORAGE_KEY = "ai-102-chat-conversations";

// os dois useState abaixo rodam na mesma renderização (o primeiro mount), então
// cacheamos o resultado pra não ler o localStorage duas vezes nem, pior, criar
// duas conversas "novas" diferentes (uma pro conversations, outra pro activeId)
let cachedInitialState: { conversations: Conversation[]; activeId: string } | null = null;
function loadInitialState() {
  if (cachedInitialState) return cachedInitialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { conversations?: Conversation[]; activeId?: string };
      if (Array.isArray(parsed.conversations) && parsed.conversations.length > 0) {
        cachedInitialState = {
          conversations: parsed.conversations,
          activeId: parsed.activeId ?? parsed.conversations[0].id,
        };
        return cachedInitialState;
      }
    }
  } catch {
    // localStorage corrompido ou indisponível — segue com uma conversa nova
  }
  const conv = makeConversation();
  cachedInitialState = { conversations: [conv], activeId: conv.id };
  return cachedInitialState;
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadInitialState().conversations);
  const [activeId, setActiveId] = useState(() => loadInitialState().activeId);
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveTokens, setLiveTokens] = useState<StreamingToken[]>([]);
  const [errorText, setErrorText] = useState("");

  // dark mode: o .dark já existe inteiro no index.css, só falta alternar a classe
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // salva sempre que uma conversa é criada, trocada ou ganha uma mensagem nova.
  // a resposta que ainda está no meio do streaming (liveTokens) não entra aqui —
  // se recarregar a página no meio de uma resposta, ela se perde (fica só o que
  // já tinha sido salvo antes daquele envio).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeId }));
  }, [conversations, activeId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const leftoverRef = useRef(""); // pedaço de palavra que ainda não fechou (entre chunks)
  const fullTextRef = useRef(""); // texto completo acumulado, pra salvar no histórico ao final
  // StreamingText "termina" quando o efeito de digitação alcança o tamanho atual
  // do content — o que pode acontecer ANTES do fetch terminar (rede mais lenta
  // que a digitação). Esse ref guarda se o backend já mandou tudo, pra só
  // fechar a mensagem de verdade quando as duas coisas (rede + digitação) baterem.
  const networkDoneRef = useRef(false);

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const busy = phase === "thinking" || phase === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages, liveTokens, phase]);

  const updateActive = (updater: (c: Conversation) => Conversation) => {
    setConversations((current) => current.map((c) => (c.id === activeId ? updater(c) : c)));
  };

  const handleNewConversation = () => {
    if (busy) return;
    const conv = makeConversation();
    setConversations((current) => [conv, ...current]);
    setActiveId(conv.id);
    setLiveTokens([]);
    setErrorText("");
  };

  const handleSelectConversation = (id: string) => {
    if (busy || id === activeId) return;
    setActiveId(id);
    setLiveTokens([]);
    setErrorText("");
    setPhase("idle");
  };

  const handleSend = async (text: string) => {
    if (busy || !active) return;

    const history: ChatHistoryItem[] = active.messages.map((m) => ({ role: m.role, content: m.text }));
    const isFirstMessage = active.messages.length === 0;

    const userMsg: Message = { id: uid(), role: "user", text };
    updateActive((c) => ({
      ...c,
      title: isFirstMessage ? text.slice(0, 40) : c.title,
      messages: [...c.messages, userMsg],
    }));

    setLiveTokens([]);
    setErrorText("");
    leftoverRef.current = "";
    fullTextRef.current = "";
    networkDoneRef.current = false;
    setPhase("thinking");

    try {
      await streamChat(text, history, (chunk) => {
        // primeiro pedaço de resposta real chegando: sai do "pensando" pro streaming
        setPhase((current) => (current === "thinking" ? "streaming" : current));

        fullTextRef.current += chunk;
        const combined = leftoverRef.current + chunk;
        // separa em palavras, mas guarda a última (pode estar cortada no meio)
        const parts = combined.split(/(\s+)/);
        leftoverRef.current = parts.pop() ?? "";
        const newTokens: StreamingToken[] = parts.filter((p) => p.length > 0).map((t) => ({ text: t }));
        if (newTokens.length > 0) {
          setLiveTokens((current) => [...current, ...newTokens]);
        }
      });

      // stream acabou: solta o que sobrou no buffer e só então marca a rede como concluída
      if (leftoverRef.current) {
        setLiveTokens((current) => [...current, { text: leftoverRef.current }]);
      }
      networkDoneRef.current = true;
    } catch (err) {
      console.error(err);
      setErrorText(
        "Não consegui falar com o backend. Confere se o servidor FastAPI está rodando e se o endpoint /api/chat existe.",
      );
      setPhase("error");
    }
  };

  // chamado pelo StreamingText quando termina de "digitar" tudo que já recebeu.
  // Pode disparar antes do fetch acabar (rede mais lenta que a digitação) — nesse
  // caso ignoramos e esperamos o próximo chunk reabrir o ciclo de digitação.
  const handleStreamSettled = () => {
    if (phase !== "streaming" || !networkDoneRef.current) return;
    updateActive((c) => ({
      ...c,
      messages: [...c.messages, { id: uid(), role: "assistant", text: fullTextRef.current || "(resposta vazia)" }],
    }));
    setLiveTokens([]);
    setPhase("idle");
  };

  return (
    <div className="flex h-screen bg-page">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-6">
          {active?.messages.length === 0 && phase === "idle" && (
            <p className="m-auto text-[13px] text-ink-3">Manda uma mensagem pra começar.</p>
          )}

          {active?.messages.map((m) => (
            <MessageBubble key={m.id} {...m} />
          ))}

          {phase === "thinking" && (
            <div className="flex justify-start">
              <ThinkingState variant="Steps" />
            </div>
          )}

          {phase === "streaming" && (
            <div className="flex justify-start">
              <StreamingText
                content={liveTokens}
                sources={[]}
                followUps={[]}
                loop={false}
                fill
                onDone={handleStreamSettled}
              />
            </div>
          )}

          {phase === "error" && errorText && (
            <div className="max-w-[85%] rounded-card border border-red-tint bg-red-tint px-3.5 py-2.5 text-[13px] text-red">
              {errorText}
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-2xl px-4 pb-6">
          <PromptBar demo={false} placeholder="Escreva uma mensagem…" onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}