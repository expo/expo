import { TurboModule } from 'react-native';
interface NativeUnimoduleProxy extends TurboModule {
    getConstants(): {
        [key: string]: any;
    };
    callMethod(moduleName: string, methodKeyOrName: string | number, args: any[]): Promise<any>;
}
declare const _default: NativeUnimoduleProxy;
export default _default;
