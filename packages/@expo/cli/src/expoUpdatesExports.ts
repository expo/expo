// NOTE(@kitten): These are currently only used by expo-updates (expo-updates/utols/src/createManifestForBuildAsync)
// They're re-exported via `expo/internal/cli-unstable-expo-updates-exports` to establish a valid dependency chain
// NOTE for Expo Maintainers: Do not add to this file. We want to remove this
export { drawableFileTypes } from './export/metroAssetLocalPath';
export {
  createMetroServerAndBundleRequestAsync,
  exportEmbedAssetsAsync,
} from './export/embed/exportEmbedAsync';
