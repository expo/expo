import { ExpoFontLoaderModule } from './ExpoFontLoader';
import { FontResource } from './Font.types';
declare const toExport: Required<ExpoFontLoaderModule> | {
    new (): import("expo-modules-core/build/ts-declarations/NativeModule").NativeModule<Record<never, never>>;
    new (object: import("expo-modules-core/build/ts-declarations/EventEmitter").EventEmitter): import("expo-modules-core/build/ts-declarations/NativeModule").NativeModule<Record<never, never>>;
};
export default toExport;
export declare function _createWebFontTemplate(fontFamily: string, resource: FontResource): string;
//# sourceMappingURL=ExpoFontLoader.web.d.ts.map