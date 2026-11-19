import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { Notification } from "baseui/notification";
import { Tag } from "baseui/tag";
import {
  DisplayXSmall, LabelMedium, LabelXSmall,
} from "baseui/typography";
import { useState } from "react";
import type { DeployedApp, Deployment } from "@/mocks/deployments";
import { healthTagKind, statusTagKind } from "@/tokens/implode";
import { LogPanel } from "./LogPanel";

export function AppsMonitor({
  apps, deployments, onAction, onCopyUrl,
}: {
  apps: DeployedApp[];
  deployments: Deployment[];
  onAction: (appId: string, action: "stop" | "restart" | "redeploy") => void;
  onCopyUrl: (url: string) => void;
}) {
  const [css, theme] = useStyletron();
  const [selectedId, setSelectedId] = useState<string | null>(apps[0]?.id ?? null);
  const selected = apps.find((a) => a.id === selectedId) ?? null;
  const selectedDeployment = deployments.find((d) => d.id === selected?.deploymentId) ?? null;

  return (
    <section className={css({ display: "grid", gap: theme.sizing.scale600 })}>

      {/* Header */}
      <div>
        <DisplayXSmall overrides={{ Block: { style: { margin: 0, letterSpacing: "-0.02em" } } }}>
          Applications
        </DisplayXSmall>
        <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary, marginTop: theme.sizing.scale100 } } }}>
          {apps.length === 0
            ? "Nothing running yet — deploy to populate this list."
            : `${apps.length} container${apps.length === 1 ? "" : "s"} · health probed on the host port (stubbed).`}
        </LabelXSmall>
      </div>

      {apps.length === 0 ? (
        <Notification kind="info"
          overrides={{ Body: { style: { width: "100%", fontFamily: "inherit" } } }}
        >
          Health badges, app URLs, and lifecycle controls appear here after the first successful pipeline.
        </Notification>
      ) : (
        <div className={css({
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.borderOpaque}`,
          borderRadius: theme.borders.radius400,
          overflow: "auto",
        })}>
          <table className={css({
            width: "100%", borderCollapse: "collapse",
            fontFamily: "inherit", fontSize: "14px",
          })}>
            <thead>
              <tr className={css({ borderBottom: `2px solid ${theme.colors.borderOpaque}` })}>
                {["Application","Status","Health","Port","Link"].map((h) => (
                  <th key={h} className={css({
                    textAlign: "left", padding: `${theme.sizing.scale400} ${theme.sizing.scale500}`,
                    fontWeight: "600", color: theme.colors.contentPrimary, whiteSpace: "nowrap",
                  })}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((app, i) => (
                <tr key={app.id} className={css({
                  borderBottom: i < apps.length - 1 ? `1px solid ${theme.colors.borderOpaque}` : "none",
                  ":hover": { backgroundColor: theme.colors.backgroundTertiary },
                })}>
                  <td className={css({ padding: `${theme.sizing.scale400} ${theme.sizing.scale500}` })}>
                    <button
                      onClick={() => setSelectedId(app.id)}
                      className={css({
                        background: "none", border: "none", padding: 0,
                        cursor: "pointer", fontFamily: "inherit",
                        fontWeight: "600", fontSize: "14px",
                        color: theme.colors.accent,
                        textDecoration: "underline", textUnderlineOffset: "3px",
                      })}
                    >
                      {app.name}
                    </button>
                    <div className={css({ fontSize: "11px", color: theme.colors.contentTertiary, marginTop: "2px" })}>
                      {app.imageTag}
                    </div>
                  </td>
                  <td className={css({ padding: `${theme.sizing.scale400} ${theme.sizing.scale500}` })}>
                    <Tag kind={statusTagKind[app.status]} closeable={false}>{app.status}</Tag>
                  </td>
                  <td className={css({ padding: `${theme.sizing.scale400} ${theme.sizing.scale500}` })}>
                    <Tag kind={healthTagKind[app.health]} closeable={false}>{app.health}</Tag>
                  </td>
                  <td className={css({
                    padding: `${theme.sizing.scale400} ${theme.sizing.scale500}`,
                    fontFamily: "ui-monospace, monospace", fontSize: "13px",
                  })}>
                    :{app.hostPort}
                  </td>
                  <td className={css({ padding: `${theme.sizing.scale400} ${theme.sizing.scale500}` })}>
                    <Button size="mini" kind="tertiary" onClick={() => onCopyUrl(app.appUrl)}>
                      Open URL
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected app detail */}
      {selected && selectedDeployment && (
        <div className={css({
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.borderOpaque}`,
          borderRadius: theme.borders.radius400,
          padding: theme.sizing.scale700,
          display: "grid",
          gap: theme.sizing.scale500,
        })}>
          {/* App name + controls */}
          <div className={css({
            display: "flex", flexWrap: "wrap",
            alignItems: "center", justifyContent: "space-between",
            gap: theme.sizing.scale400,
          })}>
            <LabelMedium overrides={{ Block: { style: { fontWeight: "700", margin: 0 } } }}>
              {selected.name}
            </LabelMedium>
            <div className={css({ display: "flex", gap: theme.sizing.scale300 })}>
              <Button size="compact" kind="secondary" onClick={() => onAction(selected.id, "stop")}>Stop</Button>
              <Button size="compact" kind="secondary" onClick={() => onAction(selected.id, "restart")}>Restart</Button>
              <Button size="compact" onClick={() => onAction(selected.id, "redeploy")}>Redeploy</Button>
            </div>
          </div>

          <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary } } }}>
            {selected.appUrl} · {selected.imageTag} · updated {selected.updatedAt}
          </LabelXSmall>

          {/* Divider */}
          <div className={css({ borderTop: `1px solid ${theme.colors.borderOpaque}`, paddingTop: theme.sizing.scale400 })}>
            <LabelMedium overrides={{ Block: { style: { fontWeight: "600", marginBottom: theme.sizing.scale300 } } }}>
              Runtime logs
            </LabelMedium>
            <LogPanel lines={selectedDeployment.logs.slice(-12)} minHeight="12rem" />
          </div>

          <div className={css({ display: "flex", gap: theme.sizing.scale300 })}>
            <Button size="compact" kind="secondary" onClick={() => onCopyUrl(selected.appUrl)}>
              Copy URL
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
