function getStatusFromMedia(media) {
    if (!media) {
        return {
            isLoaded: false,
            error: undefined,
        };
    }
    const isPlaying = !!(media.currentTime > 0 &&
        !media.paused &&
        !media.ended &&
        media.readyState > 2);
    const status = {
        isLoaded: true,
        uri: media.src,
        progressUpdateIntervalMillis: 100,
        durationMillis: media.duration * 1000,
        positionMillis: media.currentTime * 1000,
        // playableDurationMillis: media.buffered * 1000,
        // seekMillisToleranceBefore?: number
        // seekMillisToleranceAfter?: number
        shouldPlay: media.autoplay,
        isPlaying,
        isBuffering: false,
        rate: media.playbackRate,
        // TODO: Bacon: This seems too complicated right now: https://webaudio.github.io/web-audio-api/#dom-biquadfilternode-frequency
        shouldCorrectPitch: false,
        volume: media.volume,
        isMuted: media.muted,
        isLooping: media.loop,
        didJustFinish: media.ended,
    };
    return status;
}
export default {
    get name() {
        return 'ExponentAV';
    },
    async getStatusForVideo(element) {
        const outputStatus = getStatusFromMedia(element);
        return outputStatus;
    },
    async loadForVideo(element, nativeSource, fullInitialStatus) {
        return await this.getStatusForVideo(element);
    },
    async unloadForVideo(element) {
        return await this.getStatusForVideo(element);
    },
    async setStatusForVideo(element, status) {
        if (status.positionMillis !== undefined) {
            element.currentTime = status.positionMillis / 1000;
        }
        // if (status.progressUpdateIntervalMillis !== undefined) {
        //   element.progressUpdateIntervalMillis = status.progressUpdateIntervalMillis;
        // }
        // if (status.seekMillisToleranceBefore !== undefined) {
        //   element.seekMillisToleranceBefore = status.seekMillisToleranceBefore;
        // }
        // if (status.seekMillisToleranceAfter !== undefined) {
        //   element.seekMillisToleranceAfter = status.seekMillisToleranceAfter;
        // }
        // if (status.shouldCorrectPitch !== undefined) {
        //   element.shouldCorrectPitch = status.shouldCorrectPitch;
        // }
        if (status.shouldPlay !== undefined) {
            if (status.shouldPlay) {
                element.play();
            }
            else {
                element.pause();
            }
        }
        if (status.rate !== undefined) {
            element.playbackRate = status.rate;
        }
        if (status.volume !== undefined) {
            element.volume = status.volume;
        }
        if (status.isMuted !== undefined) {
            element.muted = status.isMuted;
        }
        if (status.isLooping !== undefined) {
            element.loop = status.isLooping;
        }
        return await this.getStatusForVideo(element);
    },
    async replayVideo(element, status) {
        return await this.setStatusForVideo(element, status);
    },
    /* Audio */
    async setAudioMode() { },
    async setAudioIsEnabled() { },
    async getStatusForSound() { },
    async setErrorCallbackForSound() { },
    async loadForSound() { },
    async unloadForSound() { },
    async setStatusForSound() { },
    async replaySound() { },
    /* Recording */
    //   async setUnloadedCallbackForAndroidRecording() {},
    async getAudioRecordingStatus() { },
    async prepareAudioRecorder() { },
    async startAudioRecording() { },
    async pauseAudioRecording() { },
    async stopAudioRecording() { },
    async unloadAudioRecorder() { },
};
//# sourceMappingURL=ExponentAV.web.js.map