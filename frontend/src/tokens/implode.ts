/**
 * Implode semantic tokens — built on top of the Porsche Design System v4.
 *
 * Rule: no raw hex/hsl in components. Import from here (JS) or use the
 * matching `var(--implode-…)` custom property / PDS Tailwind utility (CSS).
 *
 * Status → PDS `PTag` variant mapping lives here so pipeline stages,
 * deployment states, and health indicators stay consistent everywhere.
 */
import type { TagVariant } from "@porsche-design-system/components-react";

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

export const statusTagVariant: Record<DeploymentStatus, TagVariant> = {
  pending: "secondary",
  cloning: "info",
  detecting: "info-frosted",
  building: "info",
  running: "info-frosted",
  succeeded: "success",
  failed: "error",
  stopped: "secondary",
};

export const healthTagVariant: Record<HealthState, TagVariant> = {
  healthy: "success",
  degraded: "warning",
  unhealthy: "error",
  unknown: "secondary",
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
  /** Content column — matches PDS admin-panel template rhythm. */
  contentMaxWidth: "76rem",
  /** The one memorable surface: the terminal log panel. */
  logPanelMinHeight: "22rem",
} as const;

export const implodeTiming = {
  /** Simulated pipeline tick for the stubbed (backend-less) flow. */
  stubStageMs: 1400,
} as const;
