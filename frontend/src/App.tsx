import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { Drawer, ANCHOR } from "baseui/drawer";
import { Notification } from "baseui/notification";
import { Tag } from "baseui/tag";
import {
  DisplaySmall,
  DisplayXSmall,
  LabelMedium,
  LabelSmall,
  LabelXSmall,
  ParagraphSmall,
} from "baseui/typography";
import { useMemo, useState } from "react";
import { AppsMonitor } from "@/components/AppsMonitor";
import { DeployForm } from "@/components/DeployForm";
import { PipelineView } from "@/components/PipelineView";
import {
  makeLog,
  repoSlugFromUrl,
  seedFailedDeployment,
  type DeployedApp,
  type DeployRequest,
  type Deployment,
} from "@/mocks/deployments";
import { statusTagKind } from "@/tokens/implode";

type Page = "deployments" | "applications";

let idSeq = 100;

export function App() {
  const [css, theme] = useStyletron();

  // Top-level page (the two persistent nav destinations)
  const [page, setPage] = useState<Page>("deployments");

  // Which deployment is open in the detail view (null = list)
  const [detailId, setDetailId] = useState<string | null>(null);

  // Deploy drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Data
  const [deployments, setDeployments] = useState<Deployment[]>(() => [
    seedFailedDeployment(),
  ]);
  const [apps, setApps] = useState<DeployedApp[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const detail = useMemo(
    () => deployments.find((d) => d.id === detailId) ?? null,
    [deployments, detailId],
  );

  // ── helpers ──────────────────────────────────────────────────────

  const copyUrl = async (url: string) => {
    try { await navigator.clipboard.writeText(url); } catch { /* ok */ }
    setNotice(`Copied: ${url}`);
  };

  const openDetail = (id: string) => {
    setDetailId(id);
    setPage("deployments"); // ensure we're on the right page
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
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setDrawerOpen(false);
      openDetail(id);
    }, 400);
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

  // ── shared style values ──────────────────────────────────────────

  const navLinkStyle = (active: boolean) => css({
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "inherit", fontSize: "14px", fontWeight: "500",
    padding: `${theme.sizing.scale300} 0`,
    color: active ? theme.colors.contentPrimary : theme.colors.contentSecondary,
    borderBottom: active ? `2px solid ${theme.colors.contentPrimary}` : "2px solid transparent",
    textDecoration: "none",
    transition: "color 0.15s, border-color 0.15s",
    ":hover": { color: theme.colors.contentPrimary },
  });

  const card = css({
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borders.radius400,
    border: `1px solid ${theme.colors.borderOpaque}`,
  });

  // ── render ───────────────────────────────────────────────────────

  return (
    <div className={css({
      minHeight: "100vh",
      backgroundColor: theme.colors.backgroundPrimary,
      color: theme.colors.contentPrimary,
    })}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className={css({
        borderBottom: `1px solid ${theme.colors.borderOpaque}`,
        backgroundColor: theme.colors.backgroundPrimary,
        position: "sticky", top: "0", zIndex: "100",
      })}>
        <div className={css({
          maxWidth: "1200px", margin: "0 auto",
          display: "flex", alignItems: "center",
          gap: theme.sizing.scale700,
          padding: `0 ${theme.sizing.scale800}`,
          height: "56px",
        })}>

          {/* Wordmark — always a link back to home */}
          <button
            onClick={() => { setPage("deployments"); setDetailId(null); }}
            className={css({
              display: "flex", alignItems: "center", gap: theme.sizing.scale400,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              flexShrink: "0",
            })}
          >
            <div className={css({
              width: "28px", height: "28px",
              backgroundColor: theme.colors.contentPrimary,
              borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
            })}>
              <span className={css({
                color: theme.colors.backgroundPrimary,
                fontWeight: "800", fontSize: "15px", lineHeight: "1",
              })}>I</span>
            </div>
            <LabelMedium overrides={{ Block: { style: { fontWeight: "700", letterSpacing: "-0.01em", margin: 0 } } }}>
              Implode
            </LabelMedium>
          </button>

          {/* Nav links */}
          <nav className={css({ display: "flex", alignItems: "stretch", gap: theme.sizing.scale700, flex: "1", height: "100%" })}>
            <button
              className={navLinkStyle(page === "deployments")}
              onClick={() => { setPage("deployments"); setDetailId(null); }}
            >
              Deployments
            </button>
            <button
              className={navLinkStyle(page === "applications")}
              onClick={() => setPage("applications")}
            >
              Applications
              {apps.length > 0 && (
                <span className={css({
                  marginLeft: theme.sizing.scale200,
                  backgroundColor: theme.colors.backgroundTertiary,
                  color: theme.colors.contentSecondary,
                  borderRadius: "10px",
                  padding: "1px 7px",
                  fontSize: "11px", fontWeight: "600",
                })}>
                  {apps.length}
                </span>
              )}
            </button>
          </nav>

          {/* Actions */}
          <div className={css({ display: "flex", alignItems: "center", gap: theme.sizing.scale400, marginLeft: "auto" })}>
            <a href="http://localhost:8080/healthz" className={css({
              fontSize: "12px", color: theme.colors.contentTertiary,
              textDecoration: "none", fontFamily: "ui-monospace, monospace",
              ":hover": { color: theme.colors.contentPrimary },
            })}>
              /healthz
            </a>
            <Button size="compact" onClick={() => setDrawerOpen(true)}>
              New deployment
            </Button>
          </div>
        </div>
      </header>

      {/* ── Global notice ───────────────────────────────────────── */}
      {notice && (
        <div className={css({ maxWidth: "1200px", margin: "0 auto", padding: `${theme.sizing.scale400} ${theme.sizing.scale800} 0` })}>
          <Notification kind="positive" closeable onClose={() => setNotice(null)}
            overrides={{ Body: { style: { width: "100%", fontFamily: "inherit" } } }}
          >
            {notice}
          </Notification>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────── */}
      <main className={css({
        maxWidth: "1200px", margin: "0 auto",
        padding: `${theme.sizing.scale800} ${theme.sizing.scale800}`,
      })}>

        {/* DEPLOYMENTS page */}
        {page === "deployments" && (
          detailId && detail ? (
            /* ── Detail view ── */
            <div className={css({ display: "grid", gap: theme.sizing.scale600 })}>
              {/* Back breadcrumb */}
              <div>
                <button
                  onClick={() => setDetailId(null)}
                  className={css({
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: theme.sizing.scale200,
                    color: theme.colors.contentTertiary, fontFamily: "inherit",
                    fontSize: "13px", padding: 0,
                    ":hover": { color: theme.colors.contentPrimary },
                  })}
                >
                  ← Deployments
                </button>
              </div>
              <PipelineView
                key={detail.id}
                deployment={detail}
                onDone={finishDeploy}
                onCopyUrl={copyUrl}
              />
            </div>
          ) : (
            /* ── Deployments list ── */
            <div className={css({ display: "grid", gap: theme.sizing.scale600 })}>
              {/* Page header */}
              <div className={css({
                display: "flex", alignItems: "center",
                justifyContent: "space-between", flexWrap: "wrap",
                gap: theme.sizing.scale400,
              })}>
                <DisplayXSmall overrides={{ Block: { style: { margin: 0, letterSpacing: "-0.02em" } } }}>
                  Deployments
                </DisplayXSmall>
              </div>

              {/* Empty state */}
              {deployments.length === 0 ? (
                <div className={css({
                  ...Object.fromEntries(Object.entries({
                    backgroundColor: theme.colors.backgroundSecondary,
                    border: `1px solid ${theme.colors.borderOpaque}`,
                    borderRadius: theme.borders.radius400,
                    padding: `${theme.sizing.scale1600} ${theme.sizing.scale800}`,
                    textAlign: "center",
                    display: "grid",
                    gap: theme.sizing.scale400,
                  }))
                })}>
                  <DisplaySmall>No deployments yet</DisplaySmall>
                  <ParagraphSmall color={theme.colors.contentSecondary}>
                    Click <strong>New deployment</strong> to deploy your first .NET repository.
                  </ParagraphSmall>
                </div>
              ) : (
                /* Deployment rows */
                <div className={card}>
                  {deployments.map((d, i) => (
                    <div
                      key={d.id}
                      className={css({
                        display: "flex", flexWrap: "wrap",
                        alignItems: "center", justifyContent: "space-between",
                        gap: theme.sizing.scale400,
                        padding: `${theme.sizing.scale500} ${theme.sizing.scale600}`,
                        borderBottom: i < deployments.length - 1
                          ? `1px solid ${theme.colors.borderOpaque}` : "none",
                        cursor: "pointer",
                        ":hover": { backgroundColor: theme.colors.backgroundTertiary },
                        transition: "background-color 0.1s",
                        borderRadius: i === 0 ? `${theme.borders.radius400} ${theme.borders.radius400} 0 0`
                          : i === deployments.length - 1 ? `0 0 ${theme.borders.radius400} ${theme.borders.radius400}`
                          : "0",
                      })}
                      onClick={() => openDetail(d.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && openDetail(d.id)}
                    >
                      {/* Left: identity */}
                      <div className={css({ display: "flex", alignItems: "center", gap: theme.sizing.scale500, minWidth: 0 })}>
                        {/* Status dot */}
                        <div className={css({
                          width: "8px", height: "8px", borderRadius: "50%", flexShrink: "0",
                          backgroundColor:
                            d.status === "succeeded" ? theme.colors.backgroundPositive
                            : d.status === "failed" ? theme.colors.backgroundNegative
                            : d.status === "building" || d.status === "cloning" ? theme.colors.accent
                            : theme.colors.backgroundTertiary,
                        })} />
                        <div className={css({ minWidth: 0 })}>
                          <LabelMedium overrides={{ Block: { style: { fontWeight: "600", margin: 0 } } }}>
                            {d.repoSlug}
                          </LabelMedium>
                          <LabelXSmall overrides={{ Block: { style: {
                            color: theme.colors.contentTertiary, margin: 0,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          } } }}>
                            {d.repoUrl} · {d.branch}
                          </LabelXSmall>
                        </div>
                      </div>

                      {/* Right: metadata + status */}
                      <div className={css({ display: "flex", alignItems: "center", gap: theme.sizing.scale500, flexShrink: "0" })}>
                        <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary } } }}>
                          {d.createdAt}
                        </LabelXSmall>
                        <Tag kind={statusTagKind[d.status]} closeable={false}>{d.status}</Tag>
                        {d.status === "failed" && (
                          <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentNegative } } }}>
                            failed in {d.failingStage}
                          </LabelXSmall>
                        )}
                        <LabelSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary } } }}>
                          →
                        </LabelSmall>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* APPLICATIONS page */}
        {page === "applications" && (
          <AppsMonitor
            apps={apps}
            deployments={deployments}
            onAction={appAction}
            onCopyUrl={copyUrl}
          />
        )}
      </main>

      {/* ── New deployment Drawer ───────────────────────────────── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        anchor={ANCHOR.right}
        overrides={{
          Root: { style: { zIndex: "200" } },
          DrawerBody: { style: { padding: "0", margin: "0" } },
          DrawerContainer: { style: { width: "520px", maxWidth: "95vw" } },
        }}
      >
        <div className={css({ padding: theme.sizing.scale800, display: "grid", gap: theme.sizing.scale600 })}>
          <div>
            <DisplayXSmall overrides={{ Block: { style: { margin: 0, letterSpacing: "-0.02em" } } }}>
              New deployment
            </DisplayXSmall>
            <LabelXSmall overrides={{ Block: { style: { color: theme.colors.contentTertiary, marginTop: theme.sizing.scale200 } } }}>
              Paste a Git repository URL and Implode handles the rest.
            </LabelXSmall>
          </div>
          <DeployForm busy={busy} onDeploy={startDeploy} inDrawer />
        </div>
      </Drawer>
    </div>
  );
}

export default App;
