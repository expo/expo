import { NativeModule } from 'expo-modules-core';
type ExppLinkingModuleEvents = {
    onURLReceived(url: string): void;
};
declare class ExpoLinkingNativeModule extends NativeModule<ExppLinkingModuleEvents> {
    getLinkingURL(): string | null;
}
declare const ExpoLinking: ExpoLinkingNativeModule;
export default ExpoLinking;
//# sourceMappingURL=ExpoLinking.d.ts.map