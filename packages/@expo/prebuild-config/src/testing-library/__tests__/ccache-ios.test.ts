import { vol } from 'memfs';

import {
  applyTemplateFixture,
  compileModsAsync,
  mockProcessPlatform,
  unmockProcessPlatform,
} from './prebuild-tester';

jest.mock('fs');

const originalWarn = console.warn;

beforeEach(async () => {
  console.warn = jest.fn();
  mockProcessPlatform('not-darwin');
});

afterEach(() => {
  console.warn = originalWarn;
  vol.reset();
  unmockProcessPlatform();
});

it('enables experiments.ccacheIos in ios/Podfile.properties.json', async () => {
  const projectRoot = applyTemplateFixture('/app');
  // Prebuilt config
  let config = await compileModsAsync(
    {
      experiments: {
        ccacheIos: true,
      },
    },
    { projectRoot, platforms: ['ios'] }
  );

  expect(config).toMatchPodfileProperties(
    expect.objectContaining({
      ccache: 'true',
    })
  );

  // Second pass to remove the key when present.

  config = await compileModsAsync(
    {
      experiments: {
        ccacheIos: false,
      },
    },
    { projectRoot, platforms: ['ios'] }
  );

  expect(config).toMatchPodfileProperties(
    // Object without ccache key
    expect.not.objectContaining({
      ccache: 'true',
    })
  );
});
