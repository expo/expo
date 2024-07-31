if (process.env.EXPO_PUBLIC_USE_RSC) {
  require('expo-router/entry-rsc');
} else {
  require('expo-router/entry');
}
