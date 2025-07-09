import React from 'react';
import type { DOMProps } from './dom.types';
import ExpoDomWebView from './webview/ExpoDOMWebView';
import RNWebView from './webview/RNWebView';
type RawWebViewProps = React.ComponentProps<Exclude<typeof ExpoDomWebView, undefined>> & React.ComponentProps<Exclude<typeof RNWebView, undefined>>;
interface Props {
    children?: any;
    dom?: DOMProps;
    filePath: string;
    ref: React.Ref<object>;
    [propName: string]: unknown;
}
declare const RawWebView: React.ForwardRefExoticComponent<Omit<Props, "ref"> & React.RefAttributes<object>>;
export declare function resolveWebView(useExpoDOMWebView: boolean): React.ForwardRefExoticComponent<RawWebViewProps>;
export default RawWebView;
//# sourceMappingURL=webview-wrapper.d.ts.map