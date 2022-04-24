import { AudioMode } from './Audio.types';
export * from './Audio/Recording';
export * from './Audio/Sound';
export { setIsEnabledAsync } from './Audio/AudioAvailability';
export { PitchCorrectionQuality } from './AV';
export declare function setAudioModeAsync(partialMode: Partial<AudioMode>): Promise<void>;
//# sourceMappingURL=Audio.d.ts.map