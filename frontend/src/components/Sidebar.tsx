import { useEffect, useRef, useState, type ReactNode } from "react";
import StatusPill from "./StatusPill";
import { checkHealth, type HealthStatus } from "../lib/chatApi";

export type Conversation = {
  id: string;
  title: string;
  messages: { id: string; role: "user" | "assistant"; text: string }[];
};

function Icon({ children, size = 17 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Marca da "Atomic AI" — núcleo + três órbitas em ângulos diferentes. */
function AtomIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      className="shrink-0 text-accent"
    >
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
    </svg>
  );
}

// intervalo de verificação do /api/health — não precisa ser agressivo, é só
// pra avisar visualmente se o backend/Azure caiu no meio da aula
const HEALTH_POLL_MS = 15000;

function useBackendHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      const result = await checkHealth(controller.signal);
      if (!cancelled) setHealth(result);
    };

    run();
    const id = setInterval(run, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, []);

  return health;
}

function HealthIndicator({ health, collapsed }: { health: HealthStatus | null; collapsed: boolean }) {
  if (!health) {
    return collapsed ? (
      <span className="size-1.5 rounded-full bg-ink-3" />
    ) : (
      <StatusPill tone="neutral" pulse>
        Verificando…
      </StatusPill>
    );
  }

  if (health.status === "offline") {
    return collapsed ? (
      <span className="size-1.5 rounded-full bg-red" title="Backend offline" />
    ) : (
      <StatusPill tone="red">Backend offline</StatusPill>
    );
  }

  if (!health.azureConfigured) {
    return collapsed ? (
      <span className="size-1.5 rounded-full bg-orange" title="Azure não configurado" />
    ) : (
      <StatusPill tone="orange">Azure não configurado</StatusPill>
    );
  }

  return collapsed ? (
    <span className="size-1.5 rounded-full bg-green" title="Azure conectado" />
  ) : (
    <StatusPill tone="green">Azure conectado</StatusPill>
  );
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  dark,
  onToggleDark,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const health = useBackendHealth();

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  const startRename = (c: Conversation) => {
    setRenamingId(c.id);
    setRenameValue(c.title);
  };

  const commitRename = () => {
    if (renamingId) {
      const trimmed = renameValue.trim();
      if (trimmed) onRename(renamingId, trimmed);
    }
    setRenamingId(null);
  };

  const handleDelete = (c: Conversation) => {
    const ok = window.confirm(`Apagar a conversa "${c.title}"? Essa ação não pode ser desfeita.`);
    if (ok) onDelete(c.id);
  };

  const filtered = search.trim()
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()))
    : conversations;

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-line bg-canvas transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="flex items-center gap-1 p-2">
            <button
                type="button"
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                onClick={() => setCollapsed((c) => !c)}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 transition-colors duration-150 hover:bg-hover hover:text-ink"
                >
                <Icon>
                    <path d="M9 3v18M3 3h18v18H3z" />
                </Icon>
            </button>
            {!collapsed && (
                <span className="flex min-w-0 items-center gap-1.5 truncate px-1 text-[13px] font-medium text-ink">
                    <AtomIcon size={25} />
                    Atomic AI
                </span>
            )}
        </div>

        {collapsed && (
            <div className="flex justify-center pb-1">
                <AtomIcon size={18} />
            </div>
        )}

      <div className={`px-2 ${collapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between gap-2"}`}>
        <HealthIndicator health={health} collapsed={collapsed} />
    </div>

      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={onNew}
          className={`flex h-8 w-full items-center gap-2 rounded-[8px] bg-ink px-2 text-[12.5px] font-medium text-page transition-opacity duration-150 hover:opacity-90 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon size={15}>
            <path d="M12 5v14M5 12h14" />
          </Icon>
          {!collapsed && "Nova conversa"}
        </button>
      </div>

      {!collapsed && conversations.length > 3 && (
        <div className="px-2 pt-2">
          <div className="flex h-8 items-center gap-1.5 rounded-[8px] bg-inset px-2">
            <Icon size={13}>
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </Icon>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversas…"
              className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-3"
            />
          </div>
        </div>
      )}

      <div className="mt-2 flex-1 overflow-y-auto px-2">
        {!collapsed && filtered.length > 0 && (
          <p className="px-1.5 py-1 text-[11px] font-medium text-ink-3">Conversas</p>
        )}
        {!collapsed && conversations.length > 0 && filtered.length === 0 && (
          <p className="px-1.5 py-1 text-[12px] text-ink-3">Nenhuma conversa encontrada.</p>
        )}
        <div className="flex flex-col gap-0.5">
          {filtered.map((c) => (
            <div key={c.id} className="group/row relative">
              {renamingId === c.id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="h-8 w-full rounded-[8px] border border-line bg-surface px-2 text-[12.5px] text-ink outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  onDoubleClick={() => !collapsed && startRename(c)}
                  title={c.title}
                  className={`flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-left text-[12.5px] transition-colors duration-150 ${
                    c.id === activeId ? "bg-hover-2 text-ink" : "text-ink-2 hover:bg-hover"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon size={14}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </Icon>
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{c.title}</span>}
                </button>
              )}

              {!collapsed && renamingId !== c.id && (
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover/row:pointer-events-auto group-hover/row:opacity-100">
                  <button
                    type="button"
                    aria-label="Renomear conversa"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(c);
                    }}
                    className="flex size-6 items-center justify-center rounded-[6px] bg-canvas text-ink-3 hover:bg-hover hover:text-ink"
                  >
                    <Icon size={12}>
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </Icon>
                  </button>
                  <button
                    type="button"
                    aria-label="Apagar conversa"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c);
                    }}
                    className="flex size-6 items-center justify-center rounded-[6px] bg-canvas text-ink-3 hover:bg-red-tint hover:text-red"
                  >
                    <Icon size={12}>
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z" />
                    </Icon>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={onToggleDark}
          className={`flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-[12.5px] text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {dark ? (
            <Icon size={15}>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </Icon>
          ) : (
            <Icon size={15}>
              <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
            </Icon>
          )}
          {!collapsed && (dark ? "Modo claro" : "Modo escuro")}
        </button>
      </div>
    </aside>
  );
}