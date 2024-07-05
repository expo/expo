import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const AudioScreens = [
  {
    name: 'Expo Audio Player',
    route: 'audio/expo-audio',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./expo-audio/AudioScreen'));
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
    name: 'Expo AV Player',
    route: 'audio/expo-av',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AV/AudioScreen'));
    },
  },
  {
    name: 'Expo AV Recording',
    route: 'audio/expo-av-recording',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AV/RecordingScreen'));
    },
  },
];

export default function AudioScreen() {
  const apis: ListElement[] = AudioScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/apis/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
