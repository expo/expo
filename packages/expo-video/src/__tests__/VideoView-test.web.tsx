/**
 * @jest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type VideoPlayer from '../VideoPlayer.web';
import { VideoView } from '../VideoView.web';

function createPlayer(): VideoPlayer {
  return {
    src: null,
    mountVideoView: jest.fn(),
    unmountVideoView: jest.fn(),
  } as unknown as VideoPlayer;
}

describe('VideoView', () => {
  let root: Root;
  const container = document.createElement('div');

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
  });

  it('mounts the player on the <video> element that is rendered', async () => {
    const player = createPlayer();

    await act(async () => root.render(<VideoView player={player} />));

    const video = container.querySelector('video');
    // `toHaveBeenCalledWith` compares DOM nodes with `isEqualNode`, so check identity explicitly.
    expect(jest.mocked(player.mountVideoView).mock.calls[0]?.[0]).toBe(video);
  });

  it('mounts the player on the new <video> element after a remount', async () => {
    const player = createPlayer();

    await act(async () => root.render(<VideoView key="first" player={player} />));
    const firstVideo = container.querySelector('video')!;
    await act(async () => root.render(<VideoView key="second" player={player} />));
    const secondVideo = container.querySelector('video')!;

    // The two bare elements are structurally equal, but they are different nodes.
    expect(secondVideo).not.toBe(firstVideo);
    expect(secondVideo.isEqualNode(firstVideo)).toBe(true);
    expect(jest.mocked(player.unmountVideoView).mock.calls.at(-1)?.[0]).toBe(firstVideo);
    expect(jest.mocked(player.mountVideoView).mock.calls.at(-1)?.[0]).toBe(secondVideo);
  });
});
