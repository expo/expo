export type AudioSource = {
  /**
   * A string representing the resource identifier for the audio,
   * which could be an HTTPS address, a local file path, or the name of a static audio file resource.
   */
  uri?: string;
  /**
   * An object representing the HTTP headers to send along with the request for a remote audio source.
   * On web requires the `Access-Control-Allow-Origin` header returned by the server to include the current domain.
   */
  headers?: Record<string, string>;
};

export type AudioPlayerState = {
  androidImplementation: string;
  isLoaded: boolean;
  isLooping: boolean;
  isMuted: boolean;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  volume: number;
  isPlaying: boolean;
  audioPan: number;
  shouldCorrectPitch: boolean;
};

export type PitchCorrectionQuality = 'low' | 'medium' | 'high';
