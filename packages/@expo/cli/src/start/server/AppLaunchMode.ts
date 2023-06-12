export enum AppLaunchMode {
  Start = 'start',
  OpenDeepLinkDevClient = 'open-deep-link-dev-client',
  OpenDeepLinkExpoGo = 'open-deep-link-expo-go',
  OpenRedirectPage = 'open-redirect-page',
}

export namespace AppLaunchMode {
  export function valueOf(value: string): AppLaunchMode | undefined {
    for (const mode of Object.values(AppLaunchMode)) {
      if (mode === value) {
        return mode;
      }
    }
    return undefined;
  }
}
