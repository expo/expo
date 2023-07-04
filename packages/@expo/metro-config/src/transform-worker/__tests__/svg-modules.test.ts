import { vol } from 'memfs';

import { convertSvgModule, matchSvgModule } from '../svg-modules';

const fixtureA = `
<svg viewBox="0 0 24 24">
<path d="M11 1.28v.09c0"></path>
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
  it(`transforms invalid svg for web`, async () => {
    vol.fromJSON({}, '/');
    await expect(convertSvgModule('/', 'foobar', { platform: 'web' })).rejects.toThrowError();
  });
  it(`transforms svg for web`, async () => {
    vol.fromJSON({}, '/');
    expect(await convertSvgModule('/', fixtureA, { platform: 'web' })).toMatchInlineSnapshot(`
      "import * as React from "react";
      const SvgComponent = props => <svg viewBox="0 0 24 24" {...props}><path d="M11 1.28v.09" /></svg>;
      export default SvgComponent;"
    `);
  });
  it(`transforms svg for native`, async () => {
    vol.fromJSON({}, '/');
    expect(await convertSvgModule('/', fixtureA, { platform: 'ios' })).toMatchInlineSnapshot(`
      "import * as React from "react";
      import Svg, { Path } from "react-native-svg";
      const SvgComponent = props => <Svg viewBox="0 0 24 24" {...props}><Path d="M11 1.28v.09" /></Svg>;
      export default SvgComponent;"
    `);
  });
});
