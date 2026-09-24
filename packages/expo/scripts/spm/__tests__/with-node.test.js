'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { scriptPhasesForModules } = require('../script-phases');

const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const WITH_NODE_COPIES = [
  'packages/expo-module-scripts/templates/scripts/with-node.sh',
  'packages/expo-constants/scripts/with-node.sh',
  'packages/expo-updates/scripts/with-node.sh',
  'packages/expo-widgets/scripts/with-node.sh',
  'packages/@expo/log-box/scripts/with-node.sh',
];
// Everything with-node.sh runs besides node. PATH holds only these, so a node
// installed on the host can never stand in for a missing one.
const SCRIPT_UTILITIES = ['cat', 'dirname'];

let tmp;
let toolPath;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'with-node-'));
  toolPath = path.join(tmp, 'tool-bin');
  fs.mkdirSync(toolPath);
  for (const name of SCRIPT_UTILITIES) {
    fs.symlinkSync(which(name), path.join(toolPath, name));
  }
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

function which(name) {
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(dir, name);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {}
  }
  throw new Error(`${name} is not on the PATH of the test process`);
}

function writeFile(filePath, contents, mode = 0o644) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, { mode });
  return filePath;
}

/** A fake `node` in its own directory that prints `marker` and its arguments. */
function fakeNode(marker) {
  return writeFile(path.join(tmp, marker, 'node'), `#!/bin/sh\necho "${marker} $*"\n`, 0o755);
}

function writeXcodeEnv(dir, nodeBinary, suffix = '') {
  writeFile(path.join(dir, `.xcode.env${suffix}`), `export NODE_BINARY="${nodeBinary}"\n`);
}

function run(scriptPath, args, env) {
  return spawnSync('/bin/bash', [scriptPath, ...args], {
    env: { PATH: toolPath, ...env },
    encoding: 'utf8',
  });
}

describe.each(WITH_NODE_COPIES)('%s', (relativePath) => {
  const script = path.join(REPO_ROOT, relativePath);
  const ARGS = ['script.js', 'two words'];
  const ranWith = (marker) => `${marker} script.js two words`;

  describe('without CocoaPods (PODS_ROOT unset)', () => {
    let srcRoot;
    beforeEach(() => {
      srcRoot = path.join(tmp, 'ios');
      fs.mkdirSync(srcRoot);
    });

    it('uses NODE_BINARY from $SRCROOT/.xcode.env', () => {
      writeXcodeEnv(srcRoot, fakeNode('node-b'));
      const result = run(script, ARGS, { SRCROOT: srcRoot });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-b'));
    });

    it('keeps a preset NODE_BINARY over $SRCROOT/.xcode.env', () => {
      writeXcodeEnv(srcRoot, fakeNode('node-b'));
      const result = run(script, ARGS, { SRCROOT: srcRoot, NODE_BINARY: fakeNode('node-a') });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-a'));
      expect(result.stdout).not.toContain('node-b ');
    });

    it('lets .xcode.env.local override .xcode.env', () => {
      writeXcodeEnv(srcRoot, fakeNode('node-b'));
      writeXcodeEnv(srcRoot, fakeNode('node-local'), '.local');
      const result = run(script, ARGS, { SRCROOT: srcRoot });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-local'));
    });

    it('treats an empty preset NODE_BINARY as unset', () => {
      writeXcodeEnv(srcRoot, fakeNode('node-b'));
      const result = run(script, ARGS, { SRCROOT: srcRoot, NODE_BINARY: '' });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-b'));
    });

    it('exports the node found on PATH after .xcode.env unsets NODE_BINARY', () => {
      writeFile(path.join(srcRoot, '.xcode.env'), 'unset NODE_BINARY\n');
      const pathNode = writeFile(
        path.join(tmp, 'env-printing', 'node'),
        '#!/bin/sh\necho "child NODE_BINARY=$NODE_BINARY"\n',
        0o755
      );
      const result = run(script, ARGS, {
        SRCROOT: srcRoot,
        PATH: `${path.dirname(pathNode)}:${toolPath}`,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`child NODE_BINARY=${pathNode}`);
    });

    it('falls back to node on PATH', () => {
      const pathNode = fakeNode('node-path');
      const result = run(script, ARGS, {
        SRCROOT: srcRoot,
        PATH: `${path.dirname(pathNode)}:${toolPath}`,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-path'));
    });

    it('prefers $SRCROOT/.xcode.env over node on PATH', () => {
      writeXcodeEnv(srcRoot, fakeNode('node-b'));
      const pathNode = fakeNode('node-path');
      const result = run(script, ARGS, {
        SRCROOT: srcRoot,
        PATH: `${path.dirname(pathNode)}:${toolPath}`,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-b'));
    });

    it('fails when node cannot be found', () => {
      const result = run(script, ARGS, { SRCROOT: srcRoot });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Could not find "node"');
    });
  });

  describe('with CocoaPods (PODS_ROOT set)', () => {
    let podsRoot;
    let pathNode;
    beforeEach(() => {
      podsRoot = path.join(tmp, 'ios', 'Pods');
      fs.mkdirSync(podsRoot, { recursive: true });
      pathNode = fakeNode('node-c');
    });
    const cocoaPodsEnv = (env) => ({
      PODS_ROOT: podsRoot,
      PATH: `${path.dirname(pathNode)}:${toolPath}`,
      ...env,
    });

    it('lets $PODS_ROOT/../.xcode.env override a preset NODE_BINARY', () => {
      writeXcodeEnv(path.dirname(podsRoot), fakeNode('node-b'));
      const result = run(script, ARGS, cocoaPodsEnv({ NODE_BINARY: fakeNode('node-a') }));
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-b'));
    });

    it('replaces a preset NODE_BINARY with node on PATH', () => {
      const result = run(script, ARGS, cocoaPodsEnv({ NODE_BINARY: fakeNode('node-a') }));
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-c'));
    });

    it('lets .xcode.env.local override .xcode.env', () => {
      writeXcodeEnv(path.dirname(podsRoot), fakeNode('node-b'));
      writeXcodeEnv(path.dirname(podsRoot), fakeNode('node-local'), '.local');
      const result = run(script, ARGS, cocoaPodsEnv({}));
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-local'));
    });

    it('fails when .xcode.env empties NODE_BINARY, although node is on PATH', () => {
      writeFile(path.join(path.dirname(podsRoot), '.xcode.env'), 'NODE_BINARY=\n');
      const result = run(script, ARGS, cocoaPodsEnv({}));
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Could not find "node"');
    });

    it('stays in CocoaPods mode when .xcode.env unsets PODS_ROOT', () => {
      writeFile(path.join(path.dirname(podsRoot), '.xcode.env'), 'unset PODS_ROOT\nNODE_BINARY=\n');
      const result = run(script, ARGS, cocoaPodsEnv({}));
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Could not find "node"');
    });

    it('ignores $SRCROOT/.xcode.env', () => {
      const srcRoot = path.join(tmp, 'app-ios');
      writeXcodeEnv(srcRoot, fakeNode('node-b'));
      const result = run(script, ARGS, cocoaPodsEnv({ SRCROOT: srcRoot }));
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(ranWith('node-c'));
    });
  });
});

describe('app.config script phase', () => {
  const [{ script: phaseScript }] = scriptPhasesForModules(['expo-constants']);
  const realWithNode = path.join(REPO_ROOT, 'packages/expo-constants/scripts/with-node.sh');
  const MARKER = 'APP_CONFIG_NODE_RAN';

  let srcRoot;
  beforeEach(() => {
    const projectRoot = path.join(tmp, 'app');
    srcRoot = path.join(projectRoot, 'ios');
    const constantsDir = path.join(projectRoot, 'node_modules', 'expo-constants');
    writeFile(path.join(constantsDir, 'package.json'), '{"name":"expo-constants"}\n');
    writeFile(
      path.join(constantsDir, 'scripts', 'get-app-config-ios.sh'),
      `#!/bin/bash
echo "exported NODE_BINARY=$NODE_BINARY"
exec "${realWithNode}" -e "console.log('${MARKER}')"
`,
      0o755
    );
  });

  function runPhase(env) {
    return spawnSync('/bin/bash', ['-c', phaseScript], {
      env: {
        PATH: toolPath,
        SRCROOT: srcRoot,
        TARGET_BUILD_DIR: path.join(tmp, 'build'),
        UNLOCALIZED_RESOURCES_FOLDER_PATH: 'App.app',
        ...env,
      },
      encoding: 'utf8',
    });
  }

  it('runs the node configured in $SRCROOT/.xcode.env', () => {
    writeXcodeEnv(srcRoot, process.execPath);
    const result = runPhase({});
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(MARKER);
  });

  it.each([
    [
      'assigned without export in .xcode.env',
      () => {
        writeFile(path.join(srcRoot, '.xcode.env'), `NODE_BINARY="${process.execPath}"\n`);
        return {};
      },
    ],
    [
      'found on PATH',
      () => {
        const binDir = path.join(tmp, 'path-bin');
        fs.mkdirSync(binDir);
        fs.symlinkSync(process.execPath, path.join(binDir, 'node'));
        return { PATH: `${binDir}:${toolPath}` };
      },
    ],
  ])('exports NODE_BINARY %s', (_, setUp) => {
    const result = runPhase(setUp());
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/exported NODE_BINARY=\S*node/);
    expect(result.stdout).toContain(MARKER);
  });
});
