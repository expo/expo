import { NativeModule } from './web/CoreModule';
export function createNativeModule(moduleImplementation) {
    const module = new NativeModule();
    return Object.assign(module, moduleImplementation);
}
//# sourceMappingURL=createNativeModule.js.map