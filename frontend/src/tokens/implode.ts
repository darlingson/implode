/**
 * Implode semantic tokens — built on Uber Base Web (baseui).
 *
 * Status → baseui `Tag` kind mapping lives here so pipeline stages,
 * deployment states, and health indicators stay consistent everywhere.
 */

export type DeploymentStatus =
  | "pending"
  | "cloning"
  | "detecting"
  | "building"
  | "running"
  | "succeeded"
  | "failed"
  | "stopped";

export type HealthState = "healthy" | "degraded" | "unhealthy" | "unknown";

/** baseui Tag kinds */
export type TagKind = "accent" | "blue" | "green" | "red" | "orange" | "gray" | "black";

export const statusTagKind: Record<DeploymentStatus, TagKind> = {
  pending: "gray",
  cloning: "blue",
  detecting: "blue",
  building: "accent",
  running: "blue",
  succeeded: "green",
  failed: "red",
  stopped: "gray",
};

export const healthTagKind: Record<HealthState, TagKind> = {
  healthy: "green",
  degraded: "orange",
  unhealthy: "red",
  unknown: "gray",
};

export const pipelineStages = [
  "cloning",
  "detecting",
  "building",
  "running",
] as const;

export type PipelineStage = (typeof pipelineStages)[number];

export const pipelineStageLabel: Record<PipelineStage, string> = {
  cloning: "Clone",
  detecting: "Detect .NET",
  building: "Build image",
  running: "Run container",
};

export const implodeLayout = {
  contentMaxWidth: "76rem",
  logPanelMinHeight: "22rem",
} as const;

export const implodeTiming = {
  stubStageMs: 1400,
} as const;
