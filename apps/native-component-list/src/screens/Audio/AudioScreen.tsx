import { preload } from 'expo-audio';

import { sfx1, sfx2 } from './AudioPreloadScreen';
import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

preload(sfx1);
preload(sfx2);

export const AudioScreens = [
  {
    name: 'Expo Audio Player',
    route: 'audio/expo-audio',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AudioPlayerScreen'));
    },
  },
  {
    name: 'Expo Audio Playlist',
    route: 'audio/expo-audio-playlist',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AudioPlaylistScreen'));
    },
  },
  {
    name: 'Expo Audio Recording',
    route: 'audio/expo-audio-recording',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./RecordingScreen'));
    },
  },
  {
    name: 'Expo Audio createAudioPlayer',
    route: 'audio/expo-audio-createAudioPlayer',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./CreateAudioPlayerScreen'));
    },
  },
  {
    name: 'Expo Audio Lock Screen Controls',
    route: 'audio/expo-audio-controls',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AudioControlsScreen'));
    },
  },
  {
    name: 'Expo Audio Events',
    route: 'audio/expo-audio-events',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AudioEventsScreen'));
    },
  },
  {
    name: 'Expo Audio Preloading',
    route: 'audio/expo-audio-preload',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AudioPreloadScreen'));
    },
  },
  {
    name: 'Expo Audio Recording Stream',
    route: 'audio/expo-audio-recording-stream',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./RecordingStreamScreen'));
    },
  },
  {
    name: 'Expo Audio ADTS Seek Test',
    route: 'audio/expo-audio-adts-seek-test',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AdtsSeekTestScreen'));
    },
  },
];

export default function AudioScreen() {
  const apis = apiScreensToListElements(AudioScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
