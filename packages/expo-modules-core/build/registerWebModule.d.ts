import type { NativeModule } from './ts-declarations/NativeModule';
/**
 * Registers a web module.
 * @param moduleImplementation – a class that extends `NativeModule`. The class is registered under `globalThis.expo.modules[className]`.
 * @returns A singleton instance of the class passed into arguments.
 */
export declare function registerWebModule<EventsMap extends Record<never, never>, ModuleType extends typeof NativeModule<EventsMap>>(moduleImplementation: ModuleType): ModuleType;
//# sourceMappingURL=registerWebModule.d.ts.map