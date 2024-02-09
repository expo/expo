import { ExpoResponse } from 'expo-router/server';

export function POST() {
  return ExpoResponse.json({ foo: 'bar' });
}
