import * as DevMenuInternal from '../DevMenuInternal';
import * as DevMenuWebBrowser from '../DevMenuWebBrowser';

// const host = 'exp.host';
// const origin = `https://${host}`;
const websiteOrigin = 'https://expo.dev';

export async function openAuthSessionAsync(type: 'signup' | 'login') {
  console.log({ DevMenuInternal })
  const scheme = await DevMenuInternal.getAuthSchemeAsync();
  const redirectBase = `${scheme}://auth`;
  const authSessionURL = `${websiteOrigin}/${type}?app_redirect_uri=${encodeURIComponent(
    redirectBase
  )}`;

  console.log({ authSessionURL });

  const result = await DevMenuWebBrowser.openAuthSessionAsync(authSessionURL, redirectBase);

  if (result.type === 'success') {
    // @ts-ignore
    const resultURL = url.parse(result.url, true);
    const sessionSecret = decodeURIComponent(resultURL.query['session_secret'] as string);
    return sessionSecret;
  }

  throw Error('Login failed');
}
