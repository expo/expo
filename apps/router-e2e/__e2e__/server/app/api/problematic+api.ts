import { ExpoResponse } from 'expo-router/server';

export function GET(): ExpoResponse {
  throw new Error('This is a test error');
}
