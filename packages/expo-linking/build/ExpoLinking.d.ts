import { NativeModule } from 'expo-modules-core';
type ExpoLinkingModuleEvents = {
    onURLReceived(url: string): void;
};
declare class ExpoLinkingNativeModule extends NativeModule<ExpoLinkingModuleEvents> {
    getLinkingURL(): string | null;
    clearInitialURL(): void;
}
declare const ExpoLinking: ExpoLinkingNativeModule;
export default ExpoLinking;
//# sourceMappingURL=ExpoLinking.d.ts.map