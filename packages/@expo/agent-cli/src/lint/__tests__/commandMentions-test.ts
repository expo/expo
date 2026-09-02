import {
  extractCommandMentions,
  extractSuggestions,
  extractTextMentions,
  INTERPOLATION_TOKEN,
} from '../commandMentions';

const at = (source: string) => extractCommandMentions('src/example.ts', source);

describe(extractCommandMentions, () => {
  it(`finds a command in a plain string, and reads its name and arguments`, () => {
    expect(at(`const x = 'npx @expo/agent-cli dev:stop --json';`)).toEqual([
      {
        file: 'src/example.ts',
        line: 1,
        role: 'message',
        literal: 'npx @expo/agent-cli dev:stop --json',
        text: 'npx @expo/agent-cli dev:stop --json',
        command: 'dev:stop',
        args: ['--json'],
        dynamic: false,
      },
    ]);
  });

  it(`stops at the quote a sentence wraps the command in`, () => {
    const [mention] = at(
      `const x = 'Run "npx @expo/agent-cli dev:stop" first, then start it again.';`
    );
    expect(mention?.text).toBe('npx @expo/agent-cli dev:stop');
    expect(mention?.args).toEqual([]);
  });

  it(`stops at a chalk tag, so a usage line is the command and not the formatting`, () => {
    const [mention] = at('const x = chalk`npx @expo/agent-cli typecheck {dim [options]}`;');
    expect(mention?.text).toBe('npx @expo/agent-cli typecheck');
  });

  it(`stops at the em dash that separates a command from its gloss`, () => {
    const [mention] = at(
      "const x = 'npx @expo/agent-cli status — where the project is right now';"
    );
    expect(mention?.text).toBe('npx @expo/agent-cli status');
  });

  it(`reads two commands out of one shell line joined with &&`, () => {
    expect(
      at("const x = 'npx @expo/agent-cli dev:stop && npx @expo/agent-cli dev --detach';").map(
        (m) => m.text
      )
    ).toEqual(['npx @expo/agent-cli dev:stop', 'npx @expo/agent-cli dev --detach']);
  });

  it(`keeps an interpolation as one token rather than cutting the command at it`, () => {
    const [mention] = at('const x = `npx @expo/agent-cli skills:show ${pkg} --json`;');
    expect(mention?.text).toBe(`npx @expo/agent-cli skills:show ${INTERPOLATION_TOKEN} --json`);
    expect(mention?.command).toBe('skills:show');
    expect(mention?.args).toEqual([INTERPOLATION_TOKEN, '--json']);
    expect(mention?.dynamic).toBe(true);
  });

  it(`reads a mention out of a nested template exactly once`, () => {
    const mentions = at('const x = `read ${`npx @expo/agent-cli status`} for this`;');
    expect(mentions.map((m) => m.text)).toEqual(['npx @expo/agent-cli status']);
  });

  it(`finds nothing in a comment, because a comment is not printed`, () => {
    expect(at(`// see "npx @expo/agent-cli nonsense" for this\nconst x = 1;`)).toEqual([]);
  });

  it(`reports the line the literal starts on`, () => {
    const [mention] = at(`const a = 1;\nconst b = 2;\nconst c = 'npx @expo/agent-cli status';`);
    expect(mention?.line).toBe(3);
  });

  describe('roles', () => {
    it(`reads a suggestedCommand assignment as the "Try:" line it becomes`, () => {
      const [mention] = at(`error.suggestedCommand = 'npx @expo/agent-cli dev:logs';`);
      expect(mention?.role).toBe('suggested-command');
    });

    it(`reads a suggestedCommand property, including one behind a function`, () => {
      expect(at(`const rule = { suggestedCommand: 'npx @expo/agent-cli doctor' };`)[0]?.role).toBe(
        'suggested-command'
      );
      expect(
        at(`const rule = { suggestedCommand: () => 'npx @expo/agent-cli doctor' };`)[0]?.role
      ).toBe('suggested-command');
    });

    it(`reads a command beside a why as a follow-up rung`, () => {
      const [mention] = at(
        `const f = { id: 'dev', command: 'npx @expo/agent-cli dev --yes', why: 'because' };`
      );
      expect(mention?.role).toBe('followup-command');
    });

    it(`does not read a command with no why as a follow-up rung`, () => {
      // `NeedsHuman.command` is a `command` too, and it is a command for a *person*: the
      // placeholder rule for a machine-runnable rung must not be applied to it by accident.
      const [mention] = at(`const h = { scenario: 'x', command: 'npx @expo/agent-cli status' };`);
      expect(mention?.role).toBe('message');
    });
  });
});

describe(extractSuggestions, () => {
  it(`takes the whole suggestion, whichever CLI it names`, () => {
    expect(
      extractSuggestions('src/example.ts', `error.suggestedCommand = 'npx eas login';`)
    ).toEqual([
      {
        file: 'src/example.ts',
        line: 1,
        role: 'suggested-command',
        text: 'npx eas login',
      },
    ]);
  });

  it(`takes the outermost literal, not the fragments a template is built from`, () => {
    const suggestions = extractSuggestions(
      'src/example.ts',
      'const f = { id: "x", command: `npx @expo/agent-cli build:wait ${id}${sub ? " --submission" : ""}`, why: "w" };'
    );
    expect(suggestions.map((s) => s.text)).toEqual([
      `npx @expo/agent-cli build:wait ${INTERPOLATION_TOKEN}${INTERPOLATION_TOKEN}`,
    ]);
  });

  it(`ignores a command in prose, which is not a suggestion`, () => {
    expect(
      extractSuggestions('src/example.ts', `const x = 'run npx @expo/agent-cli status';`)
    ).toEqual([]);
  });
});

describe(extractTextMentions, () => {
  it(`reads a markdown file a line at a time`, () => {
    expect(
      extractTextMentions(
        'README.md',
        '# Title\n\nRun `npx @expo/agent-cli dev --detach` to start.\n'
      )
    ).toEqual([
      {
        file: 'README.md',
        line: 3,
        role: 'message',
        literal: 'Run `npx @expo/agent-cli dev --detach` to start.',
        text: 'npx @expo/agent-cli dev --detach',
        command: 'dev',
        args: ['--detach'],
        dynamic: false,
      },
    ]);
  });
});
