import { UnavailabilityError } from 'expo-errors';

import ExpoBluetooth from './ExpoBluetooth';

export function invariantUUID(uuid: string | undefined) {
  if (uuid === undefined || (typeof uuid !== 'string' && uuid === '')) {
    throw new Error('expo-bluetooth: Invalid UUID provided');
  }
}

export function invariantAvailability(methodName: string) {
  if (!(methodName in ExpoBluetooth) || !(ExpoBluetooth[methodName] instanceof Function)) {
    throw new UnavailabilityError('expo-bluetooth', methodName);
  }
}
