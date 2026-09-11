import { Fragment } from "react";
import CodeBlock from "./CodeBlock";
import { parseMessage } from "../lib/parseMessage";

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

/** Quebra um trecho de texto normal em partes, tratando `código inline`. */
function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={i} className="rounded-[4px] bg-inset px-1 py-0.5 font-mono text-[12px] text-ink-2">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Balão de mensagem "normal" (não animado) para o histórico já concluído.
 * As mensagens ainda em andamento usam ThinkingState / StreamingText direto
 * no App — este componente é só para o que já foi resolvido.
 *
 * Suporta blocos de código (```lang) e `código inline`, já que respostas da
 * IA sobre a API do Azure costumam vir com trechos de código.
 */
export default function MessageBubble({ role, text }: Message) {
  const isUser = role === "user";
  const segments = parseMessage(text);

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[85%] flex-col gap-1 rounded-card px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? "bg-ink text-page"
            : "border border-line bg-surface text-ink shadow-hairline"
        }`}
      >
        {segments.map((seg, i) =>
          seg.type === "code" ? (
            <CodeBlock key={i} code={seg.content} lang={seg.lang} />
          ) : (
            <p key={i} className="whitespace-pre-wrap">
              {renderInline(seg.content)}
            </p>
          ),
        )}
      </div>
    </div>
  );
}