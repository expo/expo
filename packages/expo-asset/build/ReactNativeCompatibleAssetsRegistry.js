let registry = null;
try {
    registry = require('@react-native/assets-registry/registry');
}
catch { }
if (!registry) {
    try {
        registry = require('@react-native/assets/registry');
    }
    catch { }
}
if (!registry) {
    throw new Error('Cannot import `@react-native/assets-registry` or `@react-native/assets` package');
}
const registerAssetImport = registry.registerAsset;
const getAssetByIDImport = registry.getAssetByID;
export { registerAssetImport as registerAsset };
export { getAssetByIDImport as getAssetByID };
export default registry;
//# sourceMappingURL=ReactNativeCompatibleAssetsRegistry.js.map