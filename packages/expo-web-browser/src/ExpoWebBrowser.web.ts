import { BrowserResult, OpenBrowserOptions } from './WebBrowser.types';

export default {
  get name() {
    return 'ExpoWebBrowser';
  },
  async openBrowserAsync(
    url: string,
    browserParams: OpenBrowserOptions = {}
  ): Promise<BrowserResult> {
    const { windowName = '_blank', windowFeatures } = browserParams;
    window.open(url, windowName, windowFeatures);
    return { type: 'dismiss' };
  },
};
