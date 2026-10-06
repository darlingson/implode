import type { LogLine } from "@/mocks/deployments";
import { useEffect, useRef } from "react";
import { PText } from "@porsche-design-system/components-react";

export function LogPanel({ lines, minHeight }: { lines: LogLine[]; minHeight?: string }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines.length]);

  return (
    <div
      className="implode-log-panel p-fluid-sm shadow-md"
      style={{ minHeight: minHeight ?? "22rem" }}
      role="log"
      aria-label="Deployment logs"
    >
      <div className="flex max-h-[26rem] flex-col gap-static-xs overflow-y-auto">
        {lines.length === 0 ? (
          <PText color="inherit" size="x-small">
            <span style={{ color: "var(--implode-log-dim)" }}>
              Waiting for output…
            </span>
          </PText>
        ) : (
          lines.map((l) => (
            <div key={l.id} className="text-[0.8rem] leading-relaxed">
              <span style={{ color: "var(--implode-log-dim)" }}>[{l.at}]</span>{" "}
              <span
                style={{
                  color:
                    l.stream === "build"
                      ? "var(--implode-log-text)"
                      : l.stream === "runtime"
                        ? "#9be29b"
                        : "var(--implode-log-dim)",
                }}
              >
                {l.text}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
