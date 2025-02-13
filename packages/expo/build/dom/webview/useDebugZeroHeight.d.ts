import { type ViewProps } from 'react-native';
import { type DOMProps, type WebViewProps } from '../dom.types';
type UseDebugZeroHeightType = (dom?: DOMProps) => {
    debugZeroHeightStyle: WebViewProps['containerStyle'] | undefined;
    debugOnLayout: ViewProps['onLayout'];
};
/**
 * Debug only hook to help identify zero height issues in the DOM component.
 */
export declare const useDebugZeroHeight: UseDebugZeroHeightType;
export {};
//# sourceMappingURL=useDebugZeroHeight.d.ts.map