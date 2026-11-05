class Env {
  /** Disable auto server root detection for Metro. This will not change the server root to the workspace root. */
  get EXPO_NO_METRO_WORKSPACE_ROOT(): boolean {
    return ['true', '1'].includes((process.env.EXPO_NO_METRO_WORKSPACE_ROOT ?? '').toLowerCase());
  }
}

export const env = new Env();
