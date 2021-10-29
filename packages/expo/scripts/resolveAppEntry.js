const { resolveEntryPoint } = require('@expo/config/paths');
const path = require('path');

// A script for resolving the main JS file for an Expo project
// uses the same resolution algorithm as expo-cli for expo start.
module.exports = (projectRoot, { platform, relative }) => {
  const entry = resolveEntryPoint(projectRoot, { platform });

  if (!entry) return null;

  return relative ? path.relative(projectRoot, entry) : entry;
};
