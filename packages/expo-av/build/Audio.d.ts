import { AudioMode } from './Audio.types';
export * from './Audio/Recording';
export * from './Audio/Sound';
export { setIsEnabledAsync } from './Audio/AudioAvailability';
export { PitchCorrectionQuality } from './AV';
/**
 * We provide this API to customize the audio experience on iOS and Android.
 * @param partialMode
 * @return A `Promise` that will reject if the audio mode could not be enabled for the device.
 */
export declare function setAudioModeAsync(partialMode: Partial<AudioMode>): Promise<void>;
//# sourceMappingURL=Audio.d.ts.map