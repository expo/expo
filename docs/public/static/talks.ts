export default [
  {
    title: "Keynote: community & workflows",
    event: 'App.js Conf 2023',
    description: "Charlie Cheever & James Ide",
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

export type Talk = {
  title: string;
  event: string;
  description: string;
  videoId: string;
  home?:boolean
}
