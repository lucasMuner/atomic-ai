export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

/**
 * Balão de mensagem "normal" (não animado) para o histórico já concluído.
 * As mensagens ainda em andamento usam ThinkingState / StreamingText direto
 * no App — este componente é só para o que já foi resolvido.
 */
export default function MessageBubble({ role, text }: Message) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-card px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-ink text-page"
            : "border border-line bg-surface text-ink shadow-hairline"
        }`}
      >
        {text}
      </div>
    </div>
  );
}