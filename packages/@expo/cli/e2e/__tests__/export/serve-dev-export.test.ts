import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('serve-dev-export', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-serve-dev-export';
  let output = '';
  const server = createExpoServe({
    cwd: projectRoot,
    onOutput: (chunk) => {
      output += chunk;
    },
  });

  beforeAll(async () => {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--dev', '--output-dir', outputName],
      {
        env: {
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'static-rendering',
        },
      }
    );
  });

  afterAll(async () => {
    await server.stopAsync(true);
  });

  it('refuses to serve a development export', async () => {
    await expect(server.startAsync([outputName])).rejects.toThrow();
    expect(output).toMatch(/built for development/);
  });
});
