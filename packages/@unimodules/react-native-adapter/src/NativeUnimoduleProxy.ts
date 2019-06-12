import { TurboModule, TurboModuleRegistry } from 'react-native';

interface NativeUnimoduleProxy extends TurboModule {
  getConstants(): { [key: string]: any };
  callMethod(moduleName: string, methodKeyOrName: string | number, args: any[]): Promise<any>;
}

export default TurboModuleRegistry.getEnforcing<NativeUnimoduleProxy>('NativeUnimoduleProxy');
