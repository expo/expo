import { ExpoModifier } from '../types';
export declare const padding: (all: number) => ExpoModifier;
export declare const size: (width: number, height: number) => ExpoModifier;
export declare const fillMaxSize: () => ExpoModifier;
export declare const offset: (x: number, y: number) => ExpoModifier;
export declare const background: (color: string) => ExpoModifier;
export declare const border: (borderWidth: number, borderColor: string) => ExpoModifier;
export declare const shadow: (elevation: number) => ExpoModifier;
export declare const alpha: (alpha: number) => ExpoModifier;
export declare const blur: (radius: number) => ExpoModifier;
export declare const clickable: (callback: () => void) => ExpoModifier;
export declare const rotate: (degrees: number) => ExpoModifier;
export declare const zIndex: (index: number) => ExpoModifier;
//# sourceMappingURL=modifiers.d.ts.map