import { vol } from 'memfs';

import { resolveEntryPoint } from '../paths';

const packageJson = JSON.stringify(
  {
    name: 'testing123',
    version: '0.1.0',
    main: 'index.js',
  },
  null,
  2
);

const packageJsonAndroid = JSON.stringify(
  {
    name: 'testing123android',
    version: '0.1.0',
    main: 'index.android.js',
  },
  null,
  2
);

const packageJsonIos = JSON.stringify(
  {
    name: 'testing123ios',
    version: '0.1.0',
    main: 'index.ios.js',
  },
  null,
  2
);

const packageJsonNoMain = JSON.stringify({
  name: 'testing456',
  version: '0.2.0',
});

const appJson = JSON.stringify(
  {
    expo: {
      name: 'testing 123',
      version: '0.1.0',
      slug: 'testing-123',
    },
  },
  null,
  2
);

describe(resolveEntryPoint, () => {
  afterEach(() => vol.reset());

  it('exists-no-platform', () => {
    vol.fromJSON(
      {
        'package.json': packageJson,
        'app.json': appJson,
        'index.js': 'console.log("lol")',
      },
      '/'
    );

    expect(
      resolveEntryPoint('/', {
        // @ts-expect-error
        platform: undefined,
      })
    ).toBe('index.js');
  });

  // Can't test resolving modules yet
  it('exists-no-platform-no-main', () => {
    vol.fromJSON(
      {
        'package.json': packageJsonNoMain,
        'app.json': appJson,
        'index.js': 'console.log("lol")',
      },
      '/'
    );
    expect(resolveEntryPoint('/', { platform: undefined })).toBe('index.js');
  });

  it('exists-android', () => {
    vol.fromJSON(
      {
        'package.json': packageJsonAndroid,
        'app.json': appJson,
        'index.android.js': 'console.log("lol")',
      },
      '/'
    );
    expect(resolveEntryPoint('/', { platform: 'android' })).toBe('index.android.js');
  });

  it('exists-ios', () => {
    vol.fromJSON(
      {
        'package.json': packageJsonIos,
        'app.json': appJson,
        'index.ios.js': '',
      },
      '/'
    );
    expect(resolveEntryPoint('/', { platform: 'ios' })).toBe('index.ios.js');
  });

  it('exists-expjson', () => {
    vol.fromJSON(
      {
        'package.json': packageJson,
        'app.json': JSON.stringify({
          expo: {
            name: 'testing567',
            version: '0.6.0',
            entryPoint: 'main.js',
          },
        }),
        'main.js': 'console.log("lol")',
      },
      '/'
    );

    expect(() => resolveEntryPoint('/')).toThrow();
  });

  // Can't test resolving modules yet
  xit('uses node_modules/expo/AppEntry as a last resort', () => {
    vol.fromJSON(
      {
        'package.json': packageJsonNoMain,
        'app.json': appJson,
        'App.js': '',
      },
      '/'
    );

    expect(resolveEntryPoint('/')).toBe('node_modules/expo/AppEntry.js');
  });
});
