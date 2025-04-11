import type { NativeModule } from './ts-declarations/NativeModule';
/**
 * Registers a web module.
 * @param moduleImplementation A class that extends `NativeModule`. The class is registered under `globalThis.expo.modules[className]`.
 * @param moduleName – a name to register the module under `globalThis.expo.modules[className]`.
 * @returns A singleton instance of the class passed into arguments.
 */
export declare function registerWebModule<EventsMap extends Record<never, never>, ModuleType extends typeof NativeModule<EventsMap>>(moduleImplementation: ModuleType, moduleName: string): ModuleType;
//# sourceMappingURL=registerWebModule.d.ts.map