// NOTE(@kitten): These are currently only used by expo-updates (expo-updates/utols/src/createManifestForBuildAsync)
// They're re-exported via `expo/internal/cli-exports` to establish a valid dependency chain
export { drawableFileTypes } from './export/metroAssetLocalPath';
export {
  createMetroServerAndBundleRequestAsync,
  exportEmbedAssetsAsync,
} from './export/embed/exportEmbedAsync';
