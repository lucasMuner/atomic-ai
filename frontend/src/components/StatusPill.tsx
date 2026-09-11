/**
 * Versão simplificada do StatusPill do beautiful-ui (atoms/StatusPill.tsx),
 * sem depender de class-variance-authority nem do helper `cn` — o projeto
 * não tem essas libs instaladas, então isso fica só com Tailwind + CSS vars
 * que já existem no index.css.
 */

type Tone = "green" | "orange" | "red" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-tint text-green",
  orange: "bg-orange-tint text-orange",
  red: "bg-red-tint text-red",
  neutral: "bg-inset text-ink-2",
};

const DOT_CLASSES: Record<Tone, string> = {
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
  neutral: "bg-ink-3",
};

export default function StatusPill({
  tone = "neutral",
  children,
  pulse = false,
}: {
  tone?: Tone;
  children: React.ReactNode;
  /** anima a bolinha (útil pro estado "verificando…") */
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium leading-none ${TONE_CLASSES[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${DOT_CLASSES[tone]} ${pulse ? "animate-pulse" : ""}`} />
      {children}
    </span>
  );
}