/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react-native';

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
  it('mounts the player on the current video element, not on a structurally equal one', () => {
    const firstVideo = document.createElement('video');
    const secondVideo = document.createElement('video');
    // Two bare <video> elements are structurally equal, but they are different nodes.
    expect(secondVideo.isEqualNode(firstVideo)).toBe(true);

    let currentVideo = firstVideo;
    const firstPlayer = createPlayer();
    const secondPlayer = createPlayer();

    const screen = render(<VideoView player={firstPlayer} />, {
      createNodeMock: () => currentVideo,
    });
    // `toHaveBeenCalledWith` compares DOM nodes with `isEqualNode`, so check identity explicitly.
    expect(jest.mocked(firstPlayer.mountVideoView).mock.calls[0]?.[0]).toBe(firstVideo);

    // The ref callback now receives a different <video> element.
    currentVideo = secondVideo;
    screen.rerender(<VideoView player={secondPlayer} />);

    expect(secondPlayer.mountVideoView).toHaveBeenCalledTimes(1);
    expect(jest.mocked(secondPlayer.mountVideoView).mock.calls[0]?.[0]).toBe(secondVideo);
  });
});
