import { NativeModules } from 'react-native';

import { getAssetByID } from './AssetRegistry';
import AssetSourceResolver, { ResolvedAssetSource } from './AssetSourceResolver';

declare let nativeExtensions: any;

let _customSourceTransformer;
let _serverURL: string | undefined | null;
let _scriptURL: string | undefined | null;
let _sourceCodeScriptURL: string | undefined | null;

function getSourceCodeScriptURL(): string | undefined | null {
  if (_sourceCodeScriptURL) {
    return _sourceCodeScriptURL;
  }

  let sourceCode = nativeExtensions && nativeExtensions.SourceCode;
  if (!sourceCode) {
    sourceCode = NativeModules && NativeModules.SourceCode;
  }
  _sourceCodeScriptURL = sourceCode.scriptURL;
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

function _coerceLocalScriptURL(scriptURL: string | undefined | null): string | null {
  if (scriptURL) {
    if (scriptURL.startsWith('assets://')) {
      // android: running from within assets, no offline path to use
      return null;
    }
    scriptURL = scriptURL.substring(0, scriptURL.lastIndexOf('/') + 1);
    if (!scriptURL.includes('://')) {
      // Add file protocol in case we have an absolute file path and not a URL.
      // This shouldn't really be necessary. scriptURL should be a URL.
      scriptURL = 'file://' + scriptURL;
    }
  }
  return null;
}

function getScriptURL(): string | null {
  if (_scriptURL === undefined) {
    _scriptURL = _coerceLocalScriptURL(getSourceCodeScriptURL());
  }
  return _scriptURL;
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

  const resolver = new AssetSourceResolver(getDevServerURL(), getScriptURL(), asset);
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
