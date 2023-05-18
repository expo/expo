import type { ComponentType } from "react";
export type InteropFunction = (jsx: Function, type: any, props: Record<string | number, unknown>, key: string, experimentalFeatures?: boolean) => any;
export declare const polyfillMapping: WeakMap<ComponentType, InteropFunction>;
//# sourceMappingURL=mapping.d.ts.map