import {
  PBanner,
  PButton,
  PCrest,
  PDivider,
  PHeading,
  PInlineNotification,
  PLinkPure,
  PTabsBar,
  PTag,
  PText,
  PWordmark,
} from "@porsche-design-system/components-react";
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
import { healthTagVariant, statusTagVariant } from "@/tokens/implode";

type View = "deploy" | "pipeline" | "apps";

const viewIndex: Record<View, number> = { deploy: 0, pipeline: 1, apps: 2 };
const indexView: View[] = ["deploy", "pipeline", "apps"];

let idSeq = 100;

export function App() {
  const [view, setView] = useState<View>("deploy");
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
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable in some contexts — still show the URL */
    }
    setNotice(`Copied: ${url}`);
  };

  const startDeploy = (req: DeployRequest) => {
    idSeq += 1;
    const slug = repoSlugFromUrl(req.repoUrl);
    const id = `dpl_stub_${idSeq}`;
    const port = 5200 + (idSeq % 90);
    const dep: Deployment = {
      id,
      repoUrl: req.repoUrl,
      repoSlug: slug,
      subfolder: req.subfolder || "—",
      branch: req.branch,
      status: "building",
      failingStage: null,
      imageTag: `implode/${slug}:stub${idSeq}`,
      containerId: null,
      hostPort: port,
      appUrl: `http://localhost:${port}`,
      health: "unknown",
      sdkVersion: null,
      createdAt: "just now",
      logs: [
        makeLog("system", `▸ deploy requested: ${req.repoUrl}`),
        makeLog(
          "system",
          `▸ subfolder=${req.subfolder || "(root)"} branch=${req.branch} env=${req.envVars.length}`,
        ),
      ],
    };
    setDeployments((prev) => [dep, ...prev]);
    setActiveId(id);
    setBusy(true);
    setView("pipeline");
    window.setTimeout(() => setBusy(false), 600);
  };

  const finishDeploy = (done: Deployment) => {
    setDeployments((prev) => prev.map((d) => (d.id === done.id ? done : d)));
    setApps((prev) => {
      if (prev.some((a) => a.deploymentId === done.id)) return prev;
      return [
        {
          id: `app_${done.id}`,
          name: done.repoSlug,
          deploymentId: done.id,
          status: "succeeded",
          health: "healthy",
          hostPort: done.hostPort ?? 5281,
          appUrl: done.appUrl ?? "http://localhost:5281",
          imageTag: done.imageTag,
          updatedAt: "just now",
        },
        ...prev,
      ];
    });
  };

  const appAction = (appId: string, action: "stop" | "restart" | "redeploy") => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status:
                action === "stop"
                  ? "stopped"
                  : action === "restart"
                    ? "running"
                    : "building",
              health: action === "stop" ? "unknown" : "healthy",
              updatedAt: "just now",
            }
          : a,
      ),
    );
    setNotice(
      action === "stop"
        ? "Container stop requested (stub)."
        : action === "restart"
          ? "Container restart requested (stub)."
          : "Redeploy queued: pull → rebuild → replace (stub).",
    );
  };

  const empty = deployments.length === 0;

  return (
    <div className="scheme-light-dark min-h-svh bg-canvas text-primary">
      {/* Top bar */}
      <header className="border-b border-contrast-low">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-static-sm px-fluid-sm py-fluid-xs">
          <div className="flex items-center gap-static-sm">
            <PCrest style={{ width: 36, height: 45 }} />
            <div>
              <PHeading size="medium" tag="h1">
                Implode
              </PHeading>
              <PText color="contrast-medium" size="x-small">
                Self-hosted .NET deployments
              </PText>
            </div>
            <PTag variant="secondary">stub</PTag>
          </div>
          <div className="flex items-center gap-static-md">
            <PWordmark style={{ width: 120 }} />
            <PLinkPure href="http://localhost:8080/healthz">
              Backend: /healthz
            </PLinkPure>
          </div>
        </div>
      </header>

      {notice ? (
        <div className="mx-auto max-w-6xl px-fluid-sm pt-fluid-xs">
          <PBanner
            heading="Done"
            description={notice}
            state="success"
            open
            onDismiss={() => setNotice(null)}
          />
        </div>
      ) : null}

      {/* Nav */}
      <nav className="mx-auto max-w-6xl px-fluid-sm">
        <PTabsBar
          activeTabIndex={viewIndex[view]}
          onUpdate={(e) => {
            const idx = (e as CustomEvent<{ activeTabIndex: number }>).detail
              .activeTabIndex;
            setView(indexView[idx] ?? "deploy");
          }}
        >
          <button type="button">New deployment</button>
          <button type="button">Pipeline{active ? ` · ${active.repoSlug}` : ""}</button>
          <button type="button">Applications ({apps.length})</button>
        </PTabsBar>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-fluid-md px-fluid-sm py-fluid-sm">
        {view === "deploy" ? (
          <>
            {empty ? (
              <div className="grid gap-fluid-xs rounded-3xl bg-surface p-fluid-lg text-center">
                <PHeading size="x-large" tag="h2">
                  No repositories yet
                </PHeading>
                <PText color="contrast-medium">
                  Paste a .NET Git URL below and Implode takes it from clone to
                  running container.
                </PText>
              </div>
            ) : null}

            <DeployForm busy={busy} onDeploy={startDeploy} />

            <section className="grid gap-fluid-xs">
              <PHeading size="medium" tag="h2">
                Deployment history
              </PHeading>
              {deployments.map((d) => (
                <article
                  key={d.id}
                  className="grid gap-static-sm rounded-3xl bg-surface p-fluid-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-static-sm">
                    <div>
                      <PText weight="semibold">{d.repoSlug}</PText>
                      <PText color="contrast-medium" size="x-small">
                        {d.repoUrl} · {d.branch} · {d.createdAt} ·{" "}
                        {d.imageTag}
                      </PText>
                    </div>
                    <div className="flex items-center gap-static-sm">
                      <PTag variant={statusTagVariant[d.status]}>{d.status}</PTag>
                      <PTag variant={healthTagVariant[d.health]}>{d.health}</PTag>
                    </div>
                  </div>
                  {d.status === "failed" ? (
                    <PInlineNotification
                      heading={`Failed in ${d.failingStage ?? "pipeline"}`}
                      state="error"
                    >
                      Showing the last {d.logs.length} retained log lines —
                      matches the future failure contract.
                    </PInlineNotification>
                  ) : null}
                  <LogPanel lines={d.logs.slice(-4)} minHeight="8rem" />
                  <div className="flex flex-wrap gap-static-sm">
                    <PButton
                      variant="secondary"
                      compact
                      onClick={() => {
                        setActiveId(d.id);
                        setView("pipeline");
                      }}
                    >
                      Open pipeline
                    </PButton>
                    <PButton
                      variant="secondary"
                      compact
                      onClick={() => setView("apps")}
                    >
                      View applications
                    </PButton>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : null}

        {view === "pipeline" ? (
          active ? (
            <PipelineView
              key={active.id}
              deployment={active}
              onDone={finishDeploy}
              onCopyUrl={copyUrl}
            />
          ) : (
            <div className="grid gap-fluid-xs rounded-3xl bg-surface p-fluid-lg text-center">
              <PHeading size="large" tag="h2">
                No active deployment
              </PHeading>
              <PText color="contrast-medium">
                Start from the deploy form — the live pipeline stub appears here.
              </PText>
              <div className="flex justify-center">
                <PButton onClick={() => setView("deploy")}>New deployment</PButton>
              </div>
            </div>
          )
        ) : null}

        {view === "apps" ? (
          <AppsMonitor
            apps={apps}
            deployments={deployments}
            onAction={appAction}
            onCopyUrl={copyUrl}
          />
        ) : null}

        <PDivider />
        <footer className="flex flex-wrap items-center justify-between gap-static-sm pb-fluid-md">
          <PText color="contrast-medium" size="x-small">
            Frontend stub · Porsche Design System v4 · backend contract:{" "}
            pending → cloning → detecting → building → running → succeeded /
            failed
          </PText>
          <PText color="contrast-medium" size="x-small">
            Tokens: src/tokens · Mocks: src/mocks
          </PText>
        </footer>
      </main>
    </div>
  );
}

export default App;
