'use strict';

const { createBlacklist } = require(`./react-native/node_modules/metro`);
const path = require('path');

const sharedLibraryBlacklist = [
  /docs\/.*/,
  /node_modules\/react-native-sortable-list-view\/.*/,
  /node_modules\/react-native-swipe-actions\/.*/,
  /node_modules\/react-native-action-sheet\/.*/,
  /node_modules\/@expo\/react-native-touchable-native-feedback-safe\/.*/,
  /node_modules\/@expo\/sentry-utils\/.*/,
  /node_modules\/@expo\/with-custom-font\/.*/,
  /node_modules\/@expo\/vector-icons\/.*/,
  /node_modules\/@expo\/samples\/.*/,
];

module.exports = {
  blacklistForApp(appName, sdkVersion, extra) {
    const universePath = path.join(__dirname, '..');

    let regexes = [
      // Ignore any app that isn't "appName"
      new RegExp(`^${escapeRegExp(universePath)}/(apps/(?!${escapeRegExp(appName)})).*$`),
      // Ignore anything in the Expo, dev, server, and tools folders
      new RegExp(`^${escapeRegExp(universePath)}/(dev|exponent|server|tools)/.*`),
      new RegExp(`^${escapeRegExp(universePath)}/apps/.*/node_modules/(react-native|react)/.*`),
      new RegExp(
        `^${escapeRegExp(universePath)}/libraries/.*/node_modules/(react-native|react)/.*`
      ),
      ...sharedLibraryBlacklist,
      ...extra,
    ];

    return createBlacklist(regexes);
  },
};

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
