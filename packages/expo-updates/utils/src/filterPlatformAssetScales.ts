// copied from https://github.com/react-native-community/cli/blob/48136adfb814d335e957e22129d049c4a05c8759/packages/cli/src/commands/bundle/filterPlatformAssetScales.ts

const ALLOWED_SCALES: { [key: string]: number[] } = {
  ios: [1, 2, 3],
};

export function filterPlatformAssetScales(platform: string, scales: number[]): number[] {
  const whitelist = ALLOWED_SCALES[platform];
  if (!whitelist) {
    return scales;
  }
  const result = scales.filter((scale) => whitelist.indexOf(scale) > -1);
  if (result.length === 0 && scales.length > 0) {
    // No matching scale found, but there are some available. Ideally we don't
    // want to be in this situation and should throw, but for now as a fallback
    // let's just use the closest larger image
    const maxScale = whitelist[whitelist.length - 1];
    for (const scale of scales) {
      if (scale > maxScale) {
        result.push(scale);
        break;
      }
    }

    // There is no larger scales available, use the largest we have
    if (result.length === 0) {
      result.push(scales[scales.length - 1]);
    }
  }
  return result;
}
