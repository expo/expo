import { getBundleOrigin } from './getBundleOrigin';
import { getBundleUrl } from './getBundleUrl';

const FALLBACK_URL = 'http://localhost:8081/';

export default function getDevServer() {
  const bundleUrl = getBundleUrl();
  const origin = getBundleOrigin(bundleUrl);
  if (origin === null) {
    return { url: FALLBACK_URL, fullBundleUrl: null, bundleLoadedFromServer: false };
  }
  return { url: `${origin}/`, fullBundleUrl: getBundleUrl(), bundleLoadedFromServer: true };
}
