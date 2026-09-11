// Ajuste para a URL real do seu backend (FastAPI já libera CORS para
// localhost:5173, então dá pra chamar direto sem proxy no vite.config.ts).
const API_BASE = "http://localhost:8000";

export type ChatHistoryItem = { role: "user" | "assistant"; content: string };

/**
 * Envia a mensagem para o backend e chama `onChunk` a cada pedaço de texto
 * que chegar do stream. Espera que o backend responda com o corpo em texto
 * puro sendo escrito aos poucos (ex.: StreamingResponse do FastAPI repassando
 * o stream da API da LLM). Ajuste o parsing se o seu backend mandar SSE
 * (`data: {...}\n\n`) em vez de texto puro.
 */
export async function streamChat(
  message: string,
  history: ChatHistoryItem[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Backend respondeu ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onChunk(text);
  }
}