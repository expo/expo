import { BrowserResult, OpenBrowserParams } from './WebBrowser.types';
declare const _default: {
    readonly name: string;
    openBrowserAsync(url: string, browserParams?: OpenBrowserParams): Promise<BrowserResult>;
};
export default _default;
