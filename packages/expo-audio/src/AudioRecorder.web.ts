import {
  RecorderState,
  RecordingInput,
  RecordingOptions,
  RecordingOptionsWeb,
  RecordingStartOptions,
} from './Audio.types';
import { RECORDING_STATUS_UPDATE } from './AudioEventKeys';
import { AudioRecorder, RecordingEvents } from './AudioModule.types';
import { getAudioContext, getUserMedia, nextId } from './AudioUtils.web';
import { RecordingPresets } from './RecordingConstants';

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
  private cachedInputs: RecordingInput[] = [];
  private selectedDeviceId: string | null = null;
  private stream: MediaStream | null = null;
  private handleDeviceChange: (() => void) | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserBuffer: Float32Array<ArrayBuffer> | null = null;
  private analyserSource: MediaStreamAudioSourceNode | null = null;
  private meteringEnabled = false;

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  record(options?: RecordingStartOptions): void {
    if (this.mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    // Clear any existing timeouts
    this.clearTimeouts();

    // Note: atTime is not supported on Web (no native equivalent), so we ignore it entirely
    // Only forDuration is implemented using setTimeout
    const { forDuration } = options || {};

    this.startActualRecording();

    if (forDuration !== undefined) {
      this.timeoutIds.push(
        setTimeout(() => {
          this.stop();
        }, forDuration * 1000)
      );
    }
  }

  private startActualRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    } else {
      this.mediaRecorder?.start();
    }
  }

  getAvailableInputs(): RecordingInput[] {
    return this.cachedInputs;
  }

  getCurrentInput(): Promise<RecordingInput> {
    const deviceId =
      this.selectedDeviceId ?? this.stream?.getAudioTracks()[0]?.getSettings().deviceId;
    const matched = this.cachedInputs.find((input) => input.uid === deviceId);
    if (matched) {
      return Promise.resolve(matched);
    }
    return Promise.resolve(
      this.cachedInputs[0] ?? {
        type: 'Default',
        name: 'Default',
        uid: 'Default',
      }
    );
  }

  async prepareToRecordAsync(): Promise<void> {
    return this.setup();
  }

  getStatus(): RecorderState {
    const status: RecorderState = {
      canRecord:
        this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'inactive',
      isRecording: this.mediaRecorder?.state === 'recording',
      durationMillis: this.getAudioRecorderDurationMillis(),
      mediaServicesDidReset: false,
      url: this.uri,
    };
    if (this.meteringEnabled && this.mediaRecorderIsRecording) {
      status.metering = this.getMeteringLevel();
    }
    return status;
  }

  pause(): void {
    if (this.mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    this.mediaRecorder?.pause();
  }

  recordForDuration(seconds: number): void {
    this.record({ forDuration: seconds });
  }

  setInput(input: string): void {
    if (!this.cachedInputs.some((cached) => cached.uid === input)) {
      throw new Error(`No audio input device found for uid: ${input}`);
    }
    this.selectedDeviceId = input;
  }

  startRecordingAtTime(seconds: number): void {
    this.record({ atTime: seconds });
  }

  async stop(): Promise<void> {
    if (this.mediaRecorder === null) {
      throw new Error(
        'Cannot start an audio recording without initializing a MediaRecorder. Run prepareToRecordAsync() before attempting to start an audio recording.'
      );
    }

    const dataPromise = new Promise<Blob>((resolve) =>
      this.mediaRecorder?.addEventListener('dataavailable', (e) => resolve(e.data))
    );

    this.mediaRecorder?.stop();
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

  private async createMediaRecorder(
    options: Partial<RecordingOptions> & Partial<RecordingOptionsWeb>
  ): Promise<MediaRecorder> {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
      throw new Error('No media devices available');
    }

    this.mediaRecorderUptimeOfLastStartResume = 0;
    this.currentTime = 0;

    const audioConstraints = this.selectedDeviceId
      ? { deviceId: { exact: this.selectedDeviceId } }
      : true;
    const stream = await getUserMedia({ audio: audioConstraints });
    this.stream = stream;

    await this.updateCachedInputs();

    this.handleDeviceChange = () => {
      this.updateCachedInputs();
    };
    navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);

    if (options.isMeteringEnabled) {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      this.analyserSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyserSource.connect(this.analyser);
      this.analyserBuffer = new Float32Array(this.analyser.frequencyBinCount);
      this.meteringEnabled = true;
    }

    const defaults = RecordingPresets.HIGH_QUALITY.web;
    const mediaRecorderOptions: MediaRecorderOptions = {};

    const mimeType = options.mimeType ?? defaults.mimeType;
    if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
      mediaRecorderOptions.mimeType = mimeType;
    }

    if (options.bitsPerSecond) {
      mediaRecorderOptions.bitsPerSecond = options.bitsPerSecond;
    } else if (options.bitRate) {
      mediaRecorderOptions.audioBitsPerSecond = options.bitRate;
    } else {
      mediaRecorderOptions.bitsPerSecond = defaults.bitsPerSecond;
    }

    const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);

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

    mediaRecorder?.addEventListener('stop', () => {
      this.currentTime = 0;
      this.mediaRecorderIsRecording = false;
      this.stream = null;

      if (this.analyserSource) {
        this.analyserSource.disconnect();
        this.analyserSource = null;
      }
      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
        this.analyserBuffer = null;
      }

      if (this.handleDeviceChange) {
        navigator.mediaDevices?.removeEventListener('devicechange', this.handleDeviceChange);
        this.handleDeviceChange = null;
      }

      // Clears recording icon in Chrome tab
      stream.getTracks().forEach((track) => track.stop());
    });

    return mediaRecorder;
  }

  private async updateCachedInputs() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.cachedInputs = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device) => ({
        uid: device.deviceId,
        name: device.label || 'Unknown Device',
        type: device.deviceId === 'default' ? 'Default' : 'Unknown',
      }));
  }

  // Compute the metering level in dBFS using the same RMS-to-decibel formula as
  // native (20 * log10(rms)). -160 represents silence / no signal.
  private getMeteringLevel(): number {
    if (!this.analyser || !this.analyserBuffer) {
      return -160;
    }
    this.analyser.getFloatTimeDomainData(this.analyserBuffer);
    let sumSquares = 0;
    for (let i = 0; i < this.analyserBuffer.length; i++) {
      sumSquares += this.analyserBuffer[i] * this.analyserBuffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.analyserBuffer.length);
    if (rms === 0) {
      return -160;
    }
    return 20 * Math.log10(rms);
  }

  private getAudioRecorderDurationMillis() {
    let duration = this.currentTime;
    if (this.mediaRecorderIsRecording && this.mediaRecorderUptimeOfLastStartResume > 0) {
      duration += Date.now() - this.mediaRecorderUptimeOfLastStartResume;
    }
    return duration;
  }
}
