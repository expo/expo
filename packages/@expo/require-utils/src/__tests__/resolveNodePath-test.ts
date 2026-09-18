import path from 'node:path';

// This suite needs the real filesystem, a real temp dir and a real child process: the shared setup
// mocks all three, and a fixture in memfs is invisible to the Node process spawned below.
const fs = jest.requireActual<typeof import('node:fs')>('fs');
const os = jest.requireActual<typeof import('node:os')>('os');
const { execFileSync } = jest.requireActual<typeof import('node:child_process')>('child_process');

// `NODE_PATH` only means something to a real Node process: inside Jest, `Module._resolveFilename`
// is Jest's own resolver, so it would answer these questions from the monorepo rather than from the
// fixture. The child requires the built output because it has no TypeScript transform.
const LIBRARY = path.resolve(__dirname, '../../build/index.js');

function writePackage(dir: string, name: string): void {
  fs.mkdirSync(path.join(dir, name), { recursive: true });
  fs.writeFileSync(
    path.join(dir, name, 'package.json'),
    JSON.stringify({ name, version: '1.0.0' })
  );
}

describe('NODE_PATH', () => {
  let root: string;
  let projectRoot: string;
  let nodePathDir: string;

  beforeEach(() => {
    // realpath: macOS hands out /var paths that Node's resolution reports back as /private/var.
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-node-path-')));
    projectRoot = path.join(root, 'project');
    nodePathDir = path.join(root, 'elsewhere');
    writePackage(path.join(projectRoot, 'node_modules'), 'in-project');
    writePackage(nodePathDir, 'only-on-node-path');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  /** Resolve in a real Node process, with `NODE_PATH` pointing at `elsewhere`. */
  function resolveInChild(moduleId: string, params?: { skipNodePath?: boolean }): string | null {
    const script = path.join(root, 'resolve.js');
    fs.writeFileSync(
      script,
      `const { resolveFrom } = require(${JSON.stringify(LIBRARY)});\n` +
        `console.log(JSON.stringify(resolveFrom(${JSON.stringify(projectRoot)}, ${JSON.stringify(moduleId)}, ${JSON.stringify(params ?? null)}) ?? null));\n`
    );
    const stdout = execFileSync('node', [script], {
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: nodePathDir },
    });
    return JSON.parse(stdout);
  }

  it(`finds a package through NODE_PATH by default`, () => {
    expect(resolveInChild('only-on-node-path/package.json')).toBe(
      path.join(nodePathDir, 'only-on-node-path', 'package.json')
    );
  });

  // The reason `skipNodePath` exists: whether a project depends on something must not be
  // answerable by what its neighbours depend on. pnpm's bin shims point NODE_PATH at the
  // workspace's virtual store, which holds every package any workspace member asked for.
  it(`does not find it when skipNodePath is set`, () => {
    expect(resolveInChild('only-on-node-path/package.json', { skipNodePath: true })).toBeNull();
  });

  it(`still finds the project's own packages when skipNodePath is set`, () => {
    expect(resolveInChild('in-project/package.json', { skipNodePath: true })).toBe(
      path.join(projectRoot, 'node_modules', 'in-project', 'package.json')
    );
  });
});
