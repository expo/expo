import { Asset } from 'expo-asset';
import { Container } from 'expo-stories/components';
import * as React from 'react';

import {
  LoopingControls,
  PlaybackRateControls,
  PlayPauseStopControls,
  SkipControls,
  VolumeControls,
} from './components/PlayerControls';
import { VideoPlayer } from './components/VideoPlayer';

const remoteUrl = `http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4`;
const localVideo = require('./assets/ace.mp4');

export function VideoSource() {
  return (
    <>
      <Container labelTop="Remote Video Source">
        <VideoPlayer
          source={{ uri: remoteUrl }}
          renderControls={(props) => <PlayPauseStopControls {...props} />}
        />
      </Container>
      <Container labelTop="Local Video Source">
        <VideoPlayer
          source={localVideo}
          renderControls={(props) => <PlayPauseStopControls {...props} />}
        />
      </Container>
    </>
  );
}

VideoSource.storyConfig = {
  name: 'Remote and Local Sources',
};

export function VideoPlayback() {
  const [source, setSource] = React.useState<Asset | null>(null);

  React.useEffect(() => {
    Asset.loadAsync(remoteUrl).then((asset) => {
      const [video] = asset;
      setSource(video);
    });
  }, []);

  return (
    <>
      {[
        {
          label: 'Play Pause and Stop Audio',
          ControlsComponent: PlayPauseStopControls,
        },
        {
          label: 'Skip Forwards and Backwards',
          ControlsComponent: SkipControls,
        },
        {
          label: 'Set Playback Rates',
          ControlsComponent: PlaybackRateControls,
        },
        {
          label: 'Set Volume',
          ControlsComponent: VolumeControls,
        },
        {
          label: 'Set Looping',
          ControlsComponent: LoopingControls,
        },
      ].map(({ label, ControlsComponent }) => (
        <Container labelTop={label} key={label}>
          <VideoPlayer
            source={source}
            renderControls={(props) => <ControlsComponent {...props} />}
          />
        </Container>
      ))}
    </>
  );
}

VideoPlayback.storyConfig = {
  name: 'Video Playback Options',
};

export default {
  title: 'Video',
};
