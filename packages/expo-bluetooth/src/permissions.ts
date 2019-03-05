import { Platform } from 'expo-core';
import * as Permissions from 'expo-permissions';
import { PermissionStatus } from 'expo-permissions/src/Permissions.types';

// TODO: Bacon maybe move to `.android`
export async function requestPermissionAsync(): Promise<{ status: PermissionStatus }> {
  if (Platform.OS === 'android') {
    return await Permissions.askAsync(Permissions.LOCATION);
  }
  return { status: PermissionStatus.GRANTED };
}

export async function getPermissionAsync(): Promise<{ status: PermissionStatus }> {
  if (Platform.OS === 'android') {
    return await Permissions.getAsync(Permissions.LOCATION);
  }
  return { status: PermissionStatus.GRANTED };
}
