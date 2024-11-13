import { VideoSource } from 'expo-video';

const localVideoId: VideoSource = require('../../../assets/videos/ace.mp4') as number;

const localVideoSource: VideoSource = {
  assetId: localVideoId,
  metadata: {
    title: 'Cute Doggo',
    artist: 'Doggo',
  },
};

const bigBuckBunnySource: VideoSource = {
  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  metadata: {
    title: 'Big Buck Bunny',
    artist: 'The Open Movie Project',
    artwork:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1200px-Big_buck_bunny_poster_big.jpg',
  },
};

const elephantsDreamSource: VideoSource = {
  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  metadata: {
    title: 'Elephants Dream',
    artist: 'Blender Foundation',
    artwork: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/ElephantsDreamPoster.jpg',
  },
};

export const hlsSource: VideoSource = {
  uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  metadata: {
    title: 'Sintel',
    artist: 'Blender Foundation',
    artwork:
      'https://bookshow.blurb.com/bookshow/cache/P14464689/md/cover_2.jpeg?access_key=a096a6a606efe615ac87edc04766c661',
  },
};

export const nullSource: VideoSource = {
  metadata: {
    title: 'Null Source',
    artist: '-',
  },
};

const forBiggerBlazesSource: VideoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

// source: https://reference.dashif.org/dash.js/latest/samples/drm/widevine.html
const androidDrmSource: VideoSource = {
  uri: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
};

const videoLabels: string[] = [
  'Big Buck Bunny',
  'Elephants Dream',
  'For Bigger Blazes',
  'Sintel (HLS)',
  'Cute Doggo (local video)',
  'Null Source',
];
const videoSources: VideoSource[] = [
  bigBuckBunnySource,
  elephantsDreamSource,
  forBiggerBlazesSource,
  hlsSource,
  localVideoSource,
  nullSource,
];

export {
  bigBuckBunnySource,
  forBiggerBlazesSource,
  elephantsDreamSource,
  androidDrmSource,
  videoLabels,
  videoSources,
};
