import Constants from 'expo-constants';
if (__DEV__) {
    if (Constants.manifest?.experiments?.redesignedLogBox) {
        console.warn('LogBox is enabled by default on SDK 39 and higher. You can now remove the experiments.redesignedLogBox from your app configuration to get rid of this warning.');
    }
}
//# sourceMappingURL=LogBox.fx.expo.js.map