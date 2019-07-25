import { URLListener } from './Linking.types';
declare class Linking {
    addEventListener(type: 'url', listener: URLListener): void;
    removeEventListener(type: 'url', listener: URLListener): void;
    canOpenURL(url: string): Promise<boolean>;
    getInitialURL(): Promise<string>;
    openURL(url: string): Promise<void>;
}
declare const _default: Linking;
export default _default;
