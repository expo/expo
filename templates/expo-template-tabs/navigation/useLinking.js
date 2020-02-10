import { useLinking } from '@react-navigation/native';

export default function(containerRef) {
  const { getInitialState } = useLinking(containerRef, {
    prefixes: [],
    config: {
      Root: {
        path: 'root',
        screens: {
          Home: 'home',
          Links: 'links',
          Settings: 'settings',
        },
      },
    },
  });
  return getInitialState();
}
