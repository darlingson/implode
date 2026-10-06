import {
  PButton,
  PHeading,
  PInlineNotification,
  PStepperHorizontal,
  PStepperHorizontalItem,
  PTag,
  PText,
} from "@porsche-design-system/components-react";
import { useEffect, useRef, useState } from "react";
import {
  makeLog,
  stubPipelineScript,
  type Deployment,
  type LogLine,
} from "@/mocks/deployments";
import {
  pipelineStages,
  pipelineStageLabel,
  statusTagVariant,
} from "@/tokens/implode";
import { LogPanel } from "./LogPanel";

export function PipelineView({
  deployment,
  onDone,
  onCopyUrl,
}: {
  deployment: Deployment;
  onDone: (d: Deployment) => void;
  onCopyUrl: (url: string) => void;
}) {
  const [stageIdx, setStageIdx] = useState(0);
  const [lines, setLines] = useState<LogLine[]>(() => deployment.logs);
  const doneRef = useRef(false);

  useEffect(() => {
    if (stageIdx >= stubPipelineScript.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone({
          ...deployment,
          status: "succeeded",
          failingStage: null,
          containerId: `ctr_stub_${deployment.id.slice(-6)}`,
          hostPort: deployment.hostPort ?? 5281,
          appUrl: deployment.appUrl ?? `http://localhost:${deployment.hostPort ?? 5281}`,
          health: "healthy",
          sdkVersion: deployment.sdkVersion ?? "net9.0",
          logs: lines,
        });
      }
      return;
    }
    const script = stubPipelineScript[stageIdx];
    const timers: ReturnType<typeof setTimeout>[] = [];
    script.lines.forEach((text, i) => {
      timers.push(
        setTimeout(
          () => {
            const stream = stageIdx >= 3 ? "runtime" : i === 0 ? "system" : "build";
            setLines((prev) => [...prev, makeLog(stream, text)]);
          },
          350 * (i + 1),
        ),
      );
    });
    timers.push(setTimeout(() => setStageIdx((s) => s + 1), 350 * (script.lines.length + 1)));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIdx, deployment.id]);

  const finished = stageIdx >= stubPipelineScript.length;
  const currentStage = finished ? null : pipelineStages[stageIdx];

  return (
    <section className="grid gap-fluid-sm">
      <div className="flex flex-wrap items-center justify-between gap-static-sm">
        <div>
          <PHeading size="large" tag="h2">
            Deployment pipeline
          </PHeading>
          <PText color="contrast-medium">
            {deployment.repoSlug} · {deployment.branch} · {deployment.imageTag}
          </PText>
        </div>
        <PTag variant={finished ? statusTagVariant.succeeded : "info"}>
          {finished ? "succeeded" : (currentStage ?? "pending")}
        </PTag>
      </div>

      <div className="rounded-3xl bg-surface p-fluid-sm">
        <PStepperHorizontal>
          {pipelineStages.map((stage, i) => (
            <PStepperHorizontalItem
              key={stage}
              state={
                finished || i < stageIdx
                  ? "complete"
                  : i === stageIdx
                    ? "current"
                    : undefined
              }
            >
              {pipelineStageLabel[stage]}
            </PStepperHorizontalItem>
          ))}
        </PStepperHorizontal>
      </div>

      <LogPanel lines={lines} />

      {finished ? (
        <PInlineNotification heading="Application running" state="success">
          Stubbed container is healthy. This panel mirrors the future
          `GET /deployments/:id/logs` stream.
        </PInlineNotification>
      ) : null}

      <div className="flex flex-wrap gap-static-sm">
        <PButton
          variant="secondary"
          disabled={!deployment.appUrl && !finished}
          onClick={() =>
            onCopyUrl(deployment.appUrl ?? "http://localhost:5281")
          }
          icon="copy"
        >
          Copy app URL
        </PButton>
        <PText color="contrast-medium" size="x-small">
          Failing stage and tail logs will surface here once real builds run.
        </PText>
      </div>
    </section>
  );
}
