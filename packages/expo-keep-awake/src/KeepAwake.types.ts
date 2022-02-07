// @needsAudit
export type KeepAwakeEvent = {
  /** Keep awake state. */
  state: KeepAwakeEventState;
};

// @needsAudit
export enum KeepAwakeEventState {
  RELEASE = 'release',
}

// @needsAudit
export type KeepAwakeListener = (event: KeepAwakeEvent) => void;
