/* oxlint-disable testing-library/no-node-access */
import { jest } from '@jest/globals';
import { render } from '@testing-library/react';

import {
  CometlyPixel,
  getSharedCookieDomain,
  injectCometlyPixel,
  shouldLoadCometlyPixel,
} from './CometlyPixel';
import {
  cometlyPixelHost,
  cometlyPixelScriptUrl,
  cometlyTokenCookieName,
  cometlyTokenStorageKey,
} from './cometly-constants';

function getInjectedScript() {
  const script = document.getElementById('cometly-pixel');
  if (!(script instanceof HTMLScriptElement)) {
    throw new Error('Cometly pixel script was not injected');
  }
  return script;
}

function getCometTokenCookie() {
  return document.cookie.match(/(?:^|; )comet_token=([^;]*)/)?.[1];
}

const allGranted = { hasConsented: true, hasMarketing: true };

describe(shouldLoadCometlyPixel, () => {
  it('loads on the production docs host with marketing consent', () => {
    expect(shouldLoadCometlyPixel({ host: cometlyPixelHost, ...allGranted })).toBe(true);
  });

  it('does not load on localhost', () => {
    expect(shouldLoadCometlyPixel({ host: 'localhost:3002', ...allGranted })).toBe(false);
  });

  it('does not load on Cloudflare Pages preview hosts', () => {
    expect(shouldLoadCometlyPixel({ host: 'pr-1234.expo-docs.pages.dev', ...allGranted })).toBe(
      false
    );
  });

  it('does not load before the user answers the consent banner', () => {
    expect(
      shouldLoadCometlyPixel({ host: cometlyPixelHost, hasConsented: false, hasMarketing: false })
    ).toBe(false);
  });

  it('does not load when marketing consent is declined', () => {
    expect(
      shouldLoadCometlyPixel({ host: cometlyPixelHost, hasConsented: true, hasMarketing: false })
    ).toBe(false);
  });
});

describe(getSharedCookieDomain, () => {
  it('shares the cookie between the apex domain and its subdomains', () => {
    expect(getSharedCookieDomain('expo.dev')).toBe('.expo.dev');
    expect(getSharedCookieDomain('docs.expo.dev')).toBe('.expo.dev');
  });
});

describe(injectCometlyPixel, () => {
  afterEach(() => {
    document.getElementById('cometly-pixel')?.remove();
    localStorage.clear();
    document.cookie = `${cometlyTokenCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    delete window.cometlyDomainOverrides;
    delete window.cometToken;
  });

  it('disables link decoration before the script can run', () => {
    let overridesAtAppend: string[] | undefined;
    const appendChild = jest.spyOn(document.head, 'appendChild').mockImplementation(node => {
      overridesAtAppend = window.cometlyDomainOverrides;
      return node;
    });

    injectCometlyPixel();

    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(overridesAtAppend).toEqual([]);
    appendChild.mockRestore();
  });

  it('seeds the pixel token from the shared cookie before the script can run', () => {
    document.cookie = `${cometlyTokenCookieName}=shared-token; path=/`;
    let storedTokenAtAppend: string | null = null;
    const appendChild = jest.spyOn(document.head, 'appendChild').mockImplementation(node => {
      storedTokenAtAppend = localStorage.getItem(cometlyTokenStorageKey);
      return node;
    });

    injectCometlyPixel();

    expect(storedTokenAtAppend).toBe('shared-token');
    appendChild.mockRestore();
  });

  it('publishes the script token to the shared cookie once the script loads', () => {
    window.cometToken = () => 'minted-token';

    injectCometlyPixel();
    getInjectedScript().onload?.(new Event('load'));

    expect(getCometTokenCookie()).toBe('minted-token');
  });

  it('falls back to the stored token when the script exposes no getter', () => {
    localStorage.setItem(cometlyTokenStorageKey, 'stored-token');

    injectCometlyPixel();
    getInjectedScript().onload?.(new Event('load'));

    expect(getCometTokenCookie()).toBe('stored-token');
  });

  it('appends the pixel script to the document head', () => {
    injectCometlyPixel();

    const script = document.head.querySelector<HTMLScriptElement>('script#cometly-pixel');
    expect(script).not.toBeNull();
    expect(script?.src).toBe(cometlyPixelScriptUrl);
  });

  it('appends the script only once', () => {
    injectCometlyPixel();
    injectCometlyPixel();

    expect(document.querySelectorAll('script#cometly-pixel')).toHaveLength(1);
  });
});

describe(CometlyPixel, () => {
  it('renders nothing and does not inject the script without consent', () => {
    const { container } = render(<CometlyPixel />);

    expect(container).toBeEmptyDOMElement();
    expect(document.getElementById('cometly-pixel')).toBeNull();
  });
});
