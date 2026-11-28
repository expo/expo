import { vol } from 'memfs';

import { loadUserConfig } from '../loadUserConfig';

afterEach(() => {
  vol.reset();
});

describe(loadUserConfig, () => {
  it(`takes Metro's run statement, which getDefaultConfig leaves out`, async () => {
    vol.fromJSON({
      '/app/package.json': '{}',
      '/app/node_modules/react-native/package.json': '{}',
    });
    const config = await loadUserConfig({ projectRoot: '/app', serverRoot: '/app' });
    expect(config.serializer.getRunModuleStatement(1, 'gp_')).toBe('gp___r(1);');
  });
});
