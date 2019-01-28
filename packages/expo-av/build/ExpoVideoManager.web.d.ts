import { PlaybackStatus } from './AV';
declare const _default: {
    readonly name: string;
    readonly ScaleNone: string;
    readonly ScaleToFill: string;
    readonly ScaleAspectFit: string;
    readonly ScaleAspectFill: string;
    setFullscreen(element: HTMLMediaElement, isFullScreenEnabled: boolean): Promise<PlaybackStatus>;
};
export default _default;
