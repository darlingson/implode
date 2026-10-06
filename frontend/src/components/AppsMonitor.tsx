import {
  PButton,
  PButtonPure,
  PDivider,
  PHeading,
  PInlineNotification,
  PTable,
  PTableBody,
  PTableCell,
  PTableHead,
  PTableHeadCell,
  PTableHeadRow,
  PTableRow,
  PTag,
  PText,
} from "@porsche-design-system/components-react";
import { useState } from "react";
import type { DeployedApp, Deployment } from "@/mocks/deployments";
import { healthTagVariant, statusTagVariant } from "@/tokens/implode";
import { LogPanel } from "./LogPanel";

export function AppsMonitor({
  apps,
  deployments,
  onAction,
  onCopyUrl,
}: {
  apps: DeployedApp[];
  deployments: Deployment[];
  onAction: (appId: string, action: "stop" | "restart" | "redeploy") => void;
  onCopyUrl: (url: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(apps[0]?.id ?? null);
  const selected = apps.find((a) => a.id === selectedId) ?? null;
  const selectedDeployment =
    deployments.find((d) => d.id === selected?.deploymentId) ?? null;

  return (
    <section className="grid gap-fluid-sm">
      <div className="flex flex-wrap items-end justify-between gap-static-sm">
        <div>
          <PHeading size="large" tag="h2">
            Applications
          </PHeading>
          <PText color="contrast-medium">
            {apps.length === 0
              ? "Nothing running yet — deploy to populate this list."
              : `${apps.length} container${apps.length === 1 ? "" : "s"} · health probed on the host port (stubbed).`}
          </PText>
        </div>
      </div>

      {apps.length === 0 ? (
        <PInlineNotification heading="No applications yet" state="info">
          The monitor list, health badges, and app URLs appear here after the
          first successful pipeline.
        </PInlineNotification>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-surface p-fluid-sm">
          <PTable caption="Deployed applications">
            <PTableHead>
              <PTableHeadRow>
                <PTableHeadCell>Application</PTableHeadCell>
                <PTableHeadCell>Status</PTableHeadCell>
                <PTableHeadCell>Health</PTableHeadCell>
                <PTableHeadCell>Port</PTableHeadCell>
                <PTableHeadCell>Action</PTableHeadCell>
              </PTableHeadRow>
            </PTableHead>
            <PTableBody>
              {apps.map((app) => (
                <PTableRow key={app.id}>
                  <PTableCell>
                    <button
                      className="text-left underline-offset-4 hover:underline"
                      onClick={() => setSelectedId(app.id)}
                    >
                      {app.name}
                    </button>
                    <div className="text-xs opacity-70">{app.imageTag}</div>
                  </PTableCell>
                  <PTableCell>
                    <PTag variant={statusTagVariant[app.status]}>{app.status}</PTag>
                  </PTableCell>
                  <PTableCell>
                    <PTag variant={healthTagVariant[app.health]}>{app.health}</PTag>
                  </PTableCell>
                  <PTableCell>:{app.hostPort}</PTableCell>
                  <PTableCell>
                    <PButtonPure
                      icon="arrow-right"
                      onClick={() => onCopyUrl(app.appUrl)}
                    >
                      Open URL
                    </PButtonPure>
                  </PTableCell>
                </PTableRow>
              ))}
            </PTableBody>
          </PTable>
        </div>
      )}

      {selected && selectedDeployment ? (
        <div className="grid gap-fluid-sm rounded-3xl bg-surface p-fluid-md">
          <div className="flex flex-wrap items-center justify-between gap-static-sm">
            <PHeading size="medium" tag="h3">
              {selected.name}
            </PHeading>
            <div className="flex gap-static-sm">
              <PButton
                variant="secondary"
                compact
                onClick={() => onAction(selected.id, "stop")}
              >
                Stop
              </PButton>
              <PButton
                variant="secondary"
                compact
                onClick={() => onAction(selected.id, "restart")}
              >
                Restart
              </PButton>
              <PButton compact onClick={() => onAction(selected.id, "redeploy")}>
                Redeploy
              </PButton>
            </div>
          </div>

          <PText color="contrast-medium">
            {selected.appUrl} · {selected.imageTag} · updated{" "}
            {selected.updatedAt}
          </PText>

          <PDivider />

          <PHeading size="small" tag="h4">
            Runtime logs
          </PHeading>
          <LogPanel lines={selectedDeployment.logs.slice(-12)} minHeight="12rem" />

          <div className="flex flex-wrap gap-static-sm">
            <PButton
              variant="secondary"
              compact
              icon="copy"
              onClick={() => onCopyUrl(selected.appUrl)}
            >
              Copy URL
            </PButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}
