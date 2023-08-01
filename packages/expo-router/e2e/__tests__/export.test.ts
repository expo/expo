/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { bin, ensurePortFreeAsync, ensureTesterReadyAsync } from './utils';

declare const process: {
  env: {
    NODE_ENV: string;
    /** Used in `@expo/metro-runtime`. */
    EXPO_DEV_SERVER_ORIGIN?: string;

    FORCE_COLOR?: string;
    CI?: string;
    EXPO_USE_PATH_ALIASES?: string;
    EXPO_USE_STATIC?: string;
    E2E_ROUTER_SRC?: string;
  };
  [key: string]: any;
};

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env.EXPO_USE_PATH_ALIASES = '1';
  delete process.env.EXPO_USE_STATIC;
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env.EXPO_USE_PATH_ALIASES;
});

beforeEach(() => ensurePortFreeAsync(19000));

it(
  'exports with custom +html.js wrapper',
  async () => {
    const projectRoot = await ensureTesterReadyAsync('static-rendering');

    await execa('npx', [bin, 'export', '-p', 'web'], {
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: '1',
        E2E_ROUTER_SRC: 'static-rendering',
        E2E_ROUTER_ASYNC: 'development',
      },
    });

    const outputDir = path.join(projectRoot, 'dist');
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        web: {
          assets: expect.anything(),
          bundle: expect.stringMatching(/bundles\/web-.*\.js/),
        },
      },
      version: 0,
    });

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).toContain('index.html');
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('[...404].html');

    // expect(files).toContain('welcome-to-the-universe.html');
    // expect(files).toContain('other.html');
    // expect(files).toContain('[post].html');
    // expect(await fs.readFile(path.join(outputDir, 'welcome-to-the-universe.html'), 'utf8')).toContain('Post: <!-- -->welcome-to-the-universe');

    // expect(files).toContain(expect.stringMatching(/bundles\/web-.*\.js/));

    const page = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');

    expect(page).toContain('<meta name="custom-value" content="value"/>');

    // Root element
    expect(page).toContain('<div id="root">');

    const sanitized = page.replace(
      /<script src="\/_expo\/static\/js\/web\/.*" defer>/g,
      '<script src="/_expo/static/js/web/[mock].js" defer>'
    );
    expect(sanitized).toMatchSnapshot();

    expect(await fs.readFile(path.join(outputDir, 'index.html'), 'utf8')).toContain(
      '<meta name="expo-e2e-pathname" content="/"/>'
    );

    expect(await fs.readFile(path.join(outputDir, 'about.html'), 'utf8')).toContain(
      '<meta name="expo-e2e-pathname" content="/about"/>'
    );

    // // Test nested head tags
    // const aboutPage = await fs.readFile(path.join(outputDir, 'about.html'), 'utf8');

    // // If this breaks, it's likely because the Server context is not the same between the client and server.
    // // Route-specific head tags
    // expect(aboutPage).toContain(`<title data-rh="true">About | Website</title>`);

    // // Nested head tags from layout route
    // expect(aboutPage).toContain('<meta data-rh="true" name="fake" content="bar"/>');

    // // Content of the page
    // expect(aboutPage).toContain('data-testid="content">About</div>');

    // // Root element
    // expect(aboutPage).toContain('<div id="root">');
  },
  // Could take 45s depending on how fast npm installs
  240 * 1000
);

xit(
  'exports with relative fetch enabled',
  async () => {
    const projectRoot = await ensureTesterReadyAsync('relative-fetch');

    await execa('npx', [bin, 'export', '-p', 'ios'], {
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: '1',
        E2E_ROUTER_SRC: 'relative-fetch',
      },
    });

    const outputDir = path.join(projectRoot, 'dist');
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('index.html');

    const iosBundle = files.find((v) => v?.startsWith('bundles/ios'));
    expect(iosBundle).toBeDefined();

    const bundle = await fs.readFile(path.join(outputDir, iosBundle!), 'utf8');

    expect(bundle).toContain('__EXPO_BASE_URL_POLYFILLED');
  },
  // Could take 45s depending on how fast npm installs
  240 * 1000
);

xit(
  'exports with global CSS',
  async () => {
    const projectRoot = await ensureTesterReadyAsync('global-css');

    await execa('npx', [bin, 'export'], {
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: '1',
        E2E_ROUTER_SRC: 'global-css',
      },
    });

    const outputDir = path.join(projectRoot, 'dist');
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    expect(files).toContain('index.html');

    const iosBundlePath = files.find((v) => v?.startsWith('bundles/ios'));
    expect(iosBundlePath).toBeDefined();
    const bundle = await fs.readFile(path.join(outputDir, iosBundlePath!), 'utf8');
    expect(bundle).not.toContain('background: cyan;');

    const webBundlePath = files.find((v) => v?.startsWith('bundles/web'));
    expect(webBundlePath).toBeDefined();
    const webBundle = await fs.readFile(path.join(outputDir, webBundlePath!), 'utf8');
    expect(webBundle).toContain('background: cyan;');
  },
  // Could take 45s depending on how fast npm installs
  360 * 1000
);
