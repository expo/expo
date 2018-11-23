import { Asset } from 'expo';
import AssetUtils from 'expo-asset-utils';
const resolveAsset = async (fileReference) => {
    const urls = [];
    if (Array.isArray(fileReference)) {
        for (let file of fileReference) {
            const asset = await AssetUtils.resolveAsync(file);
            urls.push(asset);
        }
    }
    else {
        const asset = await AssetUtils.resolveAsync(fileReference);
        urls.push(asset);
    }
    return urls;
};
export async function stringFromAsset(asset) {
    let url;
    if (asset instanceof Asset) {
        if (!asset.localUri) {
            await asset.downloadAsync();
        }
        if (!asset.localUri) {
            console.log("Error: You tried to download an Expo.Asset and for some reason it didn't cache... Known reasons are: it's an .mtl file");
        }
        url = asset.localUri || asset.uri;
    }
    else if (typeof asset === 'string') {
        url = asset;
    }
    return url;
}
export default resolveAsset;
//# sourceMappingURL=index.js.map