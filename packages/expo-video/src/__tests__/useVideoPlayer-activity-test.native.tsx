import { act, render } from '@testing-library/react-native';
import { Activity } from 'react';

import NativeVideoModule from '../ExpoVideo';
import { useVideoPlayer } from '../VideoPlayer';
import type { VideoPlayer } from '../VideoPlayer.types';

const SOURCE = 'https://example.com/video.mp4';
const OTHER_SOURCE = 'https://example.com/other.mp4';

type Mode = 'visible' | 'hidden';

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useVideoPlayer inside <Activity>', () => {
  it('does not dispose or autoplay a replacement when a playing Activity becomes hidden', async () => {
    const release = jest.spyOn(NativeVideoModule.VideoPlayer.prototype, 'release');
    const setup = jest.fn((player: VideoPlayer) => player.play());
    const players = new Set<VideoPlayer>();

    function Screen() {
      const player = useVideoPlayer(SOURCE, setup);
      players.add(player);
      return null;
    }
    const App = ({ mode }: { mode: Mode }) => (
      <Activity mode={mode}>
        <Screen />
      </Activity>
    );

    const screen = render(<App mode="visible" />, { concurrentRoot: true });
    await flush();
    expect(setup).toHaveBeenCalledTimes(1);
    const original = setup.mock.calls[0]![0];
    expect(original.playing).toBe(true);

    for (let cycle = 0; cycle < 3; cycle++) {
      screen.rerender(<App mode="hidden" />);
      await flush();
      expect(release).not.toHaveBeenCalled();
      expect(setup).toHaveBeenCalledTimes(1);
      expect([...players]).toEqual([original]);
      expect(original.playing).toBe(true);

      screen.rerender(<App mode="visible" />);
      await flush();
      expect(setup).toHaveBeenCalledTimes(1);
      expect(release).not.toHaveBeenCalled();
      expect([...players]).toEqual([original]);
      expect(original.playing).toBe(true);
    }

    screen.unmount();
    await flush();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('replaces the source once, when the Activity is shown again', async () => {
    const replaceAsync = jest.spyOn(NativeVideoModule.VideoPlayer.prototype, 'replaceAsync');
    const players = new Set<VideoPlayer>();

    function Screen({ source }: { source: string }) {
      players.add(useVideoPlayer(source));
      return null;
    }
    const App = ({ mode, source }: { mode: Mode; source: string }) => (
      <Activity mode={mode}>
        <Screen source={source} />
      </Activity>
    );

    const screen = render(<App mode="visible" source={SOURCE} />, {
      concurrentRoot: true,
    });
    screen.rerender(<App mode="hidden" source={SOURCE} />);
    screen.rerender(<App mode="hidden" source={OTHER_SOURCE} />);
    await flush();
    expect(replaceAsync).not.toHaveBeenCalled();

    screen.rerender(<App mode="visible" source={OTHER_SOURCE} />);
    await flush();
    expect(replaceAsync).toHaveBeenCalledTimes(1);
    expect(replaceAsync).toHaveBeenCalledWith({ uri: OTHER_SOURCE });
    expect(players.size).toBe(1);
  });
});
