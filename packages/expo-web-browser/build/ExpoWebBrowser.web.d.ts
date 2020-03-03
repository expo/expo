import { WebBrowserResult, WebBrowserOpenOptions } from './WebBrowser.types';
declare const _default: {
    readonly name: string;
    openBrowserAsync(url: string, browserParams?: WebBrowserOpenOptions): Promise<WebBrowserResult>;
};
export default _default;
