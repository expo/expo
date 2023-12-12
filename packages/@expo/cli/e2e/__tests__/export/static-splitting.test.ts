/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import {
  bin,
  expectChunkPathMatching,
  getHtmlHelpers,
  getPageHtml,
  getRouterE2ERoot,
} from '../utils';

runExportSideEffects();

describe('exports static with bundle splitting', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-splitting';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await execa(
        'node',
        [bin, 'export', '-p', 'web', '--source-maps', '--output-dir', outputName],
        {
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_ROUTER_SRC: 'static-rendering',
            E2E_ROUTER_ASYNC: 'production',
            // TODO: Reenable this after investigating unstable_getRealPath
            EXPO_USE_FAST_RESOLVER: 'false',
          },
        }
      );
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has expected files', async () => {
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
      ['index', '_layout', 'index'].map(expectChunkPathMatching)
    );
  });
  it('has eager script tags in dynamic html', async () => {
    const staticParamsPage = await getScriptTagsAsync('welcome-to-the-universe.html');

    expect(staticParamsPage).toEqual(
      ['index', '[post]', '_layout'].map(expectChunkPathMatching)
    );

    expect(await getScriptTagsAsync('[post].html')).toEqual(staticParamsPage);
  });
  it('has (fewer) eager script tags in generated routes', async () => {
    // Less chunks because the not-found route is not an async import.
    expect(await getScriptTagsAsync('+not-found.html')).toEqual(
      ['index', '_layout'].map(expectChunkPathMatching)
    );
  });

  it('has source maps', async () => {
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

    const mapFiles = files.filter((file) => file?.endsWith('.map'));

    // "_expo/static/js/web/[post]-854b84d726cca00d17047171ff4ef43d.js.map",
    // "_expo/static/js/web/_layout-e67451b6ca1f415eec1baf46b17d16c6.js.map",
    // "_expo/static/js/web/about-5a4fd4bb060bd4461401d4604b0ea1ac.js.map",
    // "_expo/static/js/web/asset-fd2508eb5960aa4c5c12cfd8db6e0ba4.js.map",
    // "_expo/static/js/web/head-51629e20be61b36513e213c8645375c9.js.map",
    // "_expo/static/js/web/index-98a25924035cd8babecad8755a8564de.js.map",
    // "_expo/static/js/web/index-ed899c31dab920e6b5c3cf04e0c156b6.js.map",
    // "_expo/static/js/web/links-4545c832242c66b83e4bd38b67066808.js.map",
    // "_expo/static/js/web/styled-93437b3b1dcaa498dabb3a1de3aae7ac.js.map",
    expect(mapFiles).toEqual(
      ['\\[post\\]', '_layout', 'about', 'asset', 'index', 'index', 'links', 'styled'].map(
        (file) =>
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
      // expect(jsBundle).toMatch(/^\/\/\# sourceURL=\/_expo\/static\/js\/web\/index-.*\.js$/gm);
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

    const script = indexHtml.querySelectorAll('script')[0];
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
      // Global CSS, CSS Module
      4
    );

    links.forEach((link) => {
      // Linked to the expected static location
      expect(link.attributes.href).toMatch(/^\/_expo\/static\/css\/.*\.css$/);
    });

    expect(links[0].toString()).toMatch(
      /<link rel="preload" href="\/_expo\/static\/css\/global-[\d\w]+\.css" as="style">/
    );
    expect(links[1].toString()).toMatch(
      /<link rel="stylesheet" href="\/_expo\/static\/css\/global-[\d\w]+\.css">/
    );
    // CSS Module
    expect(links[2].toString()).toMatch(
      /<link rel="preload" href="\/_expo\/static\/css\/test\.module-[\d\w]+\.css" as="style">/
    );
    expect(links[3].toString()).toMatch(
      /<link rel="stylesheet" href="\/_expo\/static\/css\/test\.module-[\d\w]+\.css">/
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
  });

  it('statically extracts fonts', async () => {
    // <style id="expo-generated-fonts" type="text/css">@font-face{font-family:sweet;src:url(/assets/__e2e__/static-rendering/sweet.ttf?platform=web&hash=7c9263d3cffcda46ff7a4d9c00472c07);font-display:auto}</style><link rel="preload" href="/assets/__e2e__/static-rendering/sweet.ttf?platform=web&hash=7c9263d3cffcda46ff7a4d9c00472c07" as="font" crossorigin="" />
    // Unfortunately, the CSS is injected in every page for now since we don't have bundle splitting.
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const links = indexHtml.querySelectorAll('html > head > link[as="font"]');
    expect(links.length).toBe(1);
    expect(links[0].attributes.href).toBe(
      '/assets/__e2e__/static-rendering/sweet.7c9263d3cffcda46ff7a4d9c00472c07.ttf?platform=web&hash=7c9263d3cffcda46ff7a4d9c00472c07'
    );

    expect(links[0].toString()).toMatch(
      /<link rel="preload" href="\/assets\/__e2e__\/static-rendering\/sweet\.[a-zA-Z0-9]{32}\.ttf\?platform=web&hash=[a-zA-Z0-9]{32}" as="font" crossorigin="" >/
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
