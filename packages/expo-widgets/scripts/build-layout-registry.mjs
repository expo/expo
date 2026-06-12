#!/usr/bin/env node

import spawn from '@expo/spawn-async';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process, { argv } from 'node:process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const [, , possibleProjectRoot = process.cwd(), platform = 'ios', registryOutput, configPath] =
  argv;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(__dirname);

const defaultOutputPath = path.join(__dirname, '../bundle/build/ExpoWidgetsLayoutRegistry.json');
const registryEntryPath = path.join(__dirname, '../bundle/layout-registry-entry.js');
const registryMetroConfigPath = path.join(__dirname, '../layout-registry.metro.config.js');

async function main() {
  const projectRoot = path.resolve(possibleProjectRoot);
  const outputPath = path.resolve(projectRoot, registryOutput ?? defaultOutputPath);
  const resolvedConfigPath = path.resolve(
    projectRoot,
    configPath ??
      path.join(projectRoot, 'ios', 'ExpoWidgetsTarget', 'ExpoWidgetsLayoutRegistry.config.json')
  );

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  const expectedWidgets = await readExpectedWidgets(projectRoot, resolvedConfigPath);
  if (expectedWidgets.length === 0) {
    await writeRegistry(outputPath, { widgets: {} });
    return;
  }

  const buildDir = path.join(__dirname, '../bundle/build');
  await fs.promises.mkdir(buildDir, { recursive: true });

  const importsPath = path.join(buildDir, 'ExpoWidgetsLayoutRegistry.imports.js');
  const bundlePath = path.join(buildDir, 'ExpoWidgetsLayoutRegistry.bundle');

  await fs.promises.writeFile(importsPath, createImportsSource(expectedWidgets));
  await fs.promises.rm(bundlePath, { force: true });

  await bundleRegistryEntry({ projectRoot, platform, entryPath: registryEntryPath, bundlePath });

  const capturedLayouts = await evaluateRegistryBundle(bundlePath);
  const registry = createLayoutRegistry(expectedWidgets, capturedLayouts);
  await writeRegistry(outputPath, registry);
}

async function readExpectedWidgets(projectRoot, configPath) {
  if (!fs.existsSync(configPath)) {
    return [];
  }

  const contents = await fs.promises.readFile(configPath, 'utf8');
  const config = JSON.parse(contents);
  return (config.widgets ?? [])
    .filter((widget) => widget?.initialLayout != null)
    .map((widget) => ({
      name: widget.name,
      initialLayout: widget.initialLayout,
      initialLayoutFile: path.resolve(projectRoot, widget.initialLayout),
    }));
}

function createImportsSource(expectedWidgets) {
  return `${expectedWidgets
    .map((widget) => `import ${JSON.stringify(widget.initialLayoutFile)};`)
    .join('\n')}\n`;
}

async function bundleRegistryEntry({ projectRoot, platform, entryPath, bundlePath }) {
  const nodePath = process.env.NODE_BINARY || 'node';
  const result = await spawn(
    nodePath,
    [
      require.resolve('expo/bin/cli'),
      'export:embed',
      '--platform',
      platform,
      '--bundle-output',
      bundlePath,
      '--entry-file',
      entryPath,
      '--dev',
      'false',
      '--skip-server',
    ],
    {
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        ...process.env,
        EXPO_OVERRIDE_METRO_CONFIG: registryMetroConfigPath,
      },
    }
  );

  if (result.error) {
    process.exit(1);
  }
}

async function evaluateRegistryBundle(bundlePath) {
  const code = await fs.promises.readFile(bundlePath, 'utf8');
  delete globalThis.__expoWidgetsLayoutRegistry;
  vm.runInThisContext(code, { filename: bundlePath });
  return globalThis.__expoWidgetsLayoutRegistry;
}

async function writeRegistry(outputPath, registry) {
  await fs.promises.writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
}

function createLayoutRegistry(expectedWidgets, capturedLayouts) {
  const registry = { widgets: {} };
  const captured = capturedLayouts?.widgets ?? {};
  const capturedNames = new Set(Object.keys(captured));

  for (const widget of expectedWidgets) {
    const capturedWidget = captured[widget.name];
    const layout = capturedWidget?.layout;
    if (typeof layout !== 'string' || layout.length === 0) {
      throw new Error(
        `Expected ${JSON.stringify(widget.initialLayout)} to register ${JSON.stringify(
          widget.name
        )} with createWidget.`
      );
    }
    registry.widgets[widget.name] = { layout };
    if (capturedWidget.initialProps != null) {
      registry.widgets[widget.name].initialProps = capturedWidget.initialProps;
    }
    capturedNames.delete(widget.name);
  }

  if (capturedNames.size > 0) {
    throw new Error(
      `Unexpected Expo widget layout registration for ${JSON.stringify([...capturedNames][0])}.`
    );
  }

  return registry;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await main();
}
