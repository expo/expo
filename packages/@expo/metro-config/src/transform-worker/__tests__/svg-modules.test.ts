import { fs, vol } from 'memfs';

import { convertSvgModule, matchSvgModule } from '../svg-modules';

const fixtureA = `
<svg viewBox="0 0 24 24">
<path d="M11 1.28v.09c0 1.79 0 3.53-.829 5.18-.42-.78-1.061-1.36-1.707-1.94l-.268-.24c-.501 1-1.151 1.98-1.807 2.97C4.959 9.5 3.5 11.7 3.5 14.25c0 2.52.949 4.55 2.538 5.94 1.437 1.26 3.334 1.94 5.378 2.04.122.01.539.02.584.02 4.615 0 8.5-3.37 8.5-8C20.5 8.29 15.797 4 11 1.28zm2.534 18.08c-.521.56-1.144.87-1.681.89-.111 0-.221-.01-.331-.01-.454-.05-.684-.23-.82-.41-.192-.24-.313-.64-.313-1.14 0-.75.362-1.26 1.214-2.02.166-.14.35-.3.548-.46.47-.4 1.017-.86 1.56-1.41l.031.07c.35.83.647 1.78.647 2.54 0 .65-.317 1.38-.855 1.95zm2.572-.42c.18-.48.283-1 .283-1.53 0-1.17-.429-2.43-.804-3.32-.194-.46-.388-.85-.533-1.13-.073-.14-1.02-1.78-1.02-1.78l-.901 1.23c-.678.92-1.425 1.55-2.18 2.19-.224.19-.449.38-.673.58-.94.83-1.889 1.85-1.889 3.51 0 .22.014.44.047.67C6.673 18.38 5.5 16.6 5.5 14.25c0-2.01 1.133-3.61 2.246-5.18.284-.4.568-.8.831-1.21.419.89.419 2.18.173 3.08l.117-.11c1.971-1.7 3.514-3.03 3.969-6.06.632.47 1.415 1.12 2.195 1.93 1.79 1.84 3.469 4.42 3.469 7.55 0 1.92-.921 3.61-2.394 4.69z"></path>
</svg>
    `;

describe(matchSvgModule, () => {
  [
    'foo.module.svg',
    'foo.module.native.svg',
    // technically works but isn't platform-specific
    'foo.native.module.svg',
  ].forEach((filename) => {
    it(`matches ${filename}`, () => {
      expect(matchSvgModule(filename)).toBeTruthy();
    });
  });
  ['foo.svg', 'foo.web.svg'].forEach((filename) => {
    it(`does not match ${filename}`, () => {
      expect(matchSvgModule(filename)).toBeFalsy();
    });
  });
});

describe(convertSvgModule, () => {
  beforeEach(() => {
    vol.reset();
  });
  // TODO: Test custom config
  // TODO: Test invalid SVG
  it(`transforms svg for web`, () => {
    vol.fromJSON({}, '/');
    expect(convertSvgModule('/', fixtureA, { platform: 'web' })).toMatchInlineSnapshot(
      `Promise {}`
    );
  });
  it(`transforms svg for native`, () => {
    vol.fromJSON({}, '/');
    expect(convertSvgModule('/', fixtureA, { platform: 'ios' })).toMatchInlineSnapshot(
      `Promise {}`
    );
  });
});
