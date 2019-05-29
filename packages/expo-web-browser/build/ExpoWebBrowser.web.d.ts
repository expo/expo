import { BrowserResult, OpenBrowserOptions } from './WebBrowser.types';
declare const _default: {
    readonly name: string;
    openBrowserAsync(url: string, browserParams?: OpenBrowserOptions): Promise<BrowserResult>;
};
export default _default;
