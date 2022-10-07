// tree-shaken side effects
import './reanimated2/js-reanimated/global';

export * from './reanimated2';
export * as default from './Animated'; // If this line fails, you probably forgot some installation steps. Check out the installation guide here: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation/ 1) Make sure reanimated's babel plugin is installed in your babel.config.js (you should have 'react-native-reanimated/plugin' listed there - also see the above link for details) 2) Make sure you reset build cache after updating the config, run: yarn start --reset-cache
