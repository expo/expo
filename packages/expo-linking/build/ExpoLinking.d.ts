import { NativeModule } from 'expo-modules-core/build/ts-declarations/NativeModule';
type ExpoLinkingType = {
    getLinkingURL(): string | null;
    clearLinkingURL(): void;
};
declare const ExpoLinking: ExpoLinkingType & NativeModule<{
    onURLReceived: (url: string) => void;
}>;
export default ExpoLinking;
//# sourceMappingURL=ExpoLinking.d.ts.map