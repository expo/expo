import { NativeModule } from 'expo';
import { ExpoUIModuleEvents } from './ExpoUI.types';
declare class ExpoUIModule extends NativeModule<ExpoUIModuleEvents> {
    PI: number;
    setValueAsync(value: string): Promise<void>;
    hello(): string;
}
declare const _default: typeof ExpoUIModule;
export default _default;
//# sourceMappingURL=ExpoUIModule.web.d.ts.map