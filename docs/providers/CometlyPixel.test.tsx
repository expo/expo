/* oxlint-disable testing-library/no-node-access */
import { render } from '@testing-library/react';

import { CometlyPixel, injectCometlyPixel, shouldLoadCometlyPixel } from './CometlyPixel';
import { cometlyPixelHost, cometlyPixelScriptUrl } from './cometly-constants';

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

describe(injectCometlyPixel, () => {
  afterEach(() => {
    document.getElementById('cometly-pixel')?.remove();
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
