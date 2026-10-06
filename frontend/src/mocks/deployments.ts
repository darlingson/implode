import type { DeploymentStatus, HealthState } from "@/tokens/implode";

export interface EnvVar {
  key: string;
  value: string;
}

export interface DeployRequest {
  repoUrl: string;
  subfolder: string;
  branch: string;
  envVars: EnvVar[];
}

export interface LogLine {
  id: string;
  stream: "build" | "runtime" | "system";
  text: string;
  at: string;
}

export interface Deployment {
  id: string;
  repoUrl: string;
  repoSlug: string;
  subfolder: string;
  branch: string;
  status: DeploymentStatus;
  failingStage: string | null;
  imageTag: string;
  containerId: string | null;
  hostPort: number | null;
  appUrl: string | null;
  health: HealthState;
  sdkVersion: string | null;
  createdAt: string;
  logs: LogLine[];
}

export interface DeployedApp {
  id: string;
  name: string;
  deploymentId: string;
  status: DeploymentStatus;
  health: HealthState;
  hostPort: number;
  appUrl: string;
  imageTag: string;
  updatedAt: string;
}

export function repoSlugFromUrl(url: string): string {
  const cleaned = url.trim().replace(/\/+$/, "").replace(/\.git$/, "");
  const parts = cleaned.split("/");
  const last = parts[parts.length - 1] || "app";
  return last.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "app";
}

export function isPlausibleGitUrl(url: string): boolean {
  const v = url.trim();
  if (v.length < 8) return false;
  return (
    v.startsWith("https://") ||
    v.startsWith("http://") ||
    v.startsWith("git@") ||
    v.startsWith("ssh://")
  );
}

export function parseEnvText(raw: string): EnvVar[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return {
        key: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      };
    })
    .filter((e) => e.key.length > 0);
}

const now = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

let seq = 0;
export function makeLog(stream: LogLine["stream"], text: string): LogLine {
  seq += 1;
  return { id: `log-${Date.now()}-${seq}`, stream, text, at: now() };
}

/** One historical failure so the error UX (failing stage + tail logs) is visible in the stub. */
export function seedFailedDeployment(): Deployment {
  return {
    id: "dpl_seed_failed_01",
    repoUrl: "https://github.com/example/shopware-dotnet.git",
    repoSlug: "shopware-dotnet",
    subfolder: "src/Shop.Api",
    branch: "main",
    status: "failed",
    failingStage: "building",
    imageTag: "implode/shopware-dotnet:a1b2c3d",
    containerId: null,
    hostPort: null,
    appUrl: null,
    health: "unknown",
    sdkVersion: "net8.0",
    createdAt: "Yesterday, 16:42",
    logs: [
      makeLog("system", "▸ cloning https://github.com/example/shopware-dotnet.git (branch main)"),
      makeLog("system", "▸ detected TargetFramework net8.0 · Sdk.Web · port 8080"),
      makeLog("build", "STEP 4/9 : RUN dotnet publish -c Release"),
      makeLog("build", "error CS1061: 'OrderService' has no 'CheckoutAsync' member"),
      makeLog("system", "✕ stage failed: building — 2 log lines retained"),
    ],
  };
}

export const stubPipelineScript: { stage: string; lines: string[] }[] = [
  {
    stage: "cloning",
    lines: [
      "▸ validating repository URL",
      "▸ git clone --depth 1 --branch main <repo> ./workspace/<id>",
      "✓ clone complete (1.8s)",
    ],
  },
  {
    stage: "detecting",
    lines: [
      "▸ walking workspace for *.csproj",
      "▸ found src/MyApp/MyApp.csproj · TargetFramework net9.0",
      "▸ global.json: none → SDK 9.0 LTS · Sdk.Web · EXPOSE 8080",
    ],
  },
  {
    stage: "building",
    lines: [
      "▸ writing generated Dockerfile (multi-stage, ASP.NET Core)",
      "▸ docker build -t implode/<slug>:<sha>",
      "✓ image built (stubbed, 0.0s)",
    ],
  },
  {
    stage: "running",
    lines: [
      "▸ allocating free host port → 52xx",
      "▸ docker run -d -p <port>:8080 -e ASPNETCORE_URLS=http://+:8080",
      "✓ container healthy · streaming runtime logs",
    ],
  },
];
