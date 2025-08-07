/* eslint-env jest */
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static export with middleware', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-middleware-async';
  const outputDir = path.join(projectRoot, outputName);

  describe('static', () => {
    it('skips middleware when exporting a project with web.output === static', async () => {
      const results = await executeExpoAsync(
        projectRoot,
        ['export', '-p', 'web', '--output-dir', outputName],
        {
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_ROUTER_SRC: 'server-middleware-async',
          },
        }
      );

      expect(results.stderr).toContain(
        'Skipping export for middleware because `web.output` is not "server"'
      );

      const files = findProjectFiles(outputDir);
      expect(files).not.toContain('server/_expo/functions/+middleware.js');
    });
  });
});
