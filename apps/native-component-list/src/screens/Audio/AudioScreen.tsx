import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

export const AudioScreens = [
  {
    name: 'Expo Audio Player',
    route: 'audio/expo-audio',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./expo-audio/AudioPlayerScreen'));
    },
  },
  {
    name: 'Expo Audio Recording',
    route: 'audio/expo-audio-recording',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./expo-audio/RecordingScreen'));
    },
  },
  {
    name: 'Expo Audio createAudioPlayer',
    route: 'audio/expo-audio-createAudioPlayer',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./expo-audio/CreateAudioPlayerScreen'));
    },
  },

  {
    name: 'Expo Audio Lock Screen Controls',
    route: 'audio/expo-audio-controls',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./expo-audio/AudioControlsScreen'));
    },
  },
];

export default function AudioScreen() {
  const apis = apiScreensToListElements(AudioScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
