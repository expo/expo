// @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server
// The URL that points an app at this dev server — which is a different URL per app.
//
// `exp://<host>` is the **Expo Go** form and nothing else. A development build is a different
// application with its own URL scheme, and handing it an `exp://` link hands it another app's URL:
// nothing opens, or Expo Go opens instead. The form a development build takes is the dev launcher's
// own, and it is pinned against the launcher that parses it rather than against recollection
// [observed — `packages/expo-dev-launcher`, 2026-08-26]:
//
//     <scheme>://expo-development-client/?url=<url-encoded dev server origin>
//
// `EXDevLauncherURLHelper.isDevLauncherURL` is exactly `url.host == "expo-development-client"`, the
// dev server URL rides in the `url` query parameter, and `DevLauncherURLHelper.kt` on Android reads
// it identically. `@expo/cli` builds the same string in `UrlCreator.constructDevClientUrl`.
//
// **A connect URL is not a route link.** `<scheme>://<route>` navigates an app that is *already*
// loaded against a dev server; this is what gets it loaded. Both are the app's own scheme, and both
// are printed, because they answer different halves of "open this route on that device".

import type { DevServerHostType } from '../dev/advertisedUrl';

/** Which app a connect URL is for. */
export type ConnectTargetApp = 'expo-go' | 'dev-build';

/** One way to point an app at this dev server. */
export interface ConnectUrl {
  target: ConnectTargetApp;
  /** The URL to open on the device. */
  url: string;
  /** What to call it when more than one is printed. */
  label: string;
}

/**
 * How to name an app inside a sentence.
 *
 * Apart from {@link ConnectUrl.label}, which is the bare noun a column of two is labelled with:
 * "Expo Go" takes no article and "development build" does, so one string cannot do both without
 * producing "open in the Expo Go".
 */
export function openInPhrase(target: string): string {
  return target === 'expo-go' ? 'Expo Go' : 'the development build';
}

/** The host the dev launcher URL is addressed to, and the only one it recognises. */
const DEV_LAUNCHER_HOST = 'expo-development-client';

/** The Expo Go connect URL: the dev server host under the `exp` scheme. */
export function expoGoConnectUrl(host: string): string {
  return `exp://${host}`;
}

/**
 * The development build connect URL.
 *
 * The origin inside the `url` parameter is `https` for a tunnel and `http` otherwise, which is what
 * `@expo/cli` does for the same string: a tunnel terminates TLS, so the plain-HTTP origin the dev
 * server prints for itself is not the one a device off the network should be given
 * [observed — `UrlCreator.constructDevClientUrl`, 2026-08-26].
 */
export function devClientConnectUrl(
  scheme: string,
  host: string,
  hostType: DevServerHostType | null
): string {
  const origin = `${hostType === 'tunnel' ? 'https' : 'http'}://${host}`;
  return `${scheme}://${DEV_LAUNCHER_HOST}/?url=${encodeURIComponent(origin)}`;
}

export interface BuildConnectUrlsParams {
  /** `host[:port]` of the dev server as a device reaches it, or null when there is none. */
  host: string | null;
  hostType: DevServerHostType | null;
  /** The development build's URL scheme, or null when the project's could not be resolved. */
  scheme: string | null;
  /** Whether the target app was decided to be Expo Go. */
  isExpoGo: boolean;
  /**
   * Whether that decision was **established** rather than inferred.
   *
   * `false` produces both forms, labelled. A guess between two applications is not something to
   * print as one URL: the reader knows which app they installed and this command does not
   * [decided, 2026-08-26].
   */
  certain: boolean;
}

/**
 * Every way to point an app at this dev server, best first.
 *
 * Empty when there is no dev server host to point at — a URL for a server nobody is running is not
 * an answer. Expo Go leads the uncertain case because it needs nothing installed.
 */
export function buildConnectUrls({
  host,
  hostType,
  scheme,
  isExpoGo,
  certain,
}: BuildConnectUrlsParams): ConnectUrl[] {
  if (host == null) {
    return [];
  }

  const expoGo: ConnectUrl = {
    target: 'expo-go',
    label: 'Expo Go',
    url: expoGoConnectUrl(host),
  };
  // A project whose scheme could not be read has no development-build URL to offer, and a line with
  // a hole in it is not one either (llp/0005 §Verifying the route, the same rule as `--scheme`).
  const devBuild: ConnectUrl | null = scheme
    ? {
        target: 'dev-build',
        label: 'development build',
        url: devClientConnectUrl(scheme, host, hostType),
      }
    : null;

  if (!certain) {
    return devBuild ? [expoGo, devBuild] : [expoGo];
  }
  if (isExpoGo) {
    return [expoGo];
  }
  return devBuild ? [devBuild] : [];
}
