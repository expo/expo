import { requestPermissionsAsync, getAssetsAsync, getAssetInfoAsync } from 'expo-media-library';
import { VideoSource } from 'expo-video';
const localVideoId: VideoSource = require('../../../assets/videos/ace.mp4') as number;
const seekOptimizedVideoId: VideoSource =
  require('../../../assets/videos/tola_seek_optimized.mov') as number;

const localVideoSource: VideoSource = {
  assetId: localVideoId,
  metadata: {
    title: 'Cute Doggo',
    artist: 'Doggo',
  },
};

export const seekOptimizedSource: VideoSource = {
  assetId: seekOptimizedVideoId,
  metadata: {
    title: 'Tola running (seek optimized)',
    artist:
      "This video has been optimized for seeking by exporting all of it's frames as keyframes",
  },
};

const bigBuckBunnySource: VideoSource = {
  uri: 'https://expo-test-media.com/big_buck_bunny/bbb_720p.mp4',
  metadata: {
    title: 'Big Buck Bunny',
    artist: 'The Open Movie Project',
    artwork: 'https://expo-test-media.com/big_buck_bunny/artwork.jpg',
  },
};

const elephantsDreamSource: VideoSource = {
  uri: 'https://expo-test-media.com/elephants_dream/ed_720p.mp4',
  metadata: {
    title: 'Elephants Dream',
    artist: 'Blender Foundation',
    artwork: 'https://expo-test-media.com/elephants_dream/artwork.jpg',
  },
};

export const hlsSource: VideoSource = {
  uri: 'https://expo-test-media.com/tos_hls/master.m3u8',
  metadata: {
    title: 'Tears Of Steel',
    artist: 'Blender Foundation',
    artwork: 'https://expo-test-media.com/tos_hls/artwork.jpg',
  },
};

export const dashSource: VideoSource = {
  uri: 'https://expo-video-videos-private.uk/tos_dash/manifest.mpd',
  metadata: {
    title: 'Tears Of Steel',
    artist: 'Blender Foundation',
    artwork: 'https://expo-video-videos-private.uk/tos_dash/artwork.jpg',
  },
};

export const nullSource: VideoSource = {
  metadata: {
    title: 'Null Source',
    artist: '-',
  },
};

export async function getMediaLibraryVideoSourceAsync() {
  try {
    const granted = await requestPermissionsAsync(false, ['video']);
    if (!granted) {
      console.error('MediaLibrary permission not granted');
      return null;
    }
    const queryResult = await getAssetsAsync({
      first: 1,
      mediaType: 'video',
    });

    if (queryResult.assets.length === 0) {
      console.warn('No video assets found');
      return null;
    }

    const assetLocalUri = await getAssetInfoAsync(queryResult.assets[0]);
    return {
      uri: assetLocalUri.uri,
      metadata: {
        title: assetLocalUri.filename,
      },
    };
  } catch (error) {
    console.error('Error getting media library video source:', error);
  }
  return null;
}

const audioTrackSource: VideoSource = {
  metadata: {
    title: 'Audio Track',
    artist: 'Audio Track Artist',
  },
  uri: 'https://mirror.selfnet.de/CCC/congress/2019/h264-hd/36c3-11235-eng-deu-fra-36C3_Infrastructure_Review_hd.mp4',
};

const forBiggerBlazesSource: VideoSource = {
  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
};

// source: https://reference.dashif.org/dash.js/latest/samples/drm/widevine.html
const androidDrmSource: VideoSource = {
  uri: 'https://expo-test-media.com/tos_widevine/manifest.mpd',
  drm: {
    licenseServer: 'https://cwip-shaka-proxy.appspot.com/no_auth',
    type: 'widevine',
  },
};

const videoLabels: string[] = [
  'Big Buck Bunny',
  'Elephants Dream',
  'For Bigger Blazes',
  'Tears Of Steel (HLS)',
  'Cute Doggo (local video)',
  'Null Source',
  'Audio Track',
];
const videoSources: VideoSource[] = [
  bigBuckBunnySource,
  elephantsDreamSource,
  forBiggerBlazesSource,
  hlsSource,
  localVideoSource,
  nullSource,
  audioTrackSource,
];

export {
  bigBuckBunnySource,
  forBiggerBlazesSource,
  elephantsDreamSource,
  localVideoSource,
  androidDrmSource,
  videoLabels,
  videoSources,
  audioTrackSource,
};
