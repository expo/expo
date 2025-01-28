import { render } from '@testing-library/react-native';
import { unmockAllProperties, mockLinking } from 'jest-expo';
import * as React from 'react';

import { useVideoPlayer } from '../VideoPlayer';
import { VideoView } from '../VideoView';

describe('VideoView', () => {
  beforeEach(() => {
    mockLinking();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  it('renders title correctly on tvOS', () => {
    const videoSource = {
      uri: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      metadata: {
        title: 'Tears of Steel',
        subTitle: 'Blender Foundation',
      },
    };
    const player = useVideoPlayer(videoSource, (player) => {
      try {
        player.play();
      } catch (e) {
        console.log(e);
      }
    });
    const { getByText } = render(<VideoView player={player} />);
    expect(getByText('Tears of Steel')).toBeTruthy();
  });

  it('renders subtitle correctly on tvOS', () => {
    const videoSource = {
      uri: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      metadata: {
        title: 'Tears of Steel',
        subTitle: 'Blender Foundation',
      },
    };
    const player = useVideoPlayer(videoSource, (player) => {
      try {
        player.play();
      } catch (e) {
        console.log(e);
      }
    });
    const { getByText } = render(<VideoView player={player} />);
    expect(getByText('Blender Foundation')).toBeTruthy();
  });
});
