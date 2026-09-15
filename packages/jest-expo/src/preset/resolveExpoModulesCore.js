'use strict';

const path = require('path');

function resolveExpoModulesCoreModuleId(
  moduleId = 'expo-modules-core',
  resolver = require.resolve
) {
  try {
    return resolver(moduleId);
  } catch {}

  try {
    const expoPackageJsonPath = resolver('expo/package.json');
    return resolver(moduleId, {
      paths: [path.dirname(expoPackageJsonPath)],
    });
  } catch {}

  return moduleId;
}

module.exports = {
  resolveExpoModulesCoreModuleId,
};
