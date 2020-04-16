import { Platform } from 'react-native';

export function getGUID(): string {
  const map = {
    ios: '629683148649-rqd64l050fr7nvaottj8rhlp08q4t7da',
    android: '629683148649-8ls3mbtakmkqe2qqt9tsjugbemgrjhth',
  };
  const GUID = Platform.select<string>(map);
  if (!GUID)
    throw new Error(
      `No valid GUID for Expo client on platform: ${
        Platform.OS
      }. Supported native platforms are currently: ${Object.keys(map).join(', ')}`
    );
  return GUID;
}
