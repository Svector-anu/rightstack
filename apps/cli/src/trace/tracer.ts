export interface TraceEvent {
  stage: number;
  label: string;
  data: Record<string, unknown>;
}

export class Tracer {
  private events: TraceEvent[] = [];
  readonly enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  record(stage: number, label: string, data: Record<string, unknown>): void {
    if (this.enabled) this.events.push({ stage, label, data });
  }

  all(): TraceEvent[] {
    return this.events;
  }
}
