/** @jest-environment jsdom */

import { render } from '@testing-library/react';

import VideoPlayer from '../VideoPlayer.web';
import VideoView from '../VideoView.web';

beforeEach(() => {
  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('does not set the source again when the view renders after replace()', () => {
  const player = new VideoPlayer({ uri: 'https://example.com/first.mp4' });
  const { container, rerender } = render(<VideoView player={player} />);
  const video = container.querySelector('video')!;
  expect(video.getAttribute('src')).toBe('https://example.com/first.mp4');

  player.replace({ uri: 'https://example.com/second.mp4' });
  // Setting `src` restarts the load, even with the same value.
  const observer = new MutationObserver(() => {});
  observer.observe(video, { attributeFilter: ['src'] });
  rerender(<VideoView player={player} />);
  const srcWrites = observer.takeRecords();
  observer.disconnect();

  expect(srcWrites).toHaveLength(0);
  expect(video.getAttribute('src')).toBe('https://example.com/second.mp4');
});
