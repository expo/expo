import { ExpoResponse } from 'expo-router/server';

export function GET(): ExpoResponse {
  return ExpoResponse.json({
    var: process.env.TEST_SECRET_KEY,
  });
}
