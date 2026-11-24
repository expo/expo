// `src` tests target iOS + Android only (react-native-web's `useColorScheme` can't be spied on),
// so keep that platform set; `plugin` runs as its own project.
module.exports = require('@expo/internal-scripts/createCompositeJestPreset')(
  __dirname,
  ['plugin'],
  {
    srcProjects: [{ preset: 'jest-expo/ios' }, { preset: 'jest-expo/android' }],
  }
);
