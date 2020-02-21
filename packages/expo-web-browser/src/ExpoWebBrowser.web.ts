import { WebBrowserResult, WebBrowserOpenOptions } from './WebBrowser.types';

export default {
  get name() {
    return 'ExpoWebBrowser';
  },
  async openBrowserAsync(
    url: string,
    browserParams: WebBrowserOpenOptions = {}
  ): Promise<WebBrowserResult> {
    const { windowName = '_blank', windowFeatures } = browserParams;
    window.open(url, windowName, windowFeatures);
    return { type: 'dismiss' };
  },
};
