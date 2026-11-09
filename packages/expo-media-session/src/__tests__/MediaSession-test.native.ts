import ExpoMediaSession from '../ExpoMediaSession';
import { offerNowPlaying } from '../MediaSession';

jest.mock('../ExpoMediaSession', () => ({
  __esModule: true,
  default: {
    NowPlayingOwner: class {
      static instances: any[] = [];
      listeners = new Map<string, Function>();
      offer = jest.fn();
      update = jest.fn();
      withdraw = jest.fn();
      release = jest.fn();
      constructor() {
        (this.constructor as any).instances.push(this);
      }
      addListener(event: string, listener: Function) {
        this.listeners.set(event, listener);
        return { remove: () => this.listeners.delete(event) };
      }
    },
  },
}));

const nativeModule = ExpoMediaSession as jest.Mocked<typeof ExpoMediaSession>;

beforeEach(() => {
  (nativeModule.NowPlayingOwner as any).instances.length = 0;
});

it('offerNowPlayingForwardsNativeCommandsToTheOwner', () => {
  const owner = {
    nowPlayingId: 'a',
    mediaType: 'audio' as const,
    isPlaying: true,
    handle: jest.fn(() => true),
  };
  const claim = offerNowPlaying(owner, { title: 'A' }, ['play', 'pause']);
  const native = (nativeModule.NowPlayingOwner as any).instances[0];

  expect(native.offer).toHaveBeenCalledWith({ title: 'A' }, ['play', 'pause'], true);
  native.listeners.get('command')({ kind: 'pause' });
  native.listeners.get('pauseForTakeover')();
  expect(owner.handle.mock.calls).toEqual([[{ kind: 'pause' }], [{ kind: 'pause' }]]);

  owner.isPlaying = false;
  claim.update({ title: 'A', elapsedTime: 3 });
  expect(native.update).toHaveBeenCalledWith({ title: 'A', elapsedTime: 3 }, null, false);

  claim.withdraw('ended');
  claim.withdraw('ended');
  expect(native.withdraw).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
  expect(native.listeners.size).toBe(0);
});

it('offerNowPlayingReusesTheNativeOwnerOnReoffer', () => {
  const owner = {
    nowPlayingId: 'a',
    mediaType: 'audio' as const,
    isPlaying: true,
    handle: jest.fn(() => true),
  };
  const first = offerNowPlaying(owner, { title: 'A' }, ['play', 'pause']);
  const second = offerNowPlaying(owner, { title: 'B' }, ['play']);
  const natives = (nativeModule.NowPlayingOwner as any).instances;

  expect(natives).toHaveLength(1);
  const native = natives[0];
  expect(native.offer.mock.calls).toEqual([
    [{ title: 'A' }, ['play', 'pause'], true],
    [{ title: 'B' }, ['play'], true],
  ]);

  first.update({ title: 'A', elapsedTime: 3 });
  first.withdraw('ended');
  expect(native.update).not.toHaveBeenCalled();
  expect(native.withdraw).not.toHaveBeenCalled();
  expect(native.release).not.toHaveBeenCalled();

  native.listeners.get('command')({ kind: 'play' });
  expect(owner.handle).toHaveBeenCalledTimes(1);

  second.update({ title: 'B', elapsedTime: 5 });
  expect(native.update).toHaveBeenCalledWith({ title: 'B', elapsedTime: 5 }, null, true);
  second.withdraw('ended');
  expect(native.withdraw).toHaveBeenCalledTimes(1);
  expect(native.release).toHaveBeenCalledTimes(1);
  expect(native.listeners.size).toBe(0);

  offerNowPlaying(owner, { title: 'C' }, ['play']);
  expect(natives).toHaveLength(2);
  second.withdraw('ended');
  expect(natives[1].withdraw).not.toHaveBeenCalled();
});
