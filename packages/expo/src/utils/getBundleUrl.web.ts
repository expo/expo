// Copyright 2015-present 650 Industries. All rights reserved.

export function getBundleUrl(): string | null {
  let scriptURL: string | null | undefined = null;

  if (typeof window === 'undefined') {
    // For server runtime, we use the filename of the current script
    // @ts-ignore The react-native tsconfig doesn't support CJS
    scriptURL = 'file://' + __filename;
  } else {
    // TODO: Try to support `import.meta.url` when the ecosystem supports ESM,
    // and jest doesn't throw SyntaxError when accessing `import.meta`.
    scriptURL = (document.currentScript as HTMLScriptElement)?.src;
  }

  if (scriptURL == null) {
    return null;
  }
  const url = new URL(scriptURL);
  return `${url.protocol}//${url.host}${url.pathname}`;
}
