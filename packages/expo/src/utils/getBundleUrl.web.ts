// Copyright 2015-present 650 Industries. All rights reserved.

// `document.currentScript` is only set during synchronous script execution, so we capture its URL
// at module load; reading it later (effect, async, dynamic import) would see `null`.
const initialScriptURL: string | null =
  typeof window !== 'undefined' ? (document.currentScript as HTMLScriptElement)?.src : null;

export function getBundleUrl(): string | null {
  let scriptURL: string | null = initialScriptURL;

  if (typeof window === 'undefined') {
    // For server runtime, we use the filename of the current script
    // @ts-expect-error The react-native tsconfig doesn't support CJS
    scriptURL = 'file://' + __filename;
  }

  if (scriptURL == null) {
    return null;
  }

  const url = new URL(scriptURL);
  return `${url.protocol}//${url.host}${url.pathname}`;
}
