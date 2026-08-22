import type { ProjectState } from '../../project/types';
import { generateAgentsMdBlock } from '../content';

function createProjectState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    projectRoot: '/project',
    sdkVersion: '54.0.0',
    nativeDirs: { ios: false, android: false },
    usesDevClient: false,
    hasWeb: false,
    expoGo: { compatible: true, reasons: [] },
    fingerprint: { hash: 'abc123', error: undefined },
    ...overrides,
  };
}

describe(generateAgentsMdBlock, () => {
  it('should describe the project of a CNG app that Expo Go can run', () => {
    const block = generateAgentsMdBlock({
      state: createProjectState(),
      projectName: 'my-app',
      skillsDirs: ['.claude/skills'],
    });

    expect(block).toContain('my-app');
    expect(block).toContain('54.0.0');
    expect(block).toContain('CNG');
    expect(block).toContain('Expo Go: compatible');
    expect(block).toContain('expo-dev-client` is not installed');
    expect(block).toContain('.claude/skills');
  });

  it('should report a bare project with its checked-in native directories', () => {
    const block = generateAgentsMdBlock({
      state: createProjectState({ nativeDirs: { ios: true, android: true } }),
      projectName: 'bare-app',
      skillsDirs: [],
    });

    expect(block).toContain('bare');
    expect(block).toContain('ios, android');
    expect(block).not.toContain('CNG');
  });

  it('should report why Expo Go cannot run the project', () => {
    const block = generateAgentsMdBlock({
      state: createProjectState({
        expoGo: {
          compatible: false,
          reasons: [
            {
              kind: 'unbundled-native-module',
              packageName: 'fake-native-module',
              detail: 'not bundled in Expo Go',
            },
          ],
        },
        usesDevClient: true,
      }),
      projectName: 'dev-client-app',
      skillsDirs: ['.claude/skills'],
    });

    expect(block).toContain('Expo Go: not compatible');
    expect(block).toContain('1 reason');
    expect(block).toContain('expo-dev-client` is installed');
  });

  it('should report an unresolvable SDK version instead of omitting the line', () => {
    const block = generateAgentsMdBlock({
      state: createProjectState({ sdkVersion: null }),
      projectName: null,
      skillsDirs: [],
    });

    expect(block).toContain('SDK: unknown');
  });

  it('should list every command of the cheat sheet', () => {
    const block = generateAgentsMdBlock({
      state: createProjectState(),
      projectName: 'my-app',
      skillsDirs: ['.claude/skills'],
    });

    for (const command of [
      'exagent status',
      'exagent context --json',
      'exagent start --smart',
      'exagent start --plan',
      'exagent install',
      'exagent runtime eval',
      'exagent runtime errors',
      'exagent navigate',
      'exagent skills list',
    ]) {
      expect(block).toContain(command);
    }
  });

  it('should point at the setup command when no skills directory is configured', () => {
    const block = generateAgentsMdBlock({
      state: createProjectState(),
      projectName: 'my-app',
      skillsDirs: [],
    });

    expect(block).toContain('exagent setup');
    expect(block).not.toContain('.claude/skills');
  });

  it('should generate the same block twice, so a rerun rewrites nothing', () => {
    const context = {
      state: createProjectState(),
      projectName: 'my-app',
      skillsDirs: ['.claude/skills'],
    };

    expect(generateAgentsMdBlock(context)).toBe(generateAgentsMdBlock(context));
  });

  it('should never leak the absolute project path into a committed file', () => {
    const block = generateAgentsMdBlock({
      state: createProjectState({ projectRoot: '/Users/someone/secret-dir/my-app' }),
      projectName: 'my-app',
      skillsDirs: [],
    });

    expect(block).not.toContain('/Users/someone/secret-dir');
  });
});
