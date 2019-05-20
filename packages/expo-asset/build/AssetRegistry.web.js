export function registerAsset(asset) {
    return _assets.push(asset);
}
export function getAssetByID(assetId) {
    return _assets[assetId - 1];
}
const _assets = [];
//# sourceMappingURL=AssetRegistry.web.js.map