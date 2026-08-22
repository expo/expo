import { vol } from 'memfs';

import { applyAppNameAsync } from '../appName';

const projectRoot = '/tmp/my-app';

afterEach(() => {
  vol.reset();
});

describe(applyAppNameAsync, () => {
  it(`should write the display name into app.json`, async () => {
    vol.fromJSON({
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { name: 'my-app', slug: 'my-app' } }),
    });

    await expect(applyAppNameAsync(projectRoot, 'My App')).resolves.toBe(true);

    const appJson = JSON.parse(vol.readFileSync(`${projectRoot}/app.json`, 'utf8') as string);
    // Only the display name changes: the slug identifies the project to EAS, and the directory
    // named it.
    expect(appJson).toEqual({ expo: { name: 'My App', slug: 'my-app' } });
  });

  it(`should report a project whose config is not app.json`, async () => {
    // An `app.config.js` project is code, and rewriting code is not this command's job.
    vol.fromJSON({ [`${projectRoot}/app.config.js`]: 'module.exports = {};' });

    await expect(applyAppNameAsync(projectRoot, 'My App')).resolves.toBe(false);
  });

  it(`should report an app.json without an expo key`, async () => {
    vol.fromJSON({ [`${projectRoot}/app.json`]: JSON.stringify({ name: 'my-app' }) });

    await expect(applyAppNameAsync(projectRoot, 'My App')).resolves.toBe(false);
  });
});
