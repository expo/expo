import Constants from 'expo-constants';

if (__DEV__) {
  if (Constants.manifest?.experiments?.turboModules) {
    console.log(
      '\nThanks for enabling Turbo Modules and trying out this new feature! Turbo Modules do not currently support remote debugging, so if you want to use remote debugging, set `turboModules` to false in app.json.\n'
    );
  }
}
