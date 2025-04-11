import { requireNativeModule, NativeModule } from 'expo-modules-core';

type ExpoLinkingModuleEvents = {
  onURLReceived(url: string): void;
};

declare class ExpoLinkingNativeModule extends NativeModule<ExpoLinkingModuleEvents> {
  getLinkingURL(): string | null;
}

const ExpoLinking = requireNativeModule<ExpoLinkingNativeModule>('ExpoLinking');
export default ExpoLinking;
