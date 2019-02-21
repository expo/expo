import { UnavailabilityError } from 'expo-errors';
var AndroidAssetSuffix;
(function (AndroidAssetSuffix) {
    AndroidAssetSuffix["LDPI"] = "ldpi";
    AndroidAssetSuffix["MDPI"] = "mdpi";
    AndroidAssetSuffix["HDPI"] = "hdpi";
    AndroidAssetSuffix["XHDPI"] = "xhdpi";
    AndroidAssetSuffix["XXHDPI"] = "xxhdpi";
    AndroidAssetSuffix["XXXHDPI"] = "xxxhdpi";
})(AndroidAssetSuffix || (AndroidAssetSuffix = {}));
export function getAndroidAssetSuffix(scale) {
    throw new UnavailabilityError('react-native', 'getAndroidAssetSuffix');
}
export function getAndroidResourceFolderName(asset, scale) {
    throw new UnavailabilityError('react-native', 'getAndroidResourceFolderName');
}
export function getAndroidResourceIdentifier(asset) {
    throw new UnavailabilityError('react-native', 'getAndroidResourceIdentifier');
}
export function getBasePath({ httpServerLocation }) {
    if (httpServerLocation[0] === '/') {
        return httpServerLocation.substr(1);
    }
    return httpServerLocation;
}
//# sourceMappingURL=assetPathUtils.web.js.map