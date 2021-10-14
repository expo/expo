import { NativeModules } from 'react-native';

import { getAssetByID } from './AssetRegistry';
import AssetSourceResolver, { ResolvedAssetSource } from './AssetSourceResolver';

declare let nativeExtensions: { SourceCode?: { scriptURL: string } } | undefined;

let _customSourceTransformer;
let _serverURL: string | undefined | null;
let _sourceCodeScriptURL: string | undefined | null;

function getSourceCodeScriptURL(): string | undefined | null {
  if (_sourceCodeScriptURL) {
    return _sourceCodeScriptURL;
  }

  let sourceCode = typeof nativeExtensions !== 'undefined' ? nativeExtensions.SourceCode : null;
  if (!sourceCode) {
    sourceCode = NativeModules?.SourceCode;
  }
  _sourceCodeScriptURL = sourceCode?.scriptURL;
  return _sourceCodeScriptURL;
}

function getDevServerURL(): string | null {
  if (_serverURL === undefined) {
    const sourceCodeScriptURL = getSourceCodeScriptURL();
    const match = sourceCodeScriptURL && sourceCodeScriptURL.match(/^https?:\/\/.*?\//);
    if (match) {
      // jsBundle was loaded from network
      _serverURL = match[0];
    } else {
      // jsBundle was loaded from file
      _serverURL = null;
    }
  }
  return _serverURL;
}

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

  const resolver = new AssetSourceResolver(getDevServerURL(), null, asset);
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
