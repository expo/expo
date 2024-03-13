export declare class AudioPlayer {
    /**
     * Boolean value whether the player is currently playing.
     */
    isPlaying: boolean;
    /**
     * Boolean value whether the player is currently muted.
     */
    isMuted: boolean;
    isLooping: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    /**
     * Resumes the player.
     */
    play(): void;
    /**
     * Pauses the player.
     */
    pause(): void;
    prepareToPlay(): void;
    isLoopingEnabled(enabled: boolean): void;
    setRate(rate: number): void;
    /**
     * Seeks the playback by the given number of seconds.
     */
    seekBy(seconds: number): void;
    /**
     * Seeks the playback to the beginning.
     */
    setVolume(volume: number): void;
}
//# sourceMappingURL=AudioModule.types.d.ts.map