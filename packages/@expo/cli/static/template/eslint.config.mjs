// https://docs.expo.dev/guides/using-eslint/
import expoConfig from "eslint-config-expo";

export default [
  ...expoConfig,
  {
    ignores: ["dist/*"],
  }
];
