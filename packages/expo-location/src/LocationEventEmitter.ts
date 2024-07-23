import { LegacyEventEmitter } from 'expo/internal';

import ExpoLocation from './ExpoLocation';

export const LocationEventEmitter = new LegacyEventEmitter(ExpoLocation);
