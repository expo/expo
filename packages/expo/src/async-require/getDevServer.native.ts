import { TurboModuleRegistry } from 'react-native';

const NativeSourceCode = TurboModuleRegistry.getEnforcing<{
  getConstants: () => { scriptURL: string };
}>('SourceCode');

const FALLBACK = 'http://localhost:8081/';
let cachedDevServerURL: string | null | undefined;
let cachedFullBundleURL: string | null = null;

/**
 * Many RN development tools rely on the development server (packager) running
 * @return URL to packager with trailing slash
 */
export default function getDevServer(): {
  url: string;
  fullBundleUrl: string | null;
  bundleLoadedFromServer: boolean;
} {
  if (cachedDevServerURL === undefined) {
    const scriptUrl = NativeSourceCode.getConstants().scriptURL;
    const match = scriptUrl.match(/^https?:\/\/.*?\//);
    cachedDevServerURL = match ? match[0] : null;
    cachedFullBundleURL = match ? scriptUrl : null;
  }

  return {
    url: cachedDevServerURL ?? FALLBACK,
    fullBundleUrl: cachedFullBundleURL,
    bundleLoadedFromServer: cachedDevServerURL !== null,
  };
}
