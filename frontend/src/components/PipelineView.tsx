import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { Notification } from "baseui/notification";
import { ProgressSteps, Step } from "baseui/progress-steps";
import { Tag } from "baseui/tag";
import { DisplayXSmall, LabelXSmall } from "baseui/typography";
import { useEffect, useRef, useState } from "react";
import {
  makeLog, stubPipelineScript,
  type Deployment, type LogLine,
} from "@/mocks/deployments";
import { pipelineStages, pipelineStageLabel, statusTagKind } from "@/tokens/implode";
import { LogPanel } from "./LogPanel";

export function PipelineView({
  deployment, onDone, onCopyUrl,
}: {
  deployment: Deployment;
  onDone: (d: Deployment) => void;
  onCopyUrl: (url: string) => void;
}) {
  const [css, theme] = useStyletron();
  const [stageIdx, setStageIdx] = useState(0);
  const [lines, setLines] = useState<LogLine[]>(() => deployment.logs);
  const doneRef = useRef(false);

  useEffect(() => {
    if (stageIdx >= stubPipelineScript.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone({
          ...deployment, status: "succeeded", failingStage: null,
          containerId: `ctr_stub_${deployment.id.slice(-6)}`,
          hostPort: deployment.hostPort ?? 5281,
          appUrl: deployment.appUrl ?? `http://localhost:${deployment.hostPort ?? 5281}`,
          health: "healthy", sdkVersion: deployment.sdkVersion ?? "net9.0", logs: lines,
        });
      }
      return;
    }
    const script = stubPipelineScript[stageIdx];
    const timers: ReturnType<typeof setTimeout>[] = [];
    script.lines.forEach((text, i) => {
      timers.push(setTimeout(() => {
        const stream = stageIdx >= 3 ? "runtime" : i === 0 ? "system" : "build";
        setLines((prev) => [...prev, makeLog(stream, text)]);
      }, 350 * (i + 1)));
    });
    timers.push(setTimeout(() => setStageIdx((s) => s + 1), 350 * (script.lines.length + 1)));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIdx, deployment.id]);

  const finished = stageIdx >= stubPipelineScript.length;
  const currentStage = finished ? null : pipelineStages[stageIdx];

  return (
    <section className={css({ display: "grid", gap: theme.sizing.scale600 })}>

      {/* Header row */}
      <div className={css({
        display: "flex", flexWrap: "wrap",
        alignItems: "flex-start", justifyContent: "space-between",
        gap: theme.sizing.scale400,
      })}>
        <div>
          <DisplayXSmall overrides={{ Block: { style: { margin: 0, letterSpacing: "-0.02em" } } }}>
            Deployment pipeline
          </DisplayXSmall>
          <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary, marginTop: theme.sizing.scale100 } } }}>
            {deployment.repoSlug} · {deployment.branch} · {deployment.imageTag}
          </LabelXSmall>
        </div>
        <Tag
          kind={finished ? statusTagKind.succeeded : "accent"}
          closeable={false}
        >
          {finished ? "succeeded" : (currentStage ?? "pending")}
        </Tag>
      </div>

      {/* Progress steps */}
      <div className={css({
        backgroundColor: theme.colors.backgroundSecondary,
        border: `1px solid ${theme.colors.borderOpaque}`,
        borderRadius: theme.borders.radius400,
        padding: `${theme.sizing.scale600} ${theme.sizing.scale700}`,
      })}>
        <ProgressSteps current={finished ? pipelineStages.length : stageIdx}>
          {pipelineStages.map((stage) => (
            <Step key={stage} title={pipelineStageLabel[stage]} />
          ))}
        </ProgressSteps>
      </div>

      {/* Log output */}
      <LogPanel lines={lines} />

      {/* Success banner */}
      {finished && (
        <Notification kind="positive"
          overrides={{ Body: { style: { width: "100%", fontFamily: "inherit" } } }}
        >
          Application running. This panel will stream <code>GET /deployments/:id/logs</code> once the backend connects.
        </Notification>
      )}

      {/* Actions */}
      <div className={css({ display: "flex", flexWrap: "wrap", alignItems: "center", gap: theme.sizing.scale400 })}>
        <Button
          kind="secondary"
          disabled={!deployment.appUrl && !finished}
          onClick={() => onCopyUrl(deployment.appUrl ?? "http://localhost:5281")}
        >
          Copy app URL
        </Button>
        <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary } } }}>
          Failing stage and tail logs will appear here once real builds run.
        </LabelXSmall>
      </div>
    </section>
  );
}
