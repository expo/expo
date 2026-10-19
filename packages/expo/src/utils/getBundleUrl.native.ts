// Copyright 2015-present 650 Industries. All rights reserved.

export function getBundleUrl(): string | null {
  // NOTE(@kitten): Requiring this initialises module bridge, which may not be available server-side
  let scriptURL: string | null;
  try {
    const { NativeSourceCode } = require('react-native/unstable-internals-do-not-use');
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
