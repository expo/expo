export type AudioMode = {
  allowsRecordingIOS: boolean;
  interruptionModeIOS: InterruptionModeIOS;
  playsInSilentModeIOS: boolean;
  staysActiveInBackground: boolean;
  interruptionModeAndroid: InterruptionModeAndroid;
  shouldDuckAndroid: boolean;
  playThroughEarpieceAndroid: boolean;
};

export enum InterruptionModeIOS {
  MixWithOthers = 0,
  DoNotMix = 1,
  DuckOthers = 2,
}

export enum InterruptionModeAndroid {
  DoNotMix = 1,
  DuckOthers = 2,
}
