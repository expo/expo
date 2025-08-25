/* eslint-env jest */

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('server loader', () => {
  const projectRoot = getRouterE2ERoot();

  it('should throw an error when exporting', async () => {
    try {
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', 'dist-test'], {
        verbose: false,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server-loader',
          E2E_ROUTER_SERVER_LOADERS: 'true',
        },
      });
    } catch (error: any) {
      expect(error.stderr || error.message).toContain(
        'Server data loaders are not currently supported'
      );
    }
  });

  it('should throw an error when starting a development server', async () => {
    try {
      await executeExpoAsync(projectRoot, ['start', '--port', '0'], {
        verbose: false,
        timeout: 5000,
        env: {
          NODE_ENV: 'development',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server-loader',
          E2E_ROUTER_SERVER_LOADERS: 'true',
        },
      });
    } catch (error: any) {
      expect(error.stderr || error.message).toContain(
        'Server data loaders are not currently supported'
      );
    }
  });
});
