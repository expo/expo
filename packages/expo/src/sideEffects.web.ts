import './environment/validate';
import './environment/logging';

// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset';

import { installWebGeolocationPolyfill } from 'expo-location';
// polyfill navigator.geolocation
installWebGeolocationPolyfill();
