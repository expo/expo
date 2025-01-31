// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*"],
  }
];
