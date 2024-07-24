import { NativeModule } from './web/CoreModule';

export function createWebModule<ModuleType = any>(moduleImplementation: ModuleType): ModuleType {
  const module = new NativeModule();
  return Object.assign(module, moduleImplementation);
}
