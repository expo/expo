/* eslint-env jest */
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import {
  expectChunkPathMatching,
  findProjectFiles,
  getHtmlHelpers,
  getPageHtml,
  getRouterE2ERoot,
} from '../utils';

runExportSideEffects();

describe.each(['0', '1'])(
  'export web-modal example with EXPO_UNSTABLE_WEB_MODAL=%s',
  (EXPO_UNSTABLE_WEB_MODAL) => {
    const projectRoot = getRouterE2ERoot();
    const outputName = 'dist-static-web-modal-' + EXPO_UNSTABLE_WEB_MODAL;
    const outputDir = path.join(projectRoot, outputName);

    beforeAll(async () => {
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'web-modal',
          E2E_ROUTER_ASYNC: 'production',
          EXPO_UNSTABLE_WEB_MODAL,
        },
      });
    });

    it('generates expected route files', async () => {
      const files = findProjectFiles(outputDir);

      expect(files).toContain('index.html');
      expect(files).toContain('modal.html');
      expect(files).toContain('modal-multi.html');
      expect(files).toContain('modal-scroll.html');
    });

    const { getScriptTagsAsync } = getHtmlHelpers(outputDir);

    it('injects correct scripts', async () => {
      expect(await getScriptTagsAsync('index.html')).toEqual(
        ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index'].map(
          expectChunkPathMatching
        )
      );
      expect(await getScriptTagsAsync('modal.html')).toEqual(
        ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index', 'modal'].map(
          expectChunkPathMatching
        )
      );
      expect(await getScriptTagsAsync('modal-multi.html')).toEqual(
        ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index', 'modal-multi'].map(
          expectChunkPathMatching
        )
      );
      expect(await getScriptTagsAsync('modal-scroll.html')).toEqual(
        ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index', 'modal-scroll'].map(
          expectChunkPathMatching
        )
      );
    });

    it('injects correct css based on the feature flag', async () => {
      const indexHtml = await getPageHtml(outputDir, 'index.html');

      const links = indexHtml.querySelectorAll('html > head > link').filter((link) => {
        return link.attributes.as === 'style' || link.attributes.rel === 'stylesheet';
      });
      expect(links.length).toBe(
        // Global CSS, CSS Module
        EXPO_UNSTABLE_WEB_MODAL === '1' ? 2 : 0
      );

      if (EXPO_UNSTABLE_WEB_MODAL === '1') {
        const linkStrings = links.map((l) => l.toString());

        expect(linkStrings).toEqual(
          expect.arrayContaining([
            expect.stringMatching(
              /<link rel="preload" href="\/_expo\/static\/css\/modal\.module-(?<md5>[0-9a-fA-F]{32})\.css" as="style">/
            ),
            expect.stringMatching(
              /<link rel="stylesheet" href="\/_expo\/static\/css\/modal\.module-(?<md5>[0-9a-fA-F]{32})\.css">/
            ),
          ])
        );
      }
    });
  }
);
