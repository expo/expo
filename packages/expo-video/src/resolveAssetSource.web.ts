import { getAssetByID } from '@react-native/assets-registry/registry';

// Minimal `resolveAssetSource` implementation for video on web, based on the version from `expo-asset`
export default function resolveAssetSource(assetId: number): { uri: string } | null {
  const asset = getAssetByID(assetId);
  if (!asset) {
    return null;
  }
  const type = !asset.type ? '' : `.${asset.type}`;
  const assetPath = __DEV__
    ? asset.httpServerLocation + '/' + asset.name + type
    : asset.httpServerLocation.replace(/\.\.\//g, '_') + '/' + asset.name + type;

  // The base has to have a valid syntax but doesn't matter - it's removed below as we use a relative path
  const fromUrl = new URL(assetPath, 'https://expo.dev');
  return { uri: fromUrl.toString().replace(fromUrl.origin, '') };
}
