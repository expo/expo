import { NativeModule } from './web/CoreModule';
export function createWebModule(moduleImplementation) {
    const module = new NativeModule();
    return Object.assign(module, moduleImplementation);
}
//# sourceMappingURL=createWebModule.web.js.map