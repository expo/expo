import { parseInstallCheckOutput } from '../parseInstallCheckOutput';

// Mock chalk to return plain text for easier testing
jest.mock('chalk', () => {
  const mockChalk = (text: string) => text;
  mockChalk.bold = (text: string) => text;
  mockChalk.red = (text: string) => text;
  mockChalk.green = (text: string) => text;
  mockChalk.yellow = (text: string) => text;
  mockChalk.cyan = (text: string) => text;
  mockChalk.magenta = (text: string) => text;
  mockChalk.blue = (text: string) => text;
  mockChalk.dim = {
    blue: (text: string) => text,
  };
  return mockChalk;
});

describe('parseInstallCheckOutput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle empty stdout', () => {
    const issues: string[] = [];
    parseInstallCheckOutput('', issues, 54);
    expect(issues).toHaveLength(0);
  });

  it('should handle upToDate packages', () => {
    const stdout = JSON.stringify({
      upToDate: true,
      dependencies: [],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);
    expect(issues).toHaveLength(0);
  });

  it('should format major version mismatches correctly', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'expo-image',
          expectedVersionOrRange: '~3.0.0',
          actualVersion: '2.5.0',
        },
      ],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    const output = issues[0];
    expect(output).toContain('❗ Major version mismatches');
    expect(output).toContain('expo-image');
    expect(output).toContain('~3.0.0');
    expect(output).toContain('2.5.0');
    expect(output).toContain('1 package out of date');
  });

  it('should format minor version mismatches correctly', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'expo-camera',
          expectedVersionOrRange: '~2.3.0',
          actualVersion: '2.1.0',
        },
      ],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    const output = issues[0];
    expect(output).toContain('⚠️ Minor version mismatches');
    expect(output).toContain('expo-camera');
    expect(output).toContain('~2.3.0');
    expect(output).toContain('2.1.0');
  });

  it('should format patch version mismatches correctly', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'expo-constants',
          expectedVersionOrRange: '~1.2.3',
          actualVersion: '1.2.1',
        },
      ],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    const output = issues[0];
    expect(output).toContain('🔧 Patch version mismatches');
    expect(output).toContain('expo-constants');
    expect(output).toContain('~1.2.3');
    expect(output).toContain('1.2.1');
  });

  it('should include changelog links only for expo packages', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'expo-image',
          expectedVersionOrRange: '~3.0.0',
          actualVersion: '2.5.0',
        },
        {
          packageName: 'react',
          expectedVersionOrRange: '^18.0.0',
          actualVersion: '17.0.2',
        },
      ],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    const output = issues[0];
    expect(output).toContain('Changelogs:');
    expect(output).toContain(
      'expo-image → https://github.com/expo/expo/blob/sdk-54/packages/expo-image/CHANGELOG.md'
    );
    expect(output).not.toContain('react →');
    expect(output).toContain('2 packages out of date');
  });

  it('should handle multiple package types and categorize them correctly', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'expo-image',
          expectedVersionOrRange: '~3.0.0',
          actualVersion: '2.5.0', // major
        },
        {
          packageName: 'expo-camera',
          expectedVersionOrRange: '~2.3.0',
          actualVersion: '2.1.0', // minor
        },
        {
          packageName: 'expo-constants',
          expectedVersionOrRange: '~1.2.3',
          actualVersion: '1.2.1', // patch
        },
        {
          packageName: 'react',
          expectedVersionOrRange: '^18.0.0',
          actualVersion: '17.0.2', // major, non-expo
        },
      ],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    const output = issues[0];

    // Should have all three section types
    expect(output).toContain('❗ Major version mismatches');
    expect(output).toContain('⚠️ Minor version mismatches');
    expect(output).toContain('🔧 Patch version mismatches');

    // Should contain all packages
    expect(output).toContain('expo-image');
    expect(output).toContain('expo-camera');
    expect(output).toContain('expo-constants');
    expect(output).toContain('react');

    // Should have changelog links for expo packages only
    expect(output).toContain('Changelogs:');
    expect(output).toContain('expo-image →');
    expect(output).toContain('expo-camera →');
    expect(output).toContain('expo-constants →');
    expect(output).not.toContain('react →');

    expect(output).toContain('4 packages out of date');
  });

  it('should skip packages that are already up to date', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'expo-image',
          expectedVersionOrRange: '~2.5.0',
          actualVersion: '2.5.0', // same version
        },
        {
          packageName: 'expo-camera',
          expectedVersionOrRange: '~2.3.0',
          actualVersion: '2.1.0', // different version
        },
      ],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    const output = issues[0];
    expect(output).not.toContain('expo-image');
    expect(output).toContain('expo-camera');
    expect(output).toContain('1 package out of date');
  });

  it('should handle JSON extraction from stdout with warnings', () => {
    const stdout = `
Some warning message here
Another warning line
{"upToDate": false, "dependencies": [{"packageName": "expo-image", "expectedVersionOrRange": "~3.0.0", "actualVersion": "2.5.0"}]}
More text after JSON
    `;
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    const output = issues[0];
    expect(output).toContain('expo-image');
    expect(output).toContain('~3.0.0');
    expect(output).toContain('2.5.0');
  });

  it('should fallback to raw output when JSON parsing fails', () => {
    const stdout = 'This is not JSON output';
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toBe('This is not JSON output');
  });

  it('should handle empty dependencies array', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [],
    });
    const issues: string[] = [];
    parseInstallCheckOutput(stdout, issues, 54);

    expect(issues).toHaveLength(0);
  });
});
