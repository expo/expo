export default function resolveAssetSource(source: number) {
  console.warn('[expo-image]: Using numbers as an image source is not supported on Web');
  return null;
}
