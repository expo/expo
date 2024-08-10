// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/index.js (entry point)
declare module '@expo/metro-config/metro-transform-plugins' {
  declare async function asd(test = true): void;

  export = asd;
}
