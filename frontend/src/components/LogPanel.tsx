import type { LogLine } from "@/mocks/deployments";
import { useEffect, useRef } from "react";

export function LogPanel({ lines, minHeight }: { lines: LogLine[]; minHeight?: string }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines.length]);

  return (
    <div
      className="implode-log-panel"
      style={{ minHeight: minHeight ?? "22rem", padding: "16px" }}
      role="log"
      aria-label="Deployment logs"
    >
      <div className="implode-log-panel-inner" style={{ maxHeight: "26rem" }}>
        {lines.length === 0 ? (
          <span className="implode-log-dim">Waiting for output…</span>
        ) : (
          lines.map((l) => (
            <div key={l.id}>
              <span className="implode-log-dim">[{l.at}]</span>{" "}
              <span className={
                l.stream === "runtime" ? "implode-log-runtime"
                : l.stream === "build" ? "implode-log-build"
                : "implode-log-system"
              }>
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
