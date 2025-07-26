/* eslint-env jest */
import fs from 'fs';
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

describe('exports static with bundle splitting', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-splitting';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    // NODE_ENV=production EXPO_USE_STATIC=static E2E_ROUTER_SRC=static-rendering E2E_ROUTER_ASYNC=production EXPO_USE_FAST_RESOLVER=1 npx expo export -p web --source-maps --output-dir dist-static-splitting
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'production',
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      }
    );
  });

  it('has expected files', async () => {
    const files = findProjectFiles(outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // Injected by framework
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    // Normal routes
    expect(files).toContain('about.html');
    expect(files).toContain('index.html');
    expect(files).toContain('styled.html');

    // generateStaticParams values
    expect(files).toContain('[post].html');
    expect(files).toContain('welcome-to-the-universe.html');
    expect(files).toContain('other.html');
  });

  const { getScriptTagsAsync } = getHtmlHelpers(outputDir);

  // Ensure the correct script tags are injected.
  it('has eager script tags in html', async () => {
    expect(await getScriptTagsAsync('index.html')).toEqual(
      ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index'].map(expectChunkPathMatching)
    );
  });
  it('has eager script tags in dynamic html', async () => {
    const staticParamsPage = await getScriptTagsAsync('welcome-to-the-universe.html');

    expect(staticParamsPage).toEqual(
      ['__expo-metro-runtime', '__common', 'entry', '[post]', '_layout'].map(
        expectChunkPathMatching
      )
    );

    expect(await getScriptTagsAsync('[post].html')).toEqual(staticParamsPage);
  });
  it('has (fewer) eager script tags in generated routes', async () => {
    // Less chunks because the not-found route is not an async import.
    expect(await getScriptTagsAsync('+not-found.html')).toEqual(
      ['__expo-metro-runtime', '__common', 'entry', '_layout'].map(expectChunkPathMatching)
    );
  });

  it('has source maps', async () => {
    const files = findProjectFiles(outputDir);
    const mapFiles = files.filter((file) => file?.endsWith('.map')).sort();

    // "_expo/static/js/web/[file]-[hash].js.map",
    expect(mapFiles).toEqual(
      [
        '__expo-metro-runtime',
        '__common',
        'entry',
        '_layout',
        'index',
        '\\[post\\]',
        'about',
        'asset',
        'links',
        'styled',
      ]
        .sort()
        .map((file) =>
          expect.stringMatching(new RegExp(`_expo\\/static\\/js\\/web\\/${file}-.*\\.js\\.map`))
        )
    );

    for (const file of mapFiles) {
      // Ensure the bundle does not contain a source map reference
      const sourceMap = JSON.parse(fs.readFileSync(path.join(outputDir, file!), 'utf8'));
      expect(sourceMap.version).toBe(3);

      // Common chunk
      if (file!.match(/head/)) {
        expect(sourceMap.sources.length).toEqual(29);
      } else {
        // expect(sourceMap.sources).toEqual(
        //   expect.arrayContaining([
        //     expect.stringMatching(/\/apps\/router-e2e\/__e2e__\/static-rendering\/app\//),
        //   ])
        // );
      }
    }

    const jsFiles = files.filter((file) => file?.endsWith('.js'));

    for (const file of jsFiles) {
      // Ensure the bundle does not contain a source map reference
      const jsBundle = fs.readFileSync(path.join(outputDir, file!), 'utf8');
      expect(jsBundle).toMatch(/^\/\/\# sourceMappingURL=\/_expo\/static\/js\/web\/.*\.js\.map$/gm);
      const mapFile = jsBundle.match(
        /^\/\/\# sourceMappingURL=(\/_expo\/static\/js\/web\/.*\.js\.map)$/m
      )?.[1];

      expect(fs.existsSync(path.join(outputDir, mapFile!))).toBe(true);
    }
  });

  it('can use environment variables', async () => {
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

    const script = indexHtml
      .querySelectorAll('script')
      .filter((script) => !!script.attributes.src)[0];
    const jsBundle = fs.readFileSync(path.join(outputDir, script.attributes.src), 'utf8');

    // Ensure the bundle is valid
    expect(jsBundle).toMatch('__BUNDLE_START_TIME__');
    // Ensure the non-public env var is not included in the bundle
    expect(jsBundle).not.toMatch('not-public-value');
  });

  it('static styles are injected', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');
    expect(indexHtml.querySelectorAll('html > head > style')?.length).toBe(
      // React Native and Expo resets
      3
    );
    // The Expo style reset
    expect(indexHtml.querySelector('html > head > style#expo-reset')?.innerHTML).toEqual(
      expect.stringContaining(
        '#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}'
      )
    );

    expect(
      indexHtml.querySelector('html > head > style#react-native-stylesheet')?.innerHTML
    ).toEqual(expect.stringContaining('[stylesheet-group="0"]{}'));
  });

  it('statically extracts CSS', async () => {
    // Unfortunately, the CSS is injected in every page for now since we don't have bundle splitting.
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const links = indexHtml.querySelectorAll('html > head > link').filter((link) => {
      // Fonts are tested elsewhere
      return link.attributes.as !== 'font';
    });
    expect(links.length).toBe(
      // Global CSS, CSS Module, Vaul Modal CSS (and entry point)
      6
    );

    const linkStrings = links.map((l) => l.toString());

    expect(linkStrings).toEqual(
      expect.arrayContaining([
        // Global CSS
        expect.stringMatching(
          /<link rel="preload" href="\/_expo\/static\/css\/global-(?<md5>[0-9a-fA-F]{32})\.css" as="style">/
        ),
        expect.stringMatching(
          /<link rel="stylesheet" href="\/_expo\/static\/css\/global-(?<md5>[0-9a-fA-F]{32})\.css">/
        ),
        // Modal CSS
        expect.stringMatching(
          /<link rel="preload" href="\/_expo\/static\/css\/modal\.module-(?<md5>[0-9a-fA-F]{32})\.css" as="style">/
        ),
        expect.stringMatching(
          /<link rel="stylesheet" href="\/_expo\/static\/css\/modal\.module-(?<md5>[0-9a-fA-F]{32})\.css">/
        ),
        // Test CSS module
        expect.stringMatching(
          /<link rel="preload" href="\/_expo\/static\/css\/test\.module-(?<md5>[0-9a-fA-F]{32})\.css" as="style">/
        ),
        expect.stringMatching(
          /<link rel="stylesheet" href="\/_expo\/static\/css\/test\.module-(?<md5>[0-9a-fA-F]{32})\.css">/
        ),
      ])
    );

    const globalPreload = links.find((l) => /global-.*\.css/.test(l.attributes.href!));
    expect(globalPreload).toBeDefined();
    if (globalPreload) {
      expect(
        fs.readFileSync(path.join(outputDir, globalPreload.attributes.href), 'utf-8')
      ).toMatchInlineSnapshot(`"div{background:#0ff}"`);
    }
  });

  it('statically extracts fonts', async () => {
    // <style id="expo-generated-fonts" type="text/css">@font-face{font-family:sweet;src:url(/assets/__e2e__/static-rendering/sweet.ttf);font-display:auto}</style><link rel="preload" href="/assets/__e2e__/static-rendering/sweet.ttf?platform=web&hash=7c9263d3cffcda46ff7a4d9c00472c07" as="font" crossorigin="" />
    // Unfortunately, the CSS is injected in every page for now since we don't have bundle splitting.
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const links = indexHtml.querySelectorAll('html > head > link[as="font"]');
    expect(links.length).toBe(1);
    expect(links[0].attributes.href).toBe(
      '/assets/__e2e__/static-rendering/sweet.7c9263d3cffcda46ff7a4d9c00472c07.ttf'
    );

    expect(links[0].toString()).toMatch(
      /<link rel="preload" href="\/assets\/__e2e__\/static-rendering\/sweet\.[a-zA-Z0-9]{32}\.ttf" as="font" crossorigin="" >/
    );

    expect(
      fs.readFileSync(path.join(outputDir, links[0].attributes.href.replace(/\?.*$/, '')), 'utf-8')
    ).toBeDefined();

    // Ensure the font is used
    expect(indexHtml.querySelector('div[data-testid="index-text"]')?.attributes.style).toMatch(
      'font-family:sweet'
    );

    // NOTE: Nested font loading doesn't work with splitting.
    // // Fonts have proper splitting due to how they're loaded during static rendering, we should test
    // // that certain fonts only show on the about page.
    // const aboutHtml = await getPageHtml(outputDir, 'about.html');

    // const aboutLinks = aboutHtml.querySelectorAll('html > head > link[as="font"]');
    // expect(aboutLinks.length).toBe(2);
    // expect(aboutLinks[1].attributes.href).toMatch(
    //   /react-native-vector-icons\/Fonts\/EvilIcons\.ttf/
    // );
  });

  it('supports usePathname in +html files', async () => {
    const page = await fs.promises.readFile(path.join(outputDir, 'index.html'), 'utf8');

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
  });

  it('supports nested static head values', async () => {
    // <title>About | Website</title>
    // <meta name="description" content="About page" />
    const about = await getPageHtml(outputDir, 'about.html');

    expect(about.querySelector('html > body div[data-testid="content"]')?.innerText).toBe('About');
    expect(about.querySelector('html > head > title')?.innerText).toBe('About | Website');
    expect(about.querySelector('html > head > meta[name="description"]')?.attributes.content).toBe(
      'About page'
    );
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
  });
});
