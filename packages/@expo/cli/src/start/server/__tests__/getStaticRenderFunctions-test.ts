import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { evalMetroNoHandling } from '../getStaticRenderFunctions';

jest.unmock('fs');
jest.unmock('os');
jest.mock('../serverLogLikeMetro', () => ({ augmentLogs: jest.fn() }));

it('shares app dependencies between linked renderer and route bundles', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-render-dependencies-'));
  const projectRoot = path.join(root, 'app with spaces');
  const rendererRoot = path.join(root, 'linked-renderer');

  try {
    for (const directory of [projectRoot, rendererRoot]) {
      const dependency = path.join(directory, 'node_modules', 'shared-dependency');
      fs.mkdirSync(dependency, { recursive: true });
      fs.writeFileSync(path.join(dependency, 'index.js'), 'module.exports = {};');
    }

    const renderer = evalMetroNoHandling(
      projectRoot,
      'module.exports = { dependency: require("shared-dependency"), read: () => require("shared-dependency") };',
      path.join(rendererRoot, 'render.js.bundle')
    );
    const route = evalMetroNoHandling(
      projectRoot,
      'module.exports = require("shared-dependency");',
      path.join(projectRoot, 'route.js.bundle')
    );

    expect(renderer.dependency).toBe(route);
    expect(renderer.read()).toBe(route);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
