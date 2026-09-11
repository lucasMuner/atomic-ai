import { useState, type ReactNode } from "react";

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

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  dark,
  onToggleDark,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

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
        {!collapsed && <span className="truncate px-1 text-[13px] font-medium text-ink">Meu Chat</span>}
      </div>

      <div className="px-2">
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

      <div className="mt-2 flex-1 overflow-y-auto px-2">
        {!collapsed && conversations.length > 0 && (
          <p className="px-1.5 py-1 text-[11px] font-medium text-ink-3">Conversas</p>
        )}
        <div className="flex flex-col gap-0.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
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