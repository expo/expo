import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

import {
  AudioMode,
  AudioSource,
  AudioStatus,
  PitchCorrectionQuality,
  RecorderState,
  RecordingInput,
  RecordingOptions,
} from './Audio.types';
import { AudioPlayer, AudioEvents, RecordingEvents, AudioRecorder } from './AudioModule.types';
import {
  AUDIO_SAMPLE_UPDATE,
  PLAYBACK_STATUS_UPDATE,
  RECORDING_STATUS_UPDATE,
} from './ExpoAudioEvents';
import { RecordingPresets } from './RecordingConstants';
import resolveAssetSource from './utils/resolveAssetSource';

const nextId = (() => {
  let id = 0;
  return () => id++;
})();

async function getPermissionWithQueryAsync(
  name: PermissionNameWithAdditionalValues
): Promise<PermissionStatus | null> {
  if (!navigator || !navigator.permissions || !navigator.permissions.query) return null;
  try {
    const { state } = await navigator.permissions.query({ name });
    switch (state) {
      case 'granted':
        return PermissionStatus.GRANTED;
      case 'denied':
        return PermissionStatus.DENIED;
      default:
        return PermissionStatus.UNDETERMINED;
    }
  } catch {
    return PermissionStatus.UNDETERMINED;
  }
}

function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  const getUserMediaFn =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    function () {
      const error: any = new Error('Permission unimplemented');
      error.code = 0;
      error.name = 'NotAllowedError';
      throw error;
    };
  return new Promise((resolve, reject) => {
    // @ts-expect-error: legacy callback signature
    getUserMediaFn.call(navigator, constraints, resolve, reject);
  });
}

function getStatusFromMedia(media: HTMLMediaElement, id: number): AudioStatus {
  const isPlaying = !!(
    media.currentTime > 0 &&
    !media.paused &&
    !media.ended &&
    media.readyState > 2
  );
  return {
    id,
    isLoaded: true,
    duration: media.duration,
    currentTime: media.currentTime,
    playbackState: '',
    timeControlStatus: isPlaying ? 'playing' : 'paused',
    reasonForWaitingToPlay: '',
    playing: isPlaying,
    didJustFinish: media.ended,
    isBuffering: false,
    playbackRate: media.playbackRate,
    shouldCorrectPitch: false,
    mute: media.muted,
    loop: media.loop,
  };
}

export class AudioPlayerWeb
  extends globalThis.expo.SharedObject<AudioEvents>
  implements AudioPlayer
{
  // Reuse a single AudioContext for all instances to avoid context leaks
  private static sharedAudioContext: AudioContext | null = null;

  static getAudioContext(): AudioContext {
    if (!AudioPlayerWeb.sharedAudioContext) {
      AudioPlayerWeb.sharedAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      console.debug('Created new AudioContext');
    }
    return AudioPlayerWeb.sharedAudioContext;
  }

  constructor(source: AudioSource, interval: number) {
    super();
    this.src = source;
    this.interval = interval;
    this.media = this._createMediaElement();
    // initial panner setup for non-sampling path
    const ctx = AudioPlayerWeb.getAudioContext();
    this.panner = ctx.createStereoPanner();
    this.panner.pan.value = 0;
    this.workletSourceNode = ctx.createMediaElementSource(this.media);
    this.gainNode = ctx.createGain();

    //        ┌───────────────────┐
    // media ─┤ MediaSourceNode   │
    //        └───────────────────┘
    //                         ↓
    //        ┌───────────────────┐
    //        │ GainNode (volume) │
    //        └───────────────────┘
    //                         ↓
    //        ┌───────────────────┐
    //        │ StereoPannerNode  │
    //        └───────────────────┘
    //                         ↓
    //                  Destination

    this.workletSourceNode.connect(this.gainNode);
    this.gainNode.connect(this.panner);
    this.panner.connect(ctx.destination);
  }

  id: number = nextId();
  isAudioSamplingSupported = true;
  isBuffering = false;
  shouldCorrectPitch = false;

  private src: AudioSource = null;
  private media: HTMLAudioElement;
  private interval = 500;
  private isPlaying = false;
  private loaded = false;
  private samplingFailedForSource: boolean = false;
  private workletNode: AudioWorkletNode | null = null;
  private workletSourceNode: MediaElementAudioSourceNode | null = null;
  private panner: StereoPannerNode | null = null;
  private gainNode: GainNode | null = null;

  /**
   * Attach the current playback chain to the `AudioWorkletNode` that powers the
   * RMS meter.
   *
   * Why not connect the `MediaElementSource` directly?  Safari delivers the
   * audio signal *before* a `GainNode` to any additional fan-out connections
   * that are created later.  That means a meter connected to the raw media
   * source would continue to see full-scale samples even when the user changes
   * `gain.value`.
   *
   * To ensure the meter reflects what the user actually hears we connect the
   * branch *after* the `GainNode` **and** after the `StereoPannerNode`.  This
   * guarantees that both volume and pan are already applied.
   *
   * WebKit quirk: disconnecting a node does not immediately stop its signal;
   * the old connection may live for one render quantum.  We therefore keep the
   * graph simple and deterministic by always detaching *all* previous paths
   * (see `_disconnectMeter`) and then attaching exactly one new path here.
   */
  private _connectMeter() {
    // If sampling is disabled or the worklet has not been created, do nothing.
    if (!this.isAudioSamplingSupported || !this.workletNode) return;
    try {
      if (this.panner) this.panner.connect(this.workletNode);
      else if (this.gainNode) this.gainNode.connect(this.workletNode);
      else this.workletSourceNode?.connect(this.workletNode);
    } catch {}
  }

  /**
   * Detach any existing meter → worklet connections.
   *
   * We potentially connected the worklet at three different points in the
   * graph (panner, gain node, or media element) depending on which nodes were
   * available at that time.  To avoid keeping ghost connections alive we try
   * to disconnect from all three.
   */
  private _disconnectMeter() {
    if (!this.workletNode) return;
    try {
      if (this.panner) this.panner.disconnect(this.workletNode);
    } catch {}
    try {
      if (this.gainNode) this.gainNode.disconnect(this.workletNode);
    } catch {}
    try {
      this.workletSourceNode?.disconnect(this.workletNode);
    } catch {}
  }

  get playing() {
    return this.isPlaying;
  }
  get muted() {
    return this.media.muted;
  }
  set muted(value: boolean) {
    this.media.muted = value;
  }
  get loop() {
    return this.media.loop;
  }
  set loop(value: boolean) {
    this.media.loop = value;
  }
  get duration() {
    return this.media.duration;
  }
  get currentTime() {
    return this.media.currentTime;
  }
  get paused() {
    return this.media.paused;
  }
  get isLoaded() {
    return this.loaded;
  }
  get playbackRate() {
    return this.media.playbackRate;
  }
  set playbackRate(value: number) {
    this.media.playbackRate = value;
  }
  get volume() {
    if (this.gainNode) {
      return this.gainNode.gain.value;
    }
    return this.media.volume;
  }
  set volume(value: number) {
    const vol = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = vol;
    } else {
      // Fallback for browsers with no Web Audio support
      this.media.volume = vol;
    }
  }
  get audioPan() {
    return this.panner?.pan.value ?? 0;
  }
  set audioPan(value: number) {
    this.setAudioPan(value ?? 0);
  }
  get currentStatus(): AudioStatus {
    return getStatusFromMedia(this.media, this.id);
  }

  play() {
    const ctx = AudioPlayerWeb.getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    this.media.play();
    this.isPlaying = true;
    // Reconnect meter branch (through panner/gain) if sampling is enabled
    this._connectMeter();
  }

  pause() {
    this.media.pause();
    this.isPlaying = false;
    // Disconnect meter branch to stop sampling while paused
    this._disconnectMeter();
  }

  replace(source: AudioSource) {
    this.cleanupSampling(false);
    this.samplingFailedForSource = false;
    this.src = source;
    this.media = this._createMediaElement();
  }

  async seekTo(seconds: number) {
    this.media.currentTime = seconds;
  }

  /** value: -1 = full left, 0 = center, +1 = full right */
  private setAudioPan(value: number) {
    if (this.panner) {
      this.panner.pan.value = Math.max(-1, Math.min(1, value));
    }
  }

  /**
   * Enable or disable audio sampling using AudioWorklet.
   * When enabling, if the worklet is already created, just reconnect the source node.
   * When disabling, only disconnect the source node, keeping the worklet alive.
   */
  async setAudioSamplingEnabled(enabled: boolean) {
    const ctx = AudioPlayerWeb.getAudioContext();
    if (enabled) {
      // If worklet already created, just reconnect source and return
      if (this.workletNode && this.workletSourceNode) {
        try {
          this.workletSourceNode.connect(this.workletNode);
        } catch {}
        this.isAudioSamplingSupported = true;
        return;
      }
      if (this.samplingFailedForSource) return;
      // This is a workaround until Metro Worker support is stable and not experimental
      // https://docs.expo.dev/versions/latest/config/metro/#web-workers
      // Once that's stable, we can use require.unstable_resolveWorker()
      try {
        // had to inline the processor as a Blob because I couldn't require it with metro
        const processorCode = `
          (function () {
            try {
              class MeterProcessor extends AudioWorkletProcessor {
                process(inputs) {
                  const chan = inputs[0]; // array of channels for first input
                  if (chan && chan.length) {
                    let sum = 0;
                    let count = 0;
                    for (let c = 0; c < chan.length; c++) {
                      const data = chan[c];
                      count += data.length;
                      for (let i = 0; i < data.length; i++) {
                        const s = data[i];
                        sum += s * s;
                      }
                    }
                    if (count > 0) {
                      const rms = Math.sqrt(sum / count);
                      this.port.postMessage(rms);
                    }
                  }
                  return true;
                }
              }
              // Register only once in case the worklet is injected multiple times.
              if (!globalThis._meterProcessorRegistered) {
                registerProcessor('meter-processor', MeterProcessor);
                globalThis._meterProcessorRegistered = true;
              }
            } catch {}
          })();
        `;

        const blob = new Blob([processorCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await ctx.audioWorklet.addModule(blobUrl);

        // instantiate & wire up
        if (!this.workletNode) {
          this.workletNode = new AudioWorkletNode(ctx, 'meter-processor');
          this.workletNode.port.onmessage = (e) => {
            const rms = e.data as number;
            const status = getStatusFromMedia(this.media, this.id);
            this.emit(AUDIO_SAMPLE_UPDATE, {
              ...status,
              channels: [{ frames: [rms] }],
              timestamp: this.media.currentTime,
            });
          };
        }
        if (!this.workletSourceNode) {
          this.workletSourceNode = ctx.createMediaElementSource(this.media);
        }
        // Ensure we have a single, correct meter connection
        this._disconnectMeter();
        this._connectMeter();

        this.isAudioSamplingSupported = true;
      } catch (err) {
        console.error('AudioWorklet: inline worklet failed', err);
        this.isAudioSamplingSupported = false;
        this.samplingFailedForSource = true;
      }
    } else {
      // disable sampling: disconnect source, keep worklet alive
      this._disconnectMeter();
      this.isAudioSamplingSupported = false;
    }
  }

  private cleanupSampling(recreateAudio: boolean = false) {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode = null;
    }
    this.media.onpause = null;
    this.media.onplay = null;
    if (recreateAudio) {
      const currentTime = this.media.currentTime;
      const wasPlaying = !this.media.paused;
      this.media = this._createMediaElement();
      this.media.currentTime = currentTime;
      if (wasPlaying) {
        this.media.play();
      }
    }
  }

  setPlaybackRate(second: number, pitchCorrectionQuality?: PitchCorrectionQuality) {
    this.media.playbackRate = second;
    this.shouldCorrectPitch = pitchCorrectionQuality === 'high';
    this.media.preservesPitch = this.shouldCorrectPitch;
  }

  remove() {
    this.cleanupSampling(false);
    this.media.pause();
    this.media.removeAttribute('src');
    this.media.load();
    getStatusFromMedia(this.media, this.id);
  }

  _createMediaElement(): HTMLAudioElement {
    const newSource = getSourceUri(this.src);
    const media = new Audio(newSource);
    media.crossOrigin = 'anonymous';

    let lastEmitTime = 0;
    const intervalSec = this.interval / 1000;

    media.ontimeupdate = () => {
      const now = media.currentTime;
      // detect loop or big seek
      if (now < lastEmitTime) {
        lastEmitTime = now;
      }
      if (now - lastEmitTime >= intervalSec) {
        lastEmitTime = now;
        this.emit(PLAYBACK_STATUS_UPDATE, getStatusFromMedia(media, this.id));
      }
    };

    media.onplay = () => {
      this.isPlaying = true;
      lastEmitTime = media.currentTime; // reset throttle
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
    };

    media.onpause = () => {
      this.isPlaying = false;
      lastEmitTime = media.currentTime; // reset throttle
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        playing: this.isPlaying,
      });
    };

    media.onseeked = () => {
      lastEmitTime = media.currentTime; // user seeked
    };

    media.onended = () => {
      lastEmitTime = 0; // looped
    };

    media.onloadeddata = () => {
      this.loaded = true;
      lastEmitTime = media.currentTime; // initial load
      this.emit(PLAYBACK_STATUS_UPDATE, {
        ...getStatusFromMedia(media, this.id),
        isLoaded: this.loaded,
      });
    };

    return media;
  }
}

function getSourceUri(source: AudioSource): string | undefined {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') return resolveAssetSource(source)?.uri;
  if (typeof source?.assetId === 'number' && !source?.uri)
    return resolveAssetSource(source.assetId)?.uri;
  return source?.uri;
}

export class AudioRecorderWeb
  extends globalThis.expo.SharedObject<RecordingEvents>
  implements AudioRecorder
{
  constructor(options: Partial<RecordingOptions>) {
    super();
    this.options = options;
  }

  async setup() {
    this.mediaRecorder = await this.createMediaRecorder(this.options);
  }

  id = nextId();
  currentTime = 0;
  uri: string | null = null;

  private options: Partial<RecordingOptions>;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaRecorderUptimeOfLastStartResume = 0;
  private mediaRecorderIsRecording = false;
  private timeoutIds: number[] = [];

  get isRecording() {
    return this.mediaRecorder?.state === 'recording';
  }

  record() {
    if (!this.mediaRecorder) {
      throw new Error('Cannot start an audio recording without initializing a MediaRecorder.');
    }
    if (this.mediaRecorder.state === 'paused') this.mediaRecorder.resume();
    else this.mediaRecorder.start();
  }

  getAvailableInputs(): RecordingInput[] {
    return [];
  }
  getCurrentInput(): RecordingInput {
    return { type: 'Default', name: 'Default', uid: 'Default' };
  }
  async prepareToRecordAsync() {
    return this.setup();
  }

  getStatus(): RecorderState {
    return {
      canRecord:
        this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'inactive',
      isRecording: this.mediaRecorder?.state === 'recording',
      durationMillis: this.getAudioRecorderDurationMillis(),
      mediaServicesDidReset: false,
      url: this.uri,
    };
  }

  pause() {
    if (!this.mediaRecorder) throw new Error('Cannot pause without initializing MediaRecorder.');
    this.mediaRecorder.pause();
  }

  recordForDuration(seconds: number) {
    this.record();
    this.timeoutIds.push(setTimeout(() => this.stop(), seconds * 1000));
  }

  setInput(input: string) {}
  startRecordingAtTime(seconds: number) {
    this.timeoutIds.push(setTimeout(() => this.record(), seconds * 1000));
  }

  async stop() {
    if (!this.mediaRecorder) throw new Error('Cannot stop without initializing MediaRecorder.');
    const dataPromise = new Promise<Blob>((resolve) =>
      this.mediaRecorder?.addEventListener('dataavailable', (e) => resolve(e.data))
    );
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    const data = await dataPromise;
    const url = URL.createObjectURL(data);
    this.uri = url;
    this.emit(RECORDING_STATUS_UPDATE, {
      id: this.id,
      isFinished: true,
      hasError: false,
      error: null,
      url,
    });
  }

  clearTimeouts() {
    this.timeoutIds.forEach((id) => clearTimeout(id));
  }

  private async createMediaRecorder(options: Partial<RecordingOptions>): Promise<MediaRecorder> {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices)
      throw new Error('No media devices available');
    this.mediaRecorderUptimeOfLastStartResume = 0;
    this.currentTime = 0;
    const stream = await getUserMedia({ audio: true });
    const mediaRecorder = new (window as any).MediaRecorder(
      stream,
      options.web || RecordingPresets.HIGH_QUALITY.web
    );
    mediaRecorder.addEventListener('pause', () => {
      this.currentTime = this.getAudioRecorderDurationMillis();
      this.mediaRecorderIsRecording = false;
    });
    mediaRecorder.addEventListener('resume', () => {
      this.mediaRecorderUptimeOfLastStartResume = Date.now();
      this.mediaRecorderIsRecording = true;
    });
    mediaRecorder.addEventListener('start', () => {
      this.mediaRecorderUptimeOfLastStartResume = Date.now();
      this.currentTime = 0;
      this.mediaRecorderIsRecording = true;
    });
    mediaRecorder.addEventListener('stop', () => {
      this.currentTime = 0;
      this.mediaRecorderIsRecording = false;
      stream.getTracks().forEach((track) => track.stop());
    });
    return mediaRecorder;
  }

  private getAudioRecorderDurationMillis() {
    let duration = this.currentTime;
    if (this.mediaRecorderIsRecording && this.mediaRecorderUptimeOfLastStartResume > 0) {
      duration += Date.now() - this.mediaRecorderUptimeOfLastStartResume;
    }
    return duration;
  }
}

export async function setAudioModeAsync(mode: AudioMode) {}
export async function setIsAudioActiveAsync(active: boolean) {}

export async function getRecordingPermissionsAsync(): Promise<PermissionResponse> {
  const maybeStatus = await getPermissionWithQueryAsync('microphone');
  switch (maybeStatus) {
    case PermissionStatus.GRANTED:
      return {
        status: PermissionStatus.GRANTED,
        expires: 'never',
        canAskAgain: true,
        granted: true,
      };
    case PermissionStatus.DENIED:
      return {
        status: PermissionStatus.DENIED,
        expires: 'never',
        canAskAgain: true,
        granted: false,
      };
    default:
      return await requestRecordingPermissionsAsync();
  }
}

export async function requestRecordingPermissionsAsync(): Promise<PermissionResponse> {
  try {
    const stream = await getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { status: PermissionStatus.GRANTED, expires: 'never', canAskAgain: true, granted: true };
  } catch {
    return { status: PermissionStatus.DENIED, expires: 'never', canAskAgain: true, granted: false };
  }
}
