import { Platform } from 'react-native';

import { optionalRequire, routeFilterForE2e } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const VideoScreens = [
  {
    name: 'Audio Options',
    route: 'video/audio',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoAudioScreen'));
    },
  },
  {
    name: 'Audio Tracks',
    route: 'video/audio-tracks',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoAudioTracksScreen'));
    },
  },
  {
    name: 'Cache',
    route: 'video/cache',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoCacheScreen'));
    },
  },
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
    name: 'Subtitles',
    route: 'video/subtitles',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoSubtitlesScreen'));
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
  {
    name: 'Video Events e2e',
    route: 'video/events-e2e',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoEventsScreenE2e'));
    },
    e2e: true,
  },
  {
    name: 'FlatList of videos',
    route: 'video/flat-list',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoFlatListScreen'));
    },
  },
  {
    name: 'FlashList of videos',
    route: 'video/flash-list',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoFlashListScreen'));
    },
  },
  {
    name: 'Generating video thumbnails',
    route: 'video/thumbnails',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoThumbnailsScreen'));
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

if (Platform.OS === 'android') {
  VideoScreens.push({
    name: 'VideoView Surface Type',
    route: 'video/video-view-surface-type',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./VideoSurfaceTypeScreen'));
    },
  });
}

export default function VideoScreen() {
  const apis: ListElement[] = VideoScreens.filter(routeFilterForE2e).map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/components/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} sort={false} />;
}
