import { useCallback, useState, type ReactNode } from "react";

/**
 * Bloco de código pra dentro das mensagens do chat — adaptado do CodeBlock
 * do beautiful-ui (components/primitives/CodeBlock.tsx), mas sem o modo
 * "Diff" (não faz sentido aqui) e com o header mostrando a linguagem em vez
 * de um nome de arquivo fixo.
 */

const KEYWORDS = new Set([
  "import", "from", "export", "default", "async", "function", "const", "let", "var",
  "await", "return", "if", "else", "for", "while", "new", "throw", "try", "catch",
  "null", "true", "false", "undefined", "def", "class", "self", "print", "in", "is",
  "not", "and", "or", "None", "True", "False",
]);
const TOKEN =
  /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b(?:import|from|export|default|async|function|const|let|var|await|return|if|else|for|while|new|throw|try|catch|null|true|false|undefined|def|class|self|print|in|is|not|and|or|None|True|False)\b|[A-Za-z_$][\w$]*(?=\s*\())/g;

function highlight(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    const t = m[0];
    if (idx > last) nodes.push(<span key={k++}>{text.slice(last, idx)}</span>);
    let color: string;
    let weight: number | undefined;
    if (/^["'`]/.test(t) || /^\d/.test(t)) color = "var(--orange)";
    else if (KEYWORDS.has(t)) color = "var(--accent-ink)";
    else {
      color = "var(--ink)";
      weight = 500;
    }
    nodes.push(
      <span key={k++} style={{ color, fontWeight: weight }}>
        {t}
      </span>,
    );
    last = idx + t.length;
  }
  if (last < text.length) nodes.push(<span key={k++}>{text.slice(last)}</span>);
  return nodes;
}

function FileIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-ink-3"
    >
      <path d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  );
}

export default function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <div className="my-1.5 w-full max-w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex h-9 items-center gap-2 border-b border-line px-3 text-[12px]">
        <span className="inline-flex min-w-0 items-center gap-[6px]">
          <FileIcon />
          <span className="truncate font-mono leading-none text-ink-3">{lang || "código"}</span>
        </span>
        <button
          type="button"
          aria-label="Copiar código"
          onClick={copy}
          className={`-mr-1 ml-auto flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[12px]
            font-medium transition-colors duration-100 hover:bg-hover
            ${copied ? "text-green" : "text-ink-3 hover:text-ink"}`}
        >
          {copied ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="12" height="12" rx="2.5" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <div className="overflow-x-auto py-2.5 font-mono text-[12.5px] leading-[1.65] text-ink-2">
        <div className="relative min-w-fit">
          <span className="pointer-events-none absolute inset-y-0 left-5 w-px bg-line" />
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[20px_minmax(0,1fr)] items-start">
              <span className="select-none text-center text-[11px] text-ink-3">{i + 1}</span>
              <code className="pr-3 pl-1 whitespace-pre">{highlight(line)}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}