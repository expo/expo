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
