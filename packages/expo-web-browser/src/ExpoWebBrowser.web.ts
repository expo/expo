import { BrowserResult, OpenBrowserParams } from './WebBrowser.types';

export default {
  get name() {
    return 'ExpoWebBrowser';
  },
  async openBrowserAsync(
    url: string,
    browserParams: OpenBrowserParams = {}
  ): Promise<BrowserResult> {
    const { target = ' ', features, replace } = browserParams;
    window.open(url, target, features, replace);
    return { type: 'dismiss' };
  },
};
