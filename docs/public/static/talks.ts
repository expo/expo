export const TALKS = [
  {
    title: "Keynote: community & workflows",
    event: 'App.js Conf 2023',
    description: "Charlie Cheever, James Ide",
    videoId: "xHMu4oT6-SQ",
    home: true,
  },
  {
    title: "EAS: Iterate with confidence",
    event: 'App.js Conf 2023',
    description: "Jon Samp",
    videoId: "LTui_5dqXyM",
    home: true,
  },
  {
    title: "Expo Router: Write Once, Route Everywhere",
    event: 'App.js Conf 2023',
    description: "Evan Bacon",
    videoId: "608r8etX_cg",
    home: true,
  },
  {
    title: "Debugging should be easier",
    event: 'App.js Conf 2023',
    description: "Cedric van Putten",
    videoId: "sRLunWEzwHI",
    home: true,
  },
  {
    title: 'React Native on Linux with the New Architecture',
    event: 'App.js Conf 2023',
    description: 'Kudo Chien',
    videoId: 'Ca4SNa6kL_M',
  },
  {
    title: 'Not your grandparents’ Expo',
    event: 'Chain React 2023',
    description: 'Keith Kurak',
    videoId: 'YufZFVL-BJc',
  },
  {
    title: 'Expo keynote',
    event: 'App.js Conf 2022',
    description: 'Charlie Cheever, Evan Bacon, Tomasz Sapeta',
    videoId: 'ObeaMae0hug',
  },
  {
    title: 'The Hidden Features from V8 to Boost React Native',
    event: 'App.js Conf 2022',
    description: 'Kudo Chien',
    videoId: '6e0b2O6NRz4',
  },
  {
    title: 'Publish Updates with Expo and React Native',
    event: 'App.js Conf 2022',
    description: 'Quinlan Jung',
    videoId: 'd0wzwVp8dug',
  },
  {
    title: 'Limitless App Development',
    event: 'React Advanced 2021',
    description: 'Evan Bacon',
    videoId: 'YjJ0NG9MFkg',
  },
] as Talk[];

export const PODCASTS = [
  {
    title: 'Expo Router & Universal React Native Apps',
    event: 'Rocket Ship #028',
    description: "Evan Bacon",
    videoId: "qsRI8T5V99g",
    link: "https://podcast.galaxies.dev/episodes/028-expo-router-universal-react-native-apps-with-evan-bacon"
  },
  {
    title: 'Expo, build react-native app quicker',
    event: 'devtools.fm #84',
    description: "Evan Bacon",
    videoId: "Hnh5ew0jfKQ",
  },
  {
    title: 'EAS, Expo Prebuild & SDK 50',
    event: 'Rocket Ship #025',
    description: "Kadi Kraman",
    videoId: "pPQNDHCOoAE",
    link: "https://podcast.galaxies.dev/episodes/025-eas-expo-prebuild-sdk-50-with-kadi-kraman"
  },
  {
    title: 'Improving Developer Experience with Expo',
    event: 'The React Native Show #28',
    description: "Jon Samp, Cedric van Putten",
    videoId: "4PPDAvgfLHk",
    thumbnail: "4PPDAvgfLHk.webp",
  },
  {
    title: 'Expo Launch Party',
    event: 'React Native Radio #277',
    description: "Doug Lowder, Gabriel Donadel",
    thumbnail: "rnr-277.jpg",
    link: "https://reactnativeradio.com/episodes/rnr-277-expo-launch-party"
  },
  {
    title: 'Expo Router with Evan Bacon',
    event: 'React Native Radio #256',
    description: "Evan Bacon",
    thumbnail: "rnr-256.jpg",
    link: "https://reactnativeradio.com/episodes/rnr-256-expo-router-with-evan-bacon"
  },
  {
    title: 'Expo, Router & Debugging',
    event: 'Rocket Ship #007',
    description: "Cedric van Putten",
    videoId: "yK0UDiLjxNY",
    link: "https://podcast.galaxies.dev/episodes/007-expo-router-debugging-with-cedric-van-putten"
  }
] as Talk[]

export type Talk = {
  title: string;
  event: string;
  description: string;
  videoId: string;
  home?: boolean;
  thumbnail?: string;
  link?: string;
}
