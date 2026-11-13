throw new Error(
  'Cannot import `expo-app-metrics`, because its code moved to `expo-observe`. ' +
    'Import the API from `expo-observe` and the debug-only APIs from `expo-observe/debug`. ' +
    'Then remove `expo-app-metrics` from your dependencies.'
);
