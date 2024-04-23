import { UnavailabilityError } from 'expo-modules-core';

import { Window, DatabaseCallback } from './SQLite.types';

export function openDatabase(
  name: string,
  version: string = '1.0',
  description: string = name,
  size: number = 1,
  callback?: DatabaseCallback
) {
  const typedWindow: Window = window as Window;
  if ('openDatabase' in typedWindow && typedWindow.openDatabase) {
    return typedWindow.openDatabase(name, version, description, size, callback);
  }
  throw new UnavailabilityError('window', 'openDatabase');
}
