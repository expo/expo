export declare function isAudioEnabled(): boolean;
export declare function throwIfAudioIsDisabled(): void;
/**
 * Audio is enabled by default, but if you want to write your own Audio API in a bare workflow app, you might want to disable the Audio API.
 * @param value `true` enables Audio, and `false` disables it.
 * @return A `Promise` that will reject if audio playback could not be enabled for the device.
 */
export declare function setIsEnabledAsync(value: boolean): Promise<void>;
//# sourceMappingURL=AudioAvailability.d.ts.map