import { getAssetByID } from '@react-native/assets-registry/registry';
export default function resolveAssetSource(assetId) {
    const asset = getAssetByID(assetId);
    if (!asset) {
        return null;
    }
    const type = !asset.type ? '' : `.${asset.type}`;
    const assetPath = __DEV__
        ? asset.httpServerLocation + '/' + asset.name + type
        : asset.httpServerLocation.replace(/\.\.\//g, '_') + '/' + asset.name + type;
    const fromUrl = new URL(assetPath, 'https://expo.dev');
    return { uri: fromUrl.toString().replace(fromUrl.origin, '') };
}
//# sourceMappingURL=resolveAssetSource.web.js.map