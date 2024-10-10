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
  },
};

const elephantsDreamSource: VideoSource = {
  uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  metadata: {
    title: 'Elephants Dream',
    artist: 'Blender Foundation',
  },
};

const forBiggerBlazesSource: VideoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

// source: https://reference.dashif.org/dash.js/latest/samples/drm/widevine.html
const androidDrmSource: VideoSource = {
  uri: 'https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest.mpd',
  drm: {
    type: 'widevine',
    headers: {
      'X-AxDRM-Message':
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjMzNjRlYjUtNTFmNi00YWUzLThjOTgtMzNjZWQ1ZTMxYzc4IiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImtleXMiOlt7ImlkIjoiOWViNDA1MGQtZTQ0Yi00ODAyLTkzMmUtMjdkNzUwODNlMjY2IiwiZW5jcnlwdGVkX2tleSI6ImxLM09qSExZVzI0Y3Iya3RSNzRmbnc9PSJ9XX19.4lWwW46k-oWcah8oN18LPj5OLS5ZU-_AQv7fe0JhNjA',
    },
    licenseServer: 'https://drm-widevine-licensing.axtest.net/AcquireLicense',
  },
};

const videoLabels: string[] = [
  'Big Buck Bunny',
  'Elephants Dream',
  'For Bigger Blazes',
  'Cute Doggo (local video)',
];
const videoSources: VideoSource[] = [
  bigBuckBunnySource,
  elephantsDreamSource,
  forBiggerBlazesSource,
  localVideoSource,
];

export {
  bigBuckBunnySource,
  forBiggerBlazesSource,
  elephantsDreamSource,
  androidDrmSource,
  videoLabels,
  videoSources,
};
