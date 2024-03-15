export const CODE_FONT =
  process.env.EXPO_OS === 'ios'
    ? // iOS
      'Courier New'
    : process.env.EXPO_OS === 'android'
      ? // Android
        'monospace'
      : // Default
        'Courier';
