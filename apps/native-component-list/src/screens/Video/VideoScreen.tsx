import { Platform } from 'react-native';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const VideoScreens = [
  {
    name: 'DRM',
    route: 'video/drm',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoDRMScreen'));
    },
  },
  {
    name: 'Fullscreen',
    route: 'video/fullscreen',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoFullscreenScreen'));
    },
  },
  {
    name: 'Now Playing',
    route: 'video/now-playing',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoNowPlayingScreen'));
    },
  },
  {
    name: 'Picture In Picture',
    route: 'video/pip',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoPictureInPictureScreen'));
    },
  },
  {
    name: 'Playback Controls',
    route: 'video/playback',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoPlaybackControlsScreen'));
    },
  },
  {
    name: 'Sources',
    route: 'video/sources',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoSourcesScreen'));
    },
  },
  {
    // Note: Renamed "Events" to "Video Events" to avoid conflict with expo-image screens
    name: 'Video Events',
    route: 'video/events',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoEventsScreen'));
    },
  },
];

if (Platform.OS === 'ios') {
  VideoScreens.push({
    // Name "Live Text Interaction" is already taken by the expo-image screens
    name: 'Video Live Text Interaction',
    route: 'video/live-text-interaction',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoLiveTextInteractionScreen'));
    },
  });
}

export default function VideoScreen() {
  const apis: ListElement[] = VideoScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/components/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
