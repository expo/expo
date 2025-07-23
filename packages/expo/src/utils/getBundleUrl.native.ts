// Copyright 2015-present 650 Industries. All rights reserved.

/// <reference path="../ts-declarations/react-native.d.ts" />

import SourceCode from 'react-native/Libraries/NativeModules/specs/NativeSourceCode';

export function getBundleUrl(): string | null {
  let scriptURL = SourceCode.getConstants().scriptURL;
  if (scriptURL == null) {
    return null;
  }
  if (scriptURL.startsWith('/')) {
    scriptURL = `file://${scriptURL}`;
  }
  const url = new URL(scriptURL);
  return url.toString();
}
