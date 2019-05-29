import { BrowserResult, OpenBrowserParams } from './WebBrowser.types';

export default {
  get name() {
    return 'ExpoWebBrowser';
  },
  async openBrowserAsync(
    url: string,
    browserParams: OpenBrowserParams = {}
  ): Promise<BrowserResult> {
    const { windowName = '_blank', windowFeatures, replace } = browserParams;
    window.open(url, windowName, windowFeatures, replace);
    return { type: 'dismiss' };
  },
};
