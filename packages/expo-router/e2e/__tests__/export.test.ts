/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';
import * as htmlParser from 'node-html-parser';

import { bin, ensurePortFreeAsync, ensureTesterReady } from './utils';

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

function clearEnv() {
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env.EXPO_USE_PATH_ALIASES = '1';
  delete process.env.EXPO_USE_STATIC;
}
function restoreEnv() {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env.EXPO_USE_PATH_ALIASES;
}
beforeAll(async () => {
  clearEnv();
});

afterAll(() => {
  restoreEnv();
});

beforeEach(() => ensurePortFreeAsync(19000));

describe('static-rendering', () => {
  const projectRoot = ensureTesterReady('static-rendering');
  const outputDir = path.join(projectRoot, 'dist');

  beforeAll(
    async () => {
      await execa('npx', [bin, 'export', '-p', 'web'], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: '1',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'development',
        },
      });
    },
    // Could take 45s depending on how fast npm installs
    240 * 1000
  );

  it(
    'has expected files',
    async () => {
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
      expect(files).not.toContain('_layout.html');

      // Injected by framework
      expect(files).toContain('_sitemap.html');
      expect(files).toContain('[...404].html');

      // Normal routes
      expect(files).toContain('about.html');
      expect(files).toContain('index.html');
      expect(files).toContain('styled.html');

      // generateStaticParams values
      expect(files).toContain('[post].html');
      expect(files).toContain('welcome-to-the-universe.html');
      expect(files).toContain('other.html');
    },
    2 * 1000
  );

  it(
    'can use environment variables',
    async () => {
      const indexHtml = await getPageHtml(outputDir, 'index.html');

      const queryMeta = (name: string) =>
        indexHtml.querySelector(`html > head > meta[name="${name}"]`)?.attributes.content;

      // Injected in app/+html.js
      expect(queryMeta('expo-e2e-public-env-var')).toEqual('foobar');
      // non-public env vars are injected during SSG
      expect(queryMeta('expo-e2e-private-env-var')).toEqual('not-public-value');

      // Injected in app/_layout.js
      expect(queryMeta('expo-e2e-public-env-var-client')).toEqual('foobar');
      // non-public env vars are injected during SSG
      expect(queryMeta('expo-e2e-private-env-var-client')).toEqual('not-public-value');

      indexHtml.querySelectorAll('script').forEach((script) => {
        const jsBundle = fs.readFileSync(path.join(outputDir, script.attributes.src), 'utf8');

        // Ensure the bundle is valid
        expect(jsBundle).toMatch('__BUNDLE_START_TIME__');
        // Ensure the non-public env var is not included in the bundle
        expect(jsBundle).not.toMatch('not-public-value');
      });
    },
    2 * 1000
  );

  it(
    'static styles are injected',
    async () => {
      const indexHtml = await getPageHtml(outputDir, 'index.html');
      expect(indexHtml.querySelectorAll('html > head > style')?.length).toBe(
        // React Native and Expo resets
        2
      );
      // The Expo style reset
      expect(indexHtml.querySelector('html > head > style#expo-reset')?.innerHTML).toEqual(
        expect.stringContaining('#root,body{display:flex}')
      );

      expect(
        indexHtml.querySelector('html > head > style#react-native-stylesheet')?.innerHTML
      ).toEqual(expect.stringContaining('[stylesheet-group="0"]{}'));
    },
    2 * 1000
  );

  it(
    'statically extracts CSS',
    async () => {
      // Unfortunately, the CSS is injected in every page for now since we don't have bundle splitting.
      const indexHtml = await getPageHtml(outputDir, 'index.html');

      const links = indexHtml.querySelectorAll('html > head > link');
      expect(links.length).toBe(
        // Global CSS and CSS Module
        4
      );

      links.forEach((link) => {
        // Linked to the expected static location
        expect(link.attributes.href).toMatch(/^\/_expo\/static\/css\/.*\.css$/);
      });

      expect(links[0].toString()).toMatchInlineSnapshot(
        `"<link rel="preload" href="/_expo/static/css/global-67b6bc5b348b2db946e81c5f0040f565.css" as="style">"`
      );
      expect(links[1].toString()).toMatchInlineSnapshot(
        `"<link rel="stylesheet" href="/_expo/static/css/global-67b6bc5b348b2db946e81c5f0040f565.css">"`
      );
      // CSS Module
      expect(links[2].toString()).toMatch(
        /\<link rel="preload" href="\/_expo\/static\/css\/test\.module-[\d\w]+\.css" as="style">/
      );
      expect(links[3].toString()).toMatch(
        /\<link rel="stylesheet" href="\/_expo\/static\/css\/test\.module-[\d\w]+\.css">/
      );

      expect(
        fs.readFileSync(path.join(outputDir, links[0].attributes.href), 'utf-8')
      ).toMatchInlineSnapshot(`"div{background:#0ff}"`);

      // CSS Module
      expect(
        fs.readFileSync(path.join(outputDir, links[2].attributes.href), 'utf-8')
      ).toMatchInlineSnapshot(`".HPV33q_text{color:#1e90ff}"`);

      const styledHtml = await getPageHtml(outputDir, 'styled.html');

      // Ensure the atomic CSS class is used
      expect(
        styledHtml.querySelector('html > body div[data-testid="styled-text"]')?.attributes.class
      ).toMatch('HPV33q_text');
    },
    2 * 1000
  );

  it(
    'supports usePathname in +html files',
    async () => {
      const page = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');

      expect(page).toContain('<meta name="custom-value" content="value"/>');

      // Root element
      expect(page).toContain('<div id="root">');

      const sanitized = page.replace(
        /<script src="\/_expo\/static\/js\/web\/.*" defer>/g,
        '<script src="/_expo/static/js/web/[mock].js" defer>'
      );
      expect(sanitized).toMatchSnapshot();

      expect(
        (await getPageHtml(outputDir, 'about.html')).querySelector(
          'html > head > meta[name="expo-e2e-pathname"]'
        )?.attributes.content
      ).toBe('/about');

      expect(
        (await getPageHtml(outputDir, 'index.html')).querySelector(
          'html > head > meta[name="expo-e2e-pathname"]'
        )?.attributes.content
      ).toBe('/');

      expect(
        (await getPageHtml(outputDir, 'welcome-to-the-universe.html')).querySelector(
          'html > head > meta[name="expo-e2e-pathname"]'
        )?.attributes.content
      ).toBe('/welcome-to-the-universe');
    },
    2 * 1000
  );

  it(
    'supports nested static head values',
    async () => {
      // <title>About | Website</title>
      // <meta name="description" content="About page" />
      const about = await getPageHtml(outputDir, 'about.html');

      expect(about.querySelector('html > body div[data-testid="content"]')?.innerText).toBe(
        'About'
      );
      expect(about.querySelector('html > head > title')?.innerText).toBe('About | Website');
      expect(
        about.querySelector('html > head > meta[name="description"]')?.attributes.content
      ).toBe('About page');
      expect(
        // Nested from app/_layout.js
        about.querySelector('html > head > meta[name="expo-nested-layout"]')?.attributes.content
      ).toBe('TEST_VALUE');

      expect(
        // Other routes have the nested layout value
        (await getPageHtml(outputDir, 'welcome-to-the-universe.html')).querySelector(
          'html > head > meta[name="expo-nested-layout"]'
        )?.attributes.content
      ).toBe('TEST_VALUE');
    },
    2 * 1000
  );
});

async function getPage(output: string, route: string): Promise<string> {
  return await fs.readFile(path.join(output, route), 'utf8');
}

async function getPageHtml(output: string, route: string) {
  return htmlParser.parse(await getPage(output, route));
}

xit(
  'exports with relative fetch enabled',
  async () => {
    const projectRoot = await ensureTesterReady('relative-fetch');

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
    const projectRoot = await ensureTesterReady('global-css');

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
