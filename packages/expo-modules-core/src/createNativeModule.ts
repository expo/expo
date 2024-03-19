import { NativeModule } from './web/CoreModule';

export function createNativeModule<ModuleType = any>(moduleImplementation: ModuleType): ModuleType {
  const module = new NativeModule();
  return Object.assign(module, moduleImplementation);
}
