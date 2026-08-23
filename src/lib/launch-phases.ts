export type Phase =
  | "ready"
  | "activation"
  | "countdown"
  | "ignition"
  | "rocket"
  | "transform"
  | "reveal"
  | "finale"
  | "handoff"
  | "fallback";

export const ERP_URL = "https://jcererp-system.pages.dev/";

/** Phase durations in ms */
export const DURATIONS: Record<Exclude<Phase, "ready" | "fallback">, number> = {
  activation: 1600,
  countdown: 9900,
  ignition: 4600,
  rocket: 5200,
  transform: 6200,
  reveal: 5500,
  finale: 4600,
  handoff: 2200,
};


