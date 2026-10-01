import { startBlockingTimeMeasurement } from '../blockingTime';

let now = 0;
let frameCallbacks = new Map<number, FrameRequestCallback>();
let nextFrameId = 1;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

beforeEach(() => {
  now = 1000;
  frameCallbacks = new Map();
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  // The Node test environment has no animation frame API.
  globalThis.requestAnimationFrame = (cb) => {
    const id = nextFrameId++;
    frameCallbacks.set(id, cb);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    if (id != null) frameCallbacks.delete(id);
  };
});

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
});

function frameAt(time: number) {
  now = time;
  const callbacks = [...frameCallbacks.values()];
  frameCallbacks.clear();
  callbacks.forEach((cb) => cb(time));
}

describe('startBlockingTimeMeasurement', () => {
  it('reports zero when every frame arrives on time', () => {
    const onComplete = jest.fn();
    startBlockingTimeMeasurement(onComplete);
    for (let t = 1016; t <= 3016; t += 16) {
      frameAt(t);
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(0);
  });

  it('sums the part of each frame gap above 50ms', () => {
    const onComplete = jest.fn();
    startBlockingTimeMeasurement(onComplete);
    frameAt(1120); // 120ms gap -> 70ms blocking
    frameAt(1160); // 40ms gap -> not blocking
    frameAt(1260); // 100ms gap -> 50ms blocking
    frameAt(3000);
    frameAt(3016);
    // The 1740ms gap before 3000 adds 1690ms of blocking.
    expect(onComplete).toHaveBeenCalledWith(70 + 50 + 1690);
  });

  it('clips the last gap to the 2s window', () => {
    const onComplete = jest.fn();
    startBlockingTimeMeasurement(onComplete);
    frameAt(2900);
    frameAt(3500);
    expect(onComplete).toHaveBeenCalledWith(1850 + 50);
  });

  it('stops requesting frames once the window ends', () => {
    startBlockingTimeMeasurement(jest.fn());
    frameAt(3000);
    expect(frameCallbacks.size).toBe(0);
  });

  it('finish() reports the blocking time so far and stops the measurement', () => {
    const onComplete = jest.fn();
    const measurement = startBlockingTimeMeasurement(onComplete);
    frameAt(1100);
    now = 1300;
    measurement.finish();
    expect(onComplete).toHaveBeenCalledWith(50 + 150);
    expect(frameCallbacks.size).toBe(0);
    measurement.finish();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancel() stops the measurement without reporting', () => {
    const onComplete = jest.fn();
    const measurement = startBlockingTimeMeasurement(onComplete);
    measurement.cancel();
    frameAt(3000);
    measurement.finish();
    expect(onComplete).not.toHaveBeenCalled();
    expect(frameCallbacks.size).toBe(0);
  });
});
