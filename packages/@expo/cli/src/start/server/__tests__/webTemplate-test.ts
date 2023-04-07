import { vol } from 'memfs';

import { createTemplateHtmlFromExpoConfigAsync } from '../webTemplate';

const fsReal = jest.requireActual('fs') as typeof import('fs');
beforeEach(() => {
  vol.reset();
});

jest.mock('../../../customize/templates', () => ({
  TEMPLATES: [{ id: 'index.html', file: () => '/mock/index.html' }],
}));

describe(createTemplateHtmlFromExpoConfigAsync, () => {
  it(`creates using the default template`, async () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        'mock/index.html': fsReal.readFileSync(
          require.resolve('@expo/webpack-config/web-default/index.html'),
          'utf-8'
        ),
      },
      projectRoot
    );

    const contents = await createTemplateHtmlFromExpoConfigAsync(projectRoot, {
      scripts: ['/script.js'],
      cssLinks: ['/_expo/static/1.css', '/_expo/static/2.css'],
      exp: {
        name: 'My App',
        slug: 'my-app',
        web: {
          description: 'my static app',
          themeColor: '#123456',
        },
      },
    });

    // Standard replacements
    expect(contents).toMatch(/<html lang="en">/);
    expect(contents).toMatch(/<title>My App<\/title>/);
    // Meta
    expect(contents).toMatch(/<meta name="description" content="my static app">/);
    expect(contents).toMatch(/<meta name="theme-color" content="#123456">/);
    // Adds script tag
    expect(contents).toMatch(/<script src="\/script\.js" defer><\/script>/);
    // Adds css links
    expect(contents).toMatch(/<link rel="stylesheet" href="\/_expo\/static\/1\.css">/);
    expect(contents).toMatch(/<link rel="stylesheet" href="\/_expo\/static\/2\.css">/);

    // Sanity
    expect(contents).toMatchSnapshot();
  });
  it(`creates using an override project file`, async () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        // Custom file
        'public/index.html': `<!DOCTYPE html><html lang="%LANG_ISO_CODE%"><head></head><body><div id="root"></div></body></html>`,
      },
      projectRoot
    );

    const contents = await createTemplateHtmlFromExpoConfigAsync(projectRoot, {
      scripts: ['/script.js'],
      exp: {
        name: 'My App',
        slug: 'my-app',
        web: {
          description: 'my static app',
          themeColor: '#123456',
        },
      },
    });

    // Title won't be added because the template is missing.

    // Standard replacements
    expect(contents).toMatch(/<html lang="en">/);

    // Meta
    expect(contents).toMatch(/<meta name="description" content="my static app">/);
    expect(contents).toMatch(/<meta name="theme-color" content="#123456">/);
    // Adds script tag
    expect(contents).toMatch(/<script src="\/script\.js" defer><\/script>/);

    // Sanity
    expect(contents).toMatchSnapshot();
  });
});
