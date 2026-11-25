import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { getServerTesterRoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('serve-dev-export', () => {
  const projectRoot = getServerTesterRoot();
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
          E2E_ROUTER_WEB_OUTPUT: 'server',
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
