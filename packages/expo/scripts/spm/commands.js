'use strict';

// A wrapper command may replace this later. build-swiftpm-app-phase.sh (expo-modules-jsi) and
// README.md cannot import it and repeat the text by hand.
const SPM_UPDATE_COMMAND = 'node node_modules/react-native/scripts/setup-apple-spm.js update';

module.exports = { SPM_UPDATE_COMMAND };
