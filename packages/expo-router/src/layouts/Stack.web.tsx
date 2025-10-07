import { Screen } from '../views/Screen';

const Stack = (() => {
  if (process.env.EXPO_PUBLIC_EXPERIMENTAL_WEB_MODAL === '1') {
    return require('./ExperimentalModalStack').default;
  }
  return require('./BaseStack').default;
})();

Stack.Screen = Screen;

export { Stack };

export default Stack;
