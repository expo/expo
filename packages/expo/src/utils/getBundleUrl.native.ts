// Copyright 2015-present 650 Industries. All rights reserved.

/// <reference path="../ts-declarations/react-native.d.ts" />

type NativeSourceCode =
  typeof import('react-native/Libraries/NativeModules/specs/NativeSourceCode').default;

export function getBundleUrl(): string | null {
  // NOTE(@kitten): Requiring this initialises module bridge, which may not be available server-side
  let scriptURL: string | null;
  try {
    const __nativeSourceCode = require('react-native/Libraries/NativeModules/specs/NativeSourceCode');
    const NativeSourceCode: NativeSourceCode = __nativeSourceCode.default ?? __nativeSourceCode;
    scriptURL = NativeSourceCode.getConstants().scriptURL;
  } catch {
    return null;
  }
  if (scriptURL == null) {
    return null;
  }
  if (scriptURL.startsWith('/')) {
    scriptURL = `file://${scriptURL}`;
  }
  const url = new URL(scriptURL);
  return url.toString();
}
