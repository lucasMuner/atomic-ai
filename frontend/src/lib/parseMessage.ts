/**
 * Parser bem simples pra separar blocos de código (```lang\n...\n```) do
 * texto normal de uma mensagem. Não é markdown completo — só o suficiente
 * pra respostas de código não ficarem achatadas em texto puro.
 */

export type TextSegment = { type: "text"; content: string };
export type CodeSegment = { type: "code"; content: string; lang?: string };
export type MessageSegment = TextSegment | CodeSegment;

const FENCE = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;

export function parseMessage(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const match of raw.matchAll(FENCE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      const text = raw.slice(lastIndex, start);
      if (text) segments.push({ type: "text", content: text });
    }
    const [, lang, code] = match;
    segments.push({ type: "code", content: code.replace(/\n$/, ""), lang: lang || undefined });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < raw.length) {
    const text = raw.slice(lastIndex);
    if (text) segments.push({ type: "text", content: text });
  }

  if (segments.length === 0) segments.push({ type: "text", content: raw });
  return segments;
}