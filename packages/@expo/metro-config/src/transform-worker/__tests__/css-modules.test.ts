import {
  convertLightningCssToReactNativeWebStyleSheet,
  transformCssModuleWeb,
  matchCssModule,
} from '../css-modules';

const fixtureA = `
  :root {
      --accent-color: hotpink;
  }
  .container {
      background-color: var(--accent-color);
      animation: pulse 2s infinite;
  }
  .betterContainer {
      composes: container;
      border-radius: 50px;
  }
  @keyframes pulse {
      0% {
          transform: scale(1);
      }
      50% {
          transform: scale(1.2);
      }
      100% {
          transform: scale(1);
      }
  }
  `;

describe(matchCssModule, () => {
  [
    'foo.module.css',
    'foo.native.module.sass',
    'foo.module.scss',
    'foo.module.native.scss',
    'foo.module.web.scss',
    'foo.module.ios.css',
    'foo.module.sass',
  ].forEach((filename) => {
    it(`matches ${filename}`, () => {
      expect(matchCssModule(filename)).toBeTruthy();
    });
  });
  ['foo.css', 'foo.scss', 'foo.sass', 'foo.less'].forEach((filename) => {
    it(`does not match ${filename}`, () => {
      expect(matchCssModule(filename)).toBeFalsy();
    });
  });
});

describe(convertLightningCssToReactNativeWebStyleSheet, () => {
  it(`transforms A`, () => {
    expect(
      convertLightningCssToReactNativeWebStyleSheet({
        pulse: { name: 'a3Dm-a_pulse', composes: [], isReferenced: true },
        betterContainer: {
          name: 'a3Dm-a_betterContainer',
          composes: [{ type: 'local', name: 'a3Dm-a_container' }],
          isReferenced: false,
        },
        '--accent-color': {
          name: '--a3Dm-a_accent-color',
          composes: [],
          isReferenced: true,
        },
        container: {
          name: 'a3Dm-a_container',
          composes: [],
          isReferenced: false,
        },
      })
    ).toEqual({
      reactNativeWeb: {
        '--accent-color': { $$css: true, _: '--a3Dm-a_accent-color' },
        betterContainer: {
          $$css: true,
          // composes
          _: 'a3Dm-a_betterContainer a3Dm-a_container',
        },
        container: { $$css: true, _: 'a3Dm-a_container' },
        pulse: { $$css: true, _: 'a3Dm-a_pulse' },
      },
      styles: {
        '--accent-color': '--a3Dm-a_accent-color',
        betterContainer: 'a3Dm-a_betterContainer a3Dm-a_container',
        container: 'a3Dm-a_container',
        pulse: 'a3Dm-a_pulse',
      },

      variables: { '--accent-color': '--a3Dm-a_accent-color' },
    });
  });
});

describe(transformCssModuleWeb, () => {
  it(`transforms A`, async () => {
    const { output } = await transformCssModuleWeb({
      filename: 'acme.css',
      src: fixtureA,
      options: {
        projectRoot: '/',
        minify: false,
      },
    } as any);
    expect(output).toMatch(/module\.exports=Object\.assign/);
  });
  it(`minifies CSS`, async () => {
    const { css, output } = await transformCssModuleWeb({
      filename: 'acme.css',
      src: fixtureA,
      options: {
        projectRoot: '/',
        minify: true,
        dev: false,
      },
    } as any);
    expect(css.toString()).toMatchSnapshot();
    expect(output).not.toMatch(/document\.head/);
  });
  it(`appends dev reload code to CSS output`, async () => {
    const { output } = await transformCssModuleWeb({
      filename: 'acme.css',
      src: fixtureA,
      options: {
        projectRoot: '/',
        dev: true,
        minify: false,
      },
    } as any);
    expect(output).toMatch(/document\.head/);
  });
});
