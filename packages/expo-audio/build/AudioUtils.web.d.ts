import { AudioSource, AudioStatus } from './Audio.types';
export declare const nextId: () => string;
export declare function getAudioContext(): AudioContext;
export declare function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
export declare function safeDuration(duration: number): number;
export declare function getStatusFromMedia(media: HTMLMediaElement, id: string): AudioStatus;
export declare const preloadCache: Map<string, {
    blobUrl: string;
    audio: HTMLAudioElement;
}>;
export declare function getSourceUri(source: AudioSource): string | undefined;
//# sourceMappingURL=AudioUtils.web.d.ts.map