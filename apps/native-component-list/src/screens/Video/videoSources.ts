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
      "This video has been optimized for seeking by exoirting all of it's frames as keyframes",
  },
};

const bigBuckBunnySource: VideoSource = {
  // backup at https://github.com/vonovak/expo-video-tests/releases/tag/v0
  uri: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
  metadata: {
    title: 'Big Buck Bunny',
    artist: 'The Open Movie Project',
    artwork:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1200px-Big_buck_bunny_poster_big.jpg',
  },
};

const elephantsDreamSource: VideoSource = {
  // backup at https://github.com/vonovak/expo-video-tests/releases/tag/v0
  uri: 'https://archive.org/download/ElephantsDream/ed_1024.mp4',
  metadata: {
    title: 'Elephants Dream',
    artist: 'Blender Foundation',
    artwork: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/ElephantsDreamPoster.jpg',
  },
};

export const hlsSource: VideoSource = {
  uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8',
  metadata: {
    title: 'Becoming You Trailer',
    artist: 'Apple',
    artwork:
      'https://www.apple.com/tv-pr/shows-and-films/b/becoming-you/images/show-home-graphic-header/4x1/Apple_TV_Becoming_You_key_art_graphic_header_4_1_show_home.jpg.og.jpg?1659052681724',
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
  uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
};

const videoLabels: string[] = [
  'Big Buck Bunny',
  'Elephants Dream',
  'For Bigger Blazes',
  'Becoming You (HLS)',
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
