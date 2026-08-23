import {
  classifySubprocessFailure,
  isPromptShaped,
  lastNonEmptyLine,
  type SubprocessFailure,
} from '../detect';

/**
 * Recorded output, as each tool prints it.
 *
 * These are the strings the signatures exist for, copied from the source that writes them: the
 * table is only worth as much as the samples are real.
 */
const SAMPLES = {
  /** eas-cli 22.2.0, `build/user/SessionManager.js`. */
  easNotLoggedIn:
    'Either log in with eas login or set the EXPO_TOKEN environment variable if you’re using EAS CLI on CI (https://docs.expo.dev/accounts/programmatic-access/)',
  /** `packages/@expo/cli/src/utils/prompts.ts`. */
  expoNonInteractive:
    "Input is required, but 'npx expo' is in non-interactive mode.\nRequired input:\n> Which platform?",
  /** The wording the EAS CLI uses at its many other prompt sites. */
  easNonInteractive: 'Platform is required in non-interactive mode. Use the --platform flag.',
  /** eas-cli, the App Store Connect key setup. */
  ascApiKey:
    'A new App Store Connect API Key cannot be created in non-interactive mode. Provide one with EXPO_ASC_API_KEY_PATH.',
  /** create-launch, when nobody is signed in. */
  launchUnauthenticated:
    'You need to be authenticated with Expo before launching in non-interactive',
} as const;

/** A failed run of one tool, with the sample it printed on stderr. */
function failure(overrides: Partial<SubprocessFailure> = {}): SubprocessFailure {
  return { tool: 'eas', exitCode: 1, stdout: '', stderr: '', ...overrides };
}

describe(classifySubprocessFailure, () => {
  it('recognises the EAS CLI auth error', () => {
    expect(classifySubprocessFailure(failure({ stderr: SAMPLES.easNotLoggedIn }))).toEqual({
      scenario: 'eas-login',
      need: 'Sign in to an Expo account on this machine.',
      command: 'npx eas login',
      url: 'https://expo.dev/settings/access-tokens',
      unattendedEnv: ['EXPO_TOKEN'],
      resumable: true,
      detectedBy: 'exit-signature',
    });
  });

  it('recognises the Expo CLI non-interactive stop, and names the command that stopped', () => {
    const needsHuman = classifySubprocessFailure(
      failure({
        tool: 'expo',
        stderr: SAMPLES.expoNonInteractive,
        invocation: 'npx expo export --platform web',
      })
    );

    expect(needsHuman).toMatchObject({
      scenario: 'expo-prompt',
      command: 'npx expo export --platform web',
      detectedBy: 'exit-signature',
    });
  });

  it('falls back to the generic EAS scenario for a prompt it cannot name', () => {
    expect(
      classifySubprocessFailure(
        failure({ stderr: SAMPLES.easNonInteractive, invocation: 'npx eas deploy' })
      )
    ).toMatchObject({ scenario: 'eas-prompt', command: 'npx eas deploy' });
  });

  it('prefers the specific scenario over the generic one that also matches', () => {
    // The App Store Connect sentence ends in "non-interactive mode", which the generic EAS
    // signature matches too. Registry order is what keeps the answer specific.
    expect(classifySubprocessFailure(failure({ stderr: SAMPLES.ascApiKey }))).toMatchObject({
      scenario: 'asc-api-key-create',
    });
  });

  it('recognises the launch CLI refusing for lack of a login', () => {
    expect(
      classifySubprocessFailure(
        failure({ tool: 'create-launch', stderr: SAMPLES.launchUnauthenticated })
      )
    ).toMatchObject({ scenario: 'expo-login', command: 'npx expo login' });
  });

  it('never matches a signature against another tool’s output', () => {
    // The generic EAS signature would match this text; the tool it belongs to did not run.
    expect(
      classifySubprocessFailure(
        failure({ tool: 'create-launch', stderr: SAMPLES.easNonInteractive })
      )
    ).toBeNull();
  });

  it('answers null for a failure nobody has to fix by hand', () => {
    expect(
      classifySubprocessFailure(
        failure({ tool: 'expo', exitCode: 1, stderr: 'Unable to resolve module ./missing' })
      )
    ).toBeNull();
  });

  it('answers null for a tool that succeeded, whatever it printed', () => {
    expect(
      classifySubprocessFailure(failure({ exitCode: 0, stderr: SAMPLES.easNotLoggedIn }))
    ).toBeNull();
  });

  // Layer 4: the child was killed on a question, so the scenario is the tool's generic one and
  // the way it was found is the prompt, not the exit.
  it('answers the generic scenario for a killed prompt', () => {
    expect(
      classifySubprocessFailure(
        failure({
          tool: 'eas',
          exitCode: null,
          promptHang: '? Select a platform',
          invocation: 'npx eas deploy',
        })
      )
    ).toMatchObject({
      scenario: 'eas-prompt',
      command: 'npx eas deploy',
      detectedBy: 'prompt-pattern',
    });
  });

  it('answers null for a killed prompt of a tool with no generic scenario', () => {
    expect(
      classifySubprocessFailure(
        failure({ tool: 'create-launch', exitCode: null, promptHang: 'Password:' })
      )
    ).toBeNull();
  });
});

describe(isPromptShaped, () => {
  it.each([
    '? Select a platform',
    'Which platform would you like to build for?',
    'Do you want to continue (y/N)',
    'Overwrite the file? (Y/n)',
    'Password:',
    'Enter the keystore passphrase',
    'Apple ID:',
  ])('recognises %p as a question', (line) => {
    expect(isPromptShaped(line)).toBe(true);
  });

  it.each(['Bundling 1200 modules', 'Compiling native code', 'Uploading to EAS Hosting...', ''])(
    'does not mistake %p for a question',
    (line) => {
      expect(isPromptShaped(line)).toBe(false);
    }
  );
});

describe(lastNonEmptyLine, () => {
  it('skips the blank tail a prompt leaves behind', () => {
    expect(lastNonEmptyLine('Bundling\n? Select a platform\n\n   \n')).toBe('? Select a platform');
  });

  it('answers null when nothing was printed', () => {
    expect(lastNonEmptyLine('\n \n')).toBeNull();
  });
});
