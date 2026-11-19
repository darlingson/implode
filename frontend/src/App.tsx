import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { Notification } from "baseui/notification";
import { Tab, Tabs } from "baseui/tabs-motion";
import { Tag } from "baseui/tag";
import {
  DisplaySmall,
  LabelMedium,
  LabelXSmall,
  ParagraphSmall,
} from "baseui/typography";
import { useMemo, useState } from "react";
import { AppsMonitor } from "@/components/AppsMonitor";
import { DeployForm } from "@/components/DeployForm";
import { LogPanel } from "@/components/LogPanel";
import { PipelineView } from "@/components/PipelineView";
import {
  makeLog,
  repoSlugFromUrl,
  seedFailedDeployment,
  type DeployedApp,
  type DeployRequest,
  type Deployment,
} from "@/mocks/deployments";
import { healthTagKind, statusTagKind } from "@/tokens/implode";

type View = "deploy" | "pipeline" | "apps";
const VIEWS: View[] = ["deploy", "pipeline", "apps"];

let idSeq = 100;

export function App() {
  const [css, theme] = useStyletron();
  const [activeKey, setActiveKey] = useState<string>("deploy");
  const view = activeKey as View;

  const [busy, setBusy] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>(() => [
    seedFailedDeployment(),
  ]);
  const [apps, setApps] = useState<DeployedApp[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const active = useMemo(
    () => deployments.find((d) => d.id === activeId) ?? null,
    [deployments, activeId],
  );

  const copyUrl = async (url: string) => {
    try { await navigator.clipboard.writeText(url); } catch { /* ok */ }
    setNotice(`Copied: ${url}`);
  };

  const startDeploy = (req: DeployRequest) => {
    idSeq += 1;
    const slug = repoSlugFromUrl(req.repoUrl);
    const id = `dpl_stub_${idSeq}`;
    const port = 5200 + (idSeq % 90);
    const dep: Deployment = {
      id, repoUrl: req.repoUrl, repoSlug: slug,
      subfolder: req.subfolder || "—", branch: req.branch,
      status: "building", failingStage: null,
      imageTag: `implode/${slug}:stub${idSeq}`,
      containerId: null, hostPort: port,
      appUrl: `http://localhost:${port}`,
      health: "unknown", sdkVersion: null, createdAt: "just now",
      logs: [
        makeLog("system", `▸ deploy requested: ${req.repoUrl}`),
        makeLog("system", `▸ subfolder=${req.subfolder || "(root)"} branch=${req.branch} env=${req.envVars.length}`),
      ],
    };
    setDeployments((prev) => [dep, ...prev]);
    setActiveId(id);
    setBusy(true);
    setActiveKey("pipeline");
    window.setTimeout(() => setBusy(false), 600);
  };

  const finishDeploy = (done: Deployment) => {
    setDeployments((prev) => prev.map((d) => (d.id === done.id ? done : d)));
    setApps((prev) => {
      if (prev.some((a) => a.deploymentId === done.id)) return prev;
      return [{
        id: `app_${done.id}`, name: done.repoSlug,
        deploymentId: done.id, status: "succeeded", health: "healthy",
        hostPort: done.hostPort ?? 5281,
        appUrl: done.appUrl ?? "http://localhost:5281",
        imageTag: done.imageTag, updatedAt: "just now",
      }, ...prev];
    });
  };

  const appAction = (appId: string, action: "stop" | "restart" | "redeploy") => {
    setApps((prev) => prev.map((a) => a.id === appId ? {
      ...a,
      status: action === "stop" ? "stopped" : action === "restart" ? "running" : "building",
      health: action === "stop" ? "unknown" : "healthy",
      updatedAt: "just now",
    } : a));
    setNotice(
      action === "stop" ? "Container stop requested."
      : action === "restart" ? "Container restart requested."
      : "Redeploy queued: pull → rebuild → replace.",
    );
  };

  /* ── shared style snippets pulled from the theme ── */
  const card = css({
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borders.radius400,
    border: `1px solid ${theme.colors.borderOpaque}`,
    padding: theme.sizing.scale700,
    display: "grid",
    gap: theme.sizing.scale500,
  });

  return (
    <div className={css({
      minHeight: "100vh",
      backgroundColor: theme.colors.backgroundPrimary,
      color: theme.colors.contentPrimary,
    })}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className={css({
        borderBottom: `1px solid ${theme.colors.borderOpaque}`,
        backgroundColor: theme.colors.backgroundPrimary,
      })}>
        <div className={css({
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.sizing.scale400,
          padding: `${theme.sizing.scale600} ${theme.sizing.scale800}`,
        })}>
          {/* Wordmark */}
          <div className={css({ display: "flex", alignItems: "center", gap: theme.sizing.scale500 })}>
            <div className={css({
              width: "32px", height: "32px",
              backgroundColor: theme.colors.contentPrimary,
              borderRadius: theme.borders.radius300,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: "0",
            })}>
              <span className={css({
                color: theme.colors.backgroundPrimary,
                fontWeight: "700", fontSize: "17px", lineHeight: "1",
              })}>I</span>
            </div>
            <div>
              <LabelMedium overrides={{ Block: { style: { fontWeight: "700", letterSpacing: "-0.01em", margin: 0 } } }}>
                Implode
              </LabelMedium>
              <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary, margin: 0 } } }}>
                Self-hosted .NET deployments
              </LabelXSmall>
            </div>
            <Tag kind="neutral" closeable={false}
              overrides={{ Root: { style: { backgroundColor: theme.colors.backgroundTertiary } } }}
            >
              stub
            </Tag>
          </div>

          {/* Backend link */}
          <a href="http://localhost:8080/healthz" className={css({
            fontSize: "13px", color: theme.colors.accent,
            textDecoration: "none", fontWeight: "500",
            ":hover": { textDecoration: "underline" },
          })}>
            /healthz
          </a>
        </div>
      </header>

      {/* ── Notice banner ───────────────────────────────────────── */}
      {notice && (
        <div className={css({ maxWidth: "1200px", margin: "0 auto", padding: `${theme.sizing.scale400} ${theme.sizing.scale800} 0` })}>
          <Notification
            kind="positive" closeable
            onClose={() => setNotice(null)}
            overrides={{ Body: { style: { width: "100%", fontFamily: "inherit" } } }}
          >
            {notice}
          </Notification>
        </div>
      )}

      {/* ── Nav tabs ────────────────────────────────────────────── */}
      <div className={css({
        maxWidth: "1200px", margin: "0 auto",
        padding: `0 ${theme.sizing.scale800}`,
        borderBottom: `1px solid ${theme.colors.borderOpaque}`,
      })}>
        <Tabs
          activeKey={activeKey}
          onChange={({ activeKey: k }) => setActiveKey(String(k))}
          activateOnFocus
          overrides={{
            TabList: { style: { gap: theme.sizing.scale600 } },
          }}
        >
          {VIEWS.map((v) => (
            <Tab key={v} title={
              v === "pipeline" ? `Pipeline${active ? ` · ${active.repoSlug}` : ""}`
              : v === "apps" ? `Applications (${apps.length})`
              : "New deployment"
            } />
          ))}
        </Tabs>
      </div>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className={css({
        maxWidth: "1200px", margin: "0 auto",
        display: "grid", gap: theme.sizing.scale700,
        padding: `${theme.sizing.scale700} ${theme.sizing.scale800}`,
      })}>

        {/* Deploy view */}
        {view === "deploy" && (
          <>
            {deployments.length === 0 && (
              <div className={css({
                ...JSON.parse(JSON.stringify({
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderRadius: theme.borders.radius400,
                  border: `1px solid ${theme.colors.borderOpaque}`,
                  padding: `${theme.sizing.scale1200} ${theme.sizing.scale800}`,
                  textAlign: "center",
                  display: "grid",
                  gap: theme.sizing.scale400,
                }))
              })}>
                <DisplaySmall>No repositories yet</DisplaySmall>
                <ParagraphSmall color={theme.colors.contentSecondary}>
                  Paste a .NET Git URL below and Implode takes it from clone to running container.
                </ParagraphSmall>
              </div>
            )}

            <DeployForm busy={busy} onDeploy={startDeploy} />

            {/* History */}
            <section>
              <LabelMedium overrides={{ Block: { style: { fontWeight: "700", marginBottom: theme.sizing.scale400 } } }}>
                Deployment history
              </LabelMedium>
              <div className={css({ display: "grid", gap: theme.sizing.scale400 })}>
                {deployments.map((d) => (
                  <article key={d.id} className={card}>
                    <div className={css({
                      display: "flex", flexWrap: "wrap",
                      alignItems: "flex-start", justifyContent: "space-between",
                      gap: theme.sizing.scale400,
                    })}>
                      <div>
                        <LabelMedium overrides={{ Block: { style: { fontWeight: "600", margin: 0 } } }}>
                          {d.repoSlug}
                        </LabelMedium>
                        <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary, margin: `${theme.sizing.scale100} 0 0` } } }}>
                          {d.branch} · {d.createdAt} · {d.imageTag}
                        </LabelXSmall>
                      </div>
                      <div className={css({ display: "flex", gap: theme.sizing.scale200, flexWrap: "wrap" })}>
                        <Tag kind={statusTagKind[d.status]} closeable={false}>{d.status}</Tag>
                        <Tag kind={healthTagKind[d.health]} closeable={false}>{d.health}</Tag>
                      </div>
                    </div>

                    {d.status === "failed" && (
                      <Notification kind="negative"
                        overrides={{ Body: { style: { width: "100%", fontFamily: "inherit" } } }}
                      >
                        Failed in <strong>{d.failingStage ?? "pipeline"}</strong> — last {d.logs.length} log lines retained.
                      </Notification>
                    )}

                    <LogPanel lines={d.logs.slice(-4)} minHeight="6rem" />

                    <div className={css({ display: "flex", gap: theme.sizing.scale300, flexWrap: "wrap" })}>
                      <Button size="compact" kind="secondary"
                        onClick={() => { setActiveId(d.id); setActiveKey("pipeline"); }}
                      >
                        Open pipeline
                      </Button>
                      <Button size="compact" kind="secondary"
                        onClick={() => setActiveKey("apps")}
                      >
                        View applications
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Pipeline view */}
        {view === "pipeline" && (
          active ? (
            <PipelineView key={active.id} deployment={active} onDone={finishDeploy} onCopyUrl={copyUrl} />
          ) : (
            <div className={css({
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.borders.radius400,
              border: `1px solid ${theme.colors.borderOpaque}`,
              padding: `${theme.sizing.scale1200} ${theme.sizing.scale800}`,
              textAlign: "center",
              display: "grid",
              gap: theme.sizing.scale400,
            })}>
              <DisplaySmall>No active deployment</DisplaySmall>
              <ParagraphSmall color={theme.colors.contentSecondary}>
                Start from the deploy form — the live pipeline appears here.
              </ParagraphSmall>
              <div className={css({ display: "flex", justifyContent: "center", marginTop: theme.sizing.scale300 })}>
                <Button onClick={() => setActiveKey("deploy")}>New deployment</Button>
              </div>
            </div>
          )
        )}

        {/* Apps view */}
        {view === "apps" && (
          <AppsMonitor apps={apps} deployments={deployments} onAction={appAction} onCopyUrl={copyUrl} />
        )}
      </main>
    </div>
  );
}

export default App;
