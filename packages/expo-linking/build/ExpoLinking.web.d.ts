import { URLListener } from './Linking.types';
declare const _default: {
    addEventListener(type: 'url', listener: URLListener): {
        remove(): void;
    };
    removeEventListener(type: 'url', listener: URLListener): void;
    canOpenURL(url: string): Promise<boolean>;
    getInitialURL(): Promise<string>;
    openURL(url: string): Promise<void>;
};
export default _default;
//# sourceMappingURL=ExpoLinking.web.d.ts.map