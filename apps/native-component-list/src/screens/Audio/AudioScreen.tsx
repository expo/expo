import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

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
];

export default function AudioScreen() {
  const apis = apiScreensToListElements(AudioScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
