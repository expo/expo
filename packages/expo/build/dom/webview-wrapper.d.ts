import React from 'react';
import type { DOMProps } from './dom.types';
interface Props {
    dom: DOMProps;
    filePath: string;
}
declare const RawWebView: React.ForwardRefExoticComponent<Props & React.RefAttributes<object>>;
export declare function resolveWebView(useExpoDOMWebView: boolean): any;
export default RawWebView;
//# sourceMappingURL=webview-wrapper.d.ts.map