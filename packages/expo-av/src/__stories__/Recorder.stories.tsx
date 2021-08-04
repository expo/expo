import React from 'react';

import AudioModeSelector from './components/AudioModeSelector';
import Player from './components/AudioPlayer';
import Recorder from './components/Recorder';

export const RecordingExample = () => {
  const [recordingUri, setRecordingUri] = React.useState('');

  const handleRecordingFinished = (recordingUri: string) => setRecordingUri(recordingUri);

  const maybeRenderLastRecording = () =>
    recordingUri ? <Player source={{ uri: recordingUri }} /> : null;

  return (
    <>
      <AudioModeSelector />
      <Recorder onDone={handleRecordingFinished} />
      {maybeRenderLastRecording()}
    </>
  );
};

RecordingExample.storyConfig = {
  name: 'Audio Recording',
};

export default {
  title: 'Recording',
};
