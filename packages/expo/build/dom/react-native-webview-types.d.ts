import { type MarshalledProps } from './dom-entry';
declare global {
    interface Window {
        ReactNativeWebView: {
            postMessage: (message: string) => void;
            injectedObjectJson: () => string;
        };
        $$EXPO_DOM_HOST_OS?: string;
        $$EXPO_INITIAL_PROPS?: MarshalledProps;
    }
}
//# sourceMappingURL=react-native-webview-types.d.ts.map