export enum AppLaunchMode {
  /** Directly start the app. */
  Start = 'start',

  /** Launch expo-development-client with deep link. */
  OpenDeepLinkDevClient = 'open-deep-link-dev-client',

  /** Launch Expo Go with deep link. */
  OpenDeepLinkExpoGo = 'open-deep-link-expo-go',

  /** Open the redirect page in browser. */
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
