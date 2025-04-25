import { getAssetByID } from '@react-native/assets-registry/registry';

import AssetSourceResolver, { ResolvedAssetSource } from './AssetSourceResolver.web';

let _customSourceTransformer: undefined | ((resolver: AssetSourceResolver) => ResolvedAssetSource);

export function setCustomSourceTransformer(
  transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource
): void {
  _customSourceTransformer = transformer;
}

/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
export default function resolveAssetSource(source: any): ResolvedAssetSource | undefined {
  if (typeof source === 'object') {
    return source;
  }

  const asset = getAssetByID(source);
  if (!asset) {
    return undefined;
  }

  const resolver = new AssetSourceResolver('https://expo.dev', null, asset);
  if (_customSourceTransformer) {
    return _customSourceTransformer(resolver);
  }
  return resolver.defaultAsset();
}

Object.defineProperty(resolveAssetSource, 'setCustomSourceTransformer', {
  get() {
    return setCustomSourceTransformer;
  },
});

export const { pickScale } = AssetSourceResolver;
