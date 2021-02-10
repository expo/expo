import './Expo.fx';

import * as Logs from './logs/Logs';

export { Logs };
export { default as apisAreAvailable } from './apisAreAvailable';
export { default as registerRootComponent } from './launch/registerRootComponent';

// @ts-ignore
export { Linking, Notifications } from './deprecated';
