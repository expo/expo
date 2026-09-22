// Minimal stubs for the web environment the recorder expects.
class FakeSharedObject {
  emit() {}
  addListener() {}
  removeListener() {}
}

(globalThis as any).expo = { SharedObject: FakeSharedObject };

class FakeMediaRecorder extends EventTarget {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  static isTypeSupported() {
    return true;
  }
  start() {
    this.state = 'recording';
    this.dispatchEvent(new Event('start'));
  }
  stop() {
    this.state = 'inactive';
    this.dispatchEvent(new Event('stop'));
  }
  pause() {
    this.state = 'paused';
    this.dispatchEvent(new Event('pause'));
  }
  resume() {
    this.state = 'recording';
    this.dispatchEvent(new Event('resume'));
  }
  emitData(bytes: number) {
    const event = new Event('dataavailable') as any;
    event.data = { size: bytes };
    this.dispatchEvent(event);
  }
}

(globalThis as any).MediaRecorder = FakeMediaRecorder;

jest.mock('../AudioUtils.web', () => ({
  nextId: () => 1,
  getAudioContext: jest.fn(),
  getUserMedia: jest.fn(async () => ({
    getAudioTracks: () => [],
    getTracks: () => [],
  })),
}));

// Import after the globals are in place.
const { AudioRecorderWeb } = require('../AudioRecorder.web');

function mockMediaDevices() {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      enumerateDevices: jest.fn(async () => []),
    },
    configurable: true,
  });
}

describe('AudioRecorderWeb fileSize', () => {
  beforeEach(() => {
    mockMediaDevices();
  });

  it('is 0 before any data is recorded', () => {
    const recorder = new AudioRecorderWeb({});
    expect(recorder.getStatus().fileSize).toBe(0);
  });

  it('accumulates the size of recorded chunks', async () => {
    const recorder = new AudioRecorderWeb({});
    await recorder.prepareToRecordAsync();
    const mediaRecorder = (recorder as any).mediaRecorder as InstanceType<typeof FakeMediaRecorder>;
    mediaRecorder.emitData(1024);
    mediaRecorder.emitData(512);
    expect(recorder.getStatus().fileSize).toBe(1536);
  });

  it('resets when the recorder is prepared again', async () => {
    const recorder = new AudioRecorderWeb({});
    await recorder.prepareToRecordAsync();
    ((recorder as any).mediaRecorder as InstanceType<typeof FakeMediaRecorder>).emitData(100);
    await recorder.prepareToRecordAsync();
    expect(recorder.getStatus().fileSize).toBe(0);
  });
});

describe('AudioRecorderWeb duration limit', () => {
  beforeEach(() => {
    mockMediaDevices();
    jest.useFakeTimers();
    jest.setSystemTime(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('counts recorded time and preserves the limit across a bare resume', async () => {
    const recorder = new AudioRecorderWeb({});
    await recorder.prepareToRecordAsync();
    const stopSpy = jest.spyOn(recorder, 'stop').mockResolvedValue(undefined);

    recorder.record({ forDuration: 10 });
    jest.advanceTimersByTime(3000);
    recorder.pause();

    jest.advanceTimersByTime(20000);
    expect(recorder.getStatus().durationMillis).toBe(3000);
    expect(stopSpy).not.toHaveBeenCalled();

    recorder.record();
    jest.advanceTimersByTime(6999);
    expect(stopSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it('treats a new forDuration value as an absolute recording limit', async () => {
    const recorder = new AudioRecorderWeb({});
    await recorder.prepareToRecordAsync();
    const stopSpy = jest.spyOn(recorder, 'stop').mockResolvedValue(undefined);

    recorder.record({ forDuration: 10 });
    jest.advanceTimersByTime(3000);
    recorder.pause();
    recorder.record({ forDuration: 5 });

    jest.advanceTimersByTime(1999);
    expect(stopSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it('clears a previous limit when arming without a duration', async () => {
    const recorder = new AudioRecorderWeb({});
    await recorder.prepareToRecordAsync();
    const stopSpy = jest.spyOn(recorder, 'stop').mockResolvedValue(undefined);

    recorder.record({ forDuration: 10 });
    jest.advanceTimersByTime(3000);
    recorder.pause();
    recorder.record({ atTime: 1 });
    jest.advanceTimersByTime(20000);

    expect(stopSpy).not.toHaveBeenCalled();
  });

  it('stops instead of resuming when a replacement limit is already spent', async () => {
    const recorder = new AudioRecorderWeb({});
    await recorder.prepareToRecordAsync();
    const stopSpy = jest.spyOn(recorder, 'stop').mockResolvedValue(undefined);

    recorder.record({ forDuration: 10 });
    jest.advanceTimersByTime(3000);
    recorder.pause();
    recorder.record({ forDuration: 2 });

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(recorder.isRecording).toBe(false);
  });
});
