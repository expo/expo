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

export type KeepAwakeOptions = {
  /**
   * The call will throw an unhandled promise rejection on Android when the original Activity is dead or deactivated.
   * Set the value to `true` for suppressing the uncaught exception.
   */
  suppressDeactivateWarnings?: boolean;

  /**
   * A callback that is invoked when the keep-awake state changes.
   * @platform web
   */
  listener?: KeepAwakeListener;
};
