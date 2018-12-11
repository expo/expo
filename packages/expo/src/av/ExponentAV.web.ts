export default {
  get name(): string {
    return 'ExponentAV';
  },
  async presentFullscreenPlayer() {},
  async getStatusForVideo() {},
  async loadForVideo() {},
  async unloadForVideo() {},
  async setStatusForVideo() {},
  async replayVideo() {},
  /* Audio */
  async setAudioMode() {},
  async setAudioIsEnabled() {},

  async getStatusForSound() {},
  async setErrorCallbackForSound() {},
  async loadForSound() {},
  async unloadForSound() {},
  async setStatusForSound() {},
  async replaySound() {},

  /* Recording */
  //   async setUnloadedCallbackForAndroidRecording() {},
  async getAudioRecordingStatus() {},
  async prepareAudioRecorder() {},
  async startAudioRecording() {},
  async pauseAudioRecording() {},
  async stopAudioRecording() {},
  async unloadAudioRecorder() {},
};
