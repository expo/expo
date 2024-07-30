if (process.env.EXPO_PUBLIC_USE_RSC) {
  require('expo-router/entry-rsc');
} else {
  // TODO: Need some way to not bundle the routes in RSC mode.
  // require('expo-router/entry');
}
