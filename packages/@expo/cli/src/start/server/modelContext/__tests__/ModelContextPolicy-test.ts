import {
  classifyOwner,
  evaluatePolicy,
  parseModelContextPolicy,
  resolveToolOwnerAsync,
} from '../ModelContextPolicy';

jest.mock('../../../../log');

const PROJECT_ROOT = '/app';
const POLICY = { allowedPackages: [], deniedTools: [], allowRemoteDevices: false };

describe(parseModelContextPolicy, () => {
  it('returns an empty policy without config', () => {
    expect(parseModelContextPolicy(undefined)).toEqual(POLICY);
    expect(parseModelContextPolicy({ extra: {} })).toEqual(POLICY);
  });

  it('reads expo.extra.modelContext', () => {
    expect(
      parseModelContextPolicy({
        extra: {
          modelContext: {
            allowedPackages: ['expo-sqlite'],
            deniedTools: ['dump-db'],
            allowRemoteDevices: true,
          },
        },
      })
    ).toEqual({
      allowedPackages: ['expo-sqlite'],
      deniedTools: ['dump-db'],
      allowRemoteDevices: true,
    });
  });

  it('ignores invalid config', () => {
    expect(
      parseModelContextPolicy({ extra: { modelContext: { enabled: true, allowedPackages: 'x' } } })
    ).toEqual(POLICY);
  });
});

describe(classifyOwner, () => {
  it('attributes project files to the app', () => {
    expect(classifyOwner(['/app/src/screens/Todo.tsx'], PROJECT_ROOT)).toEqual({
      kind: 'project',
      file: '/app/src/screens/Todo.tsx',
    });
    expect(classifyOwner(['app/index.tsx'], PROJECT_ROOT)).toMatchObject({ kind: 'project' });
  });

  it('attributes node_modules files to their innermost package', () => {
    expect(classifyOwner(['/app/node_modules/expo-sqlite/build/index.js'], PROJECT_ROOT)).toEqual({
      kind: 'package',
      name: 'expo-sqlite',
      file: '/app/node_modules/expo-sqlite/build/index.js',
    });
    expect(classifyOwner(['node_modules/@scope/pkg/dist/tools.js'], PROJECT_ROOT)).toMatchObject({
      kind: 'package',
      name: '@scope/pkg',
    });
    expect(
      classifyOwner(['/app/node_modules/a/node_modules/b/index.js'], PROJECT_ROOT)
    ).toMatchObject({ kind: 'package', name: 'b' });
  });

  it('skips registry and React frames', () => {
    expect(
      classifyOwner(
        [
          '/app/node_modules/@expo/devtools/build/modelContext/ModelContextClient.js',
          '/app/node_modules/@expo/devtools/build/modelContext/hooks.js',
          '/app/src/App.tsx',
          '/app/node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js',
        ],
        PROJECT_ROOT
      )
    ).toMatchObject({ kind: 'project', file: '/app/src/App.tsx' });
  });

  it('returns unknown for files outside the project and for empty stacks', () => {
    expect(classifyOwner(['/elsewhere/file.js'], PROJECT_ROOT)).toEqual({ kind: 'unknown' });
    expect(classifyOwner([], PROJECT_ROOT)).toEqual({ kind: 'unknown' });
    expect(
      classifyOwner(['<native>', null, 'http://localhost:8081/index.bundle'], PROJECT_ROOT)
    ).toEqual({ kind: 'unknown' });
  });
});

describe(evaluatePolicy, () => {
  const sqlite = { kind: 'package' as const, name: 'expo-sqlite' };

  it('allows project tools and blocks package tools unless allowed', () => {
    expect(evaluatePolicy({ kind: 'project' }, 'add-todo', POLICY, true)).toEqual({
      allowed: true,
    });
    expect(evaluatePolicy(sqlite, 'query', POLICY, true)).toEqual({
      allowed: false,
      reason: 'package-not-allowed',
    });
    expect(
      evaluatePolicy(sqlite, 'query', { ...POLICY, allowedPackages: ['expo-sqlite'] }, true)
    ).toEqual({ allowed: true });
  });

  it('denied tools win over every owner', () => {
    const policy = { ...POLICY, allowedPackages: ['expo-sqlite'], deniedTools: ['drop-db'] };
    expect(evaluatePolicy({ kind: 'project' }, 'drop-db', policy, true)).toEqual({
      allowed: false,
      reason: 'denied-tool',
    });
  });

  it('blocks unknown owners and untrusted connections', () => {
    expect(evaluatePolicy({ kind: 'unknown' }, 'x', POLICY, true)).toEqual({
      allowed: false,
      reason: 'unknown-owner',
    });
    expect(evaluatePolicy({ kind: 'project' }, 'x', POLICY, false)).toEqual({
      allowed: false,
      reason: 'untrusted-connection',
    });
    expect(
      evaluatePolicy({ kind: 'project' }, 'x', { ...POLICY, allowRemoteDevices: true }, false)
    ).toEqual({ allowed: true });
  });
});

describe(resolveToolOwnerAsync, () => {
  const HERMES_STACK = [
    'Error',
    '    at registerTool (http://localhost:8081/index.bundle?platform=ios&dev=true:1200:30)',
    '    at TodoScreen (http://localhost:8081/index.bundle?platform=ios&dev=true:3400:12)',
  ].join('\n');

  it('symbolicates bundle frames through Metro and classifies the result', async () => {
    const symbolicateStack = jest.fn(async (_frames: unknown) => ({
      stack: [
        { file: '/app/node_modules/@expo/devtools/build/modelContext/ModelContextClient.js' },
        { file: '/app/src/TodoScreen.tsx' },
      ] as any,
    }));
    await expect(
      resolveToolOwnerAsync({ stack: HERMES_STACK, projectRoot: PROJECT_ROOT, symbolicateStack })
    ).resolves.toEqual({ kind: 'project', file: '/app/src/TodoScreen.tsx' });
    expect((symbolicateStack.mock.calls[0]![0] as any[])[0]).toMatchObject({
      lineNumber: 1200,
      column: 29,
    });
  });

  it('classifies without symbolication when frames already point at files', async () => {
    const symbolicateStack = jest.fn();
    await expect(
      resolveToolOwnerAsync({
        stack: 'Error\n    at register (/app/node_modules/some-pkg/index.js:1:1)',
        projectRoot: PROJECT_ROOT,
        symbolicateStack,
      })
    ).resolves.toMatchObject({ kind: 'package', name: 'some-pkg' });
    expect(symbolicateStack).not.toHaveBeenCalled();
  });

  it('returns unknown without a stack or when symbolication fails', async () => {
    await expect(
      resolveToolOwnerAsync({ stack: undefined, projectRoot: PROJECT_ROOT })
    ).resolves.toEqual({ kind: 'unknown' });
    await expect(
      resolveToolOwnerAsync({
        stack: HERMES_STACK,
        projectRoot: PROJECT_ROOT,
        symbolicateStack: jest.fn(async () => {
          throw new Error('offline');
        }),
      })
    ).resolves.toEqual({ kind: 'unknown' });
  });
});
