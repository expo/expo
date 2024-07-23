import { requireNativeModule, NativeModule } from 'expo';

type ExppLinkingModuleEvents = {
  onURLReceived(url: string): void;
};

declare class ExpoLinkingNativeModule extends NativeModule<ExppLinkingModuleEvents> {
  getLinkingURL(): string | null;
}

const ExpoLinking = requireNativeModule<ExpoLinkingNativeModule>('ExpoLinking');
export default ExpoLinking;
