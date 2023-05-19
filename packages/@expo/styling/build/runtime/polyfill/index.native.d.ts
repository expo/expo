import { ComponentType } from 'react';
import { defaultCSSInterop } from '../native/css-interop';
import { InteropFunction } from './mapping';
export { defaultCSSInterop };
export declare function makeStyled(component: ComponentType, interop?: InteropFunction): void;
/**
 * The SvgCSSInterop utilises the defaultCSSInterop to transform the `style` prop.
 * Once transformed, the `fill` and `stroke` style attributes are removed and added to the `props` object
 */
export declare function svgCSSInterop(jsx: Function, type: ComponentType<any>, props: any, key: string, experimentalFeatures?: boolean): any;
//# sourceMappingURL=index.native.d.ts.map