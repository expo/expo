import { requireNativeModule } from 'expo-modules-core';
import { NativeModule } from 'expo-modules-core/build/ts-declarations/NativeModule';

type ExpoLinkingType = {
  getLinkingURL(): string | null;
  clearLinkingURL(): void;
};

const ExpoLinking = requireNativeModule('ExpoLinking') as ExpoLinkingType &
  NativeModule<{ onURLReceived: (url: string) => void }>;

export default ExpoLinking;
