// The rules, on strings written for them. The sweep over the repository can only ever prove that
// the CLI is clean today; these prove the lint would say so if it were not.

import {
  checkCommandMentions,
  formatMentionProblems,
  type MentionProblem,
} from '../checkCommandMentions';
import type { CommandFlagSpec } from '../commandFlags';
import { extractCommandMentions, extractSuggestions } from '../commandMentions';

const FLAGS = new Map<string, CommandFlagSpec>([
  [
    'dev:stop',
    {
      command: 'dev:stop',
      flags: ['--json', '--timeout', '--help'],
      valueFlags: ['--timeout'],
      forwardsUnknownFlags: false,
      positionalArgs: 'own',
    },
  ],
  [
    'typecheck',
    {
      command: 'typecheck',
      flags: ['--json', '--project', '--help'],
      valueFlags: ['--project'],
      forwardsUnknownFlags: false,
      positionalArgs: 'none',
    },
  ],
  [
    'start',
    {
      command: 'start',
      flags: ['--help'],
      valueFlags: [],
      forwardsUnknownFlags: true,
      positionalArgs: 'own',
    },
  ],
]);

function check(source: string): MentionProblem[] {
  const file = 'src/example.ts';
  return checkCommandMentions(
    extractCommandMentions(file, source),
    extractSuggestions(file, source),
    FLAGS
  ).problems;
}

describe('rule 1 — the command resolves', () => {
  it(`passes a command, an action, a bare group and a forwarded expo command`, () => {
    expect(
      check(
        `const x = ['npx @expo/agent-cli dev:stop', 'npx @expo/agent-cli runtime', 'npx @expo/agent-cli prebuild', 'npx @expo/agent-cli add'];`
      )
    ).toEqual([]);
  });

  it(`passes the space form, because the registry resolves it`, () => {
    expect(check(`const x = 'npx @expo/agent-cli skills list';`)).toEqual([]);
  });

  it(`passes the launcher's own options`, () => {
    expect(
      check(
        `const x = ['npx @expo/agent-cli --help', 'npx @expo/agent-cli -v', 'npx @expo/agent-cli'];`
      )
    ).toEqual([]);
  });

  it(`catches a command that no longer exists`, () => {
    const [problem] = check(`error.suggestedCommand = 'npx @expo/agent-cli context --json';`);
    expect(problem?.rule).toBe('unknown-command');
    expect(problem?.why).toContain('UNKNOWN_COMMAND');
    expect(problem?.subject.text).toBe('npx @expo/agent-cli context --json');
  });

  it(`catches an action a group does not have`, () => {
    const [problem] = check(`const x = 'npx @expo/agent-cli runtime:screenshot';`);
    expect(problem?.rule).toBe('unknown-command');
    expect(problem?.why).toContain('is not an action of the "runtime" group');
  });

  it(`catches a group given options and no action, which exits 1`, () => {
    const [problem] = check(`const x = 'npx @expo/agent-cli runtime --json';`);
    expect(problem?.rule).toBe('unknown-command');
    expect(problem?.why).toContain('no default action');
  });

  it(`catches an option where the command should be`, () => {
    const [problem] = check(`const x = 'npx @expo/agent-cli --detach';`);
    expect(problem?.rule).toBe('unknown-command');
    expect(problem?.why).toContain('not one of the options the launcher itself takes');
  });

  it(`says nothing about a command name that is only known at runtime`, () => {
    expect(check('const x = `npx @expo/agent-cli ${command} --help`;')).toEqual([]);
  });
});

describe('rule 2 — the options exist on the command', () => {
  it(`passes an option the command's own parse accepts`, () => {
    expect(check(`const x = 'npx @expo/agent-cli dev:stop --timeout 90s --json';`)).toEqual([]);
  });

  it(`catches an option that belongs to another command`, () => {
    const [problem] = check(`const x = 'npx @expo/agent-cli dev:stop --tail 40';`);
    expect(problem?.rule).toBe('unknown-option');
    expect(problem?.why).toContain('"@expo/agent-cli dev:stop" has no --tail');
  });

  it(`reads --flag=value as the flag it is`, () => {
    expect(check(`const x = 'npx @expo/agent-cli dev:stop --timeout=90s';`)).toEqual([]);
    expect(check(`const x = 'npx @expo/agent-cli dev:stop --tail=40';`)).toHaveLength(1);
  });

  it(`says nothing about a command that forwards what it does not own`, () => {
    expect(check(`const x = 'npx @expo/agent-cli start --tunnel --web';`)).toEqual([]);
  });

  it(`says nothing about what follows a -- separator, which belongs to another tool`, () => {
    expect(check(`const x = 'npx @expo/agent-cli start -- --web --port 8082';`)).toEqual([]);
  });

  it(`says nothing about a command whose schema this scan could not read`, () => {
    expect(check(`const x = 'npx @expo/agent-cli navigate /notes --scheme myapp';`)).toEqual([]);
  });
});

describe('rule 3 — the arguments have somewhere to go', () => {
  it(`catches a positional argument on a command that reads none`, () => {
    const [problem] = check(
      `error.suggestedCommand = 'npx @expo/agent-cli typecheck src/app.tsx';`
    );
    expect(problem?.rule).toBe('stray-argument');
    expect(problem?.why).toContain('reads no positional arguments');
  });

  it(`does not mistake an option's value for a positional argument`, () => {
    expect(
      check(`const x = 'npx @expo/agent-cli typecheck --project tsconfig.json --json';`)
    ).toEqual([]);
    expect(check(`const x = 'npx @expo/agent-cli typecheck --project=tsconfig.json';`)).toEqual([]);
  });

  it(`does not mistake the action of a space-form command for a positional argument`, () => {
    // The registry strips the action while resolving, so what is checked is what the command
    // receives — `doctor check --json` is `doctor:check --json`, with nothing left over.
    expect(check(`const x = 'npx @expo/agent-cli doctor check';`)).toEqual([]);
  });

  it(`says nothing when a word of the command is only known at runtime`, () => {
    expect(check('const x = `npx @expo/agent-cli typecheck ${maybeAFlag}`;')).toEqual([]);
  });

  it(`says nothing about a command that reads its own arguments`, () => {
    expect(check(`const x = 'npx @expo/agent-cli dev:stop';`)).toEqual([]);
  });
});

describe('rule 4 — a suggestion is runnable as printed', () => {
  it(`catches a placeholder in a "Try:" line`, () => {
    const [problem] = check(`error.suggestedCommand = 'npx @expo/agent-cli navigate <route>';`);
    expect(problem?.rule).toBe('placeholder');
    expect(problem?.subject.role).toBe('suggested-command');
  });

  it(`catches a placeholder in a follow-up, whichever CLI it names`, () => {
    const [problem] = check(
      `const f = { id: 'x', command: 'npx eas build --profile <profile>', why: 'w' };`
    );
    expect(problem?.rule).toBe('placeholder');
    expect(problem?.subject.role).toBe('followup-command');
  });

  it(`allows a placeholder in prose and in a usage line, which are not commands to run`, () => {
    expect(
      check("const x = 'Usage: npx @expo/agent-cli inspect:build-log --file <path>';")
    ).toEqual([]);
  });

  it(`allows the documented suggestions that genuinely cannot be filled in`, () => {
    expect(
      check(
        `const f = { id: 'x', command: 'npx @expo/agent-cli inspect:build-log --file <path>', why: 'w' };`
      )
    ).toEqual([]);
  });

  it(`is not fooled by a shell redirection into calling it a placeholder`, () => {
    expect(
      check(`const f = { id: 'x', command: 'adb exec-out screencap -p > screen.png', why: 'w' };`)
    ).toEqual([]);
  });
});

describe(formatMentionProblems, () => {
  it(`names the file, the line, the rule, the string, the reason and the fix`, () => {
    const problems = check(
      `const a = 1;\nconst b = 2;\nerror.suggestedCommand = 'npx @expo/agent-cli context --json';`
    );
    const message = formatMentionProblems(problems);
    expect(message).toContain('src/example.ts:3');
    expect(message).toContain('[unknown-command]');
    expect(message).toContain('CommandError.suggestedCommand (the "Try:" line)');
    expect(message).toContain('Command: npx @expo/agent-cli context --json');
    expect(message).toContain('Why:');
    expect(message).toContain('Fix:');
  });

  it(`quotes the whole string a command was cut out of, flattened onto one line`, () => {
    const message = formatMentionProblems(
      check(
        'const x = \'Something failed.\\nHow: run "npx @expo/agent-cli context" for the report.\';'
      )
    );
    expect(message).toContain(
      'In:      Something failed. ⏎ How: run "npx @expo/agent-cli context"'
    );
  });
});

describe('what the check counts', () => {
  it(`reports how much of what it read it was able to answer for`, () => {
    const file = 'src/example.ts';
    const source = [
      `const a = 'npx @expo/agent-cli dev:stop --json';`,
      'const b = `npx @expo/agent-cli ${command} --help`;',
      `const c = { id: 'x', command: 'npx eas login', why: 'w' };`,
    ].join('\n');
    expect(
      checkCommandMentions(
        extractCommandMentions(file, source),
        extractSuggestions(file, source),
        FLAGS
      ).summary
    ).toEqual({
      total: 2,
      resolved: 1,
      unresolvable: 1,
      optionsChecked: 1,
      suggestions: 1,
    });
  });
});
