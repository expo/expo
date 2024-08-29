import React from 'react';
import type { DOMProps, WebViewProps } from './dom.types';
interface Props {
    dom: DOMProps;
    source: WebViewProps['source'];
}
declare const RawWebView: React.ForwardRefExoticComponent<Props & React.RefAttributes<object>>;
export default RawWebView;
//# sourceMappingURL=webview-wrapper.d.ts.map