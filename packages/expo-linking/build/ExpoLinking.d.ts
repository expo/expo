import { URLListener } from './Linking.types';
declare const _default: {
    addEventListener(type: string, handler: URLListener): void;
    removeEventListener(type: string, handler: URLListener): void;
    canOpenURL: any;
    openSettings: any;
    getInitialURL: any;
    openURL: any;
    sendIntent: (action: string, extras?: {
        key: string;
        value: string | number | boolean;
    }[] | undefined) => Promise<void>;
};
export default _default;
