// @ref llp/0009-smart-followups.rfc.md §Examples per command — the interaction commands.
// @ref llp/0018-interaction-commands.rfc.md §Eight shipped decisions — friction run 7, F75.
//
// The three commands printed no `Suggested next:` at all, while every other command in the surface
// chains. `runtime:tree` in particular ends exactly where `runtime:tap <testID>` begins, and the
// testID it should name is one the walk has already read.

import { buildTapFollowUps, buildTreeFollowUps, buildTypeFollowUps } from '../interact';

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

function commands(followups: { command: string }[]): string[] {
  return followups.map((followup) => followup.command);
}

describe(buildTreeFollowUps, () => {
  const screenNodes = [
    { testID: 'name-input', handlers: ['onChangeText'], disabled: false },
    { testID: 'inc-btn', handlers: ['onPress'], disabled: false },
    { testID: 'disabled-btn', handlers: ['onPress'], disabled: true },
  ];

  it(`names a testID the walk actually found, not a placeholder`, () => {
    const followups = buildTreeFollowUps({ nodes: screenNodes, testID: null, platform: null });

    expect(commands(followups)[0]).toBe('npx @expo/agent-cli runtime:tap inc-btn --verify');
    expect(ids(followups)).toContain('tap-element');
  });

  it(`never suggests tapping an element the app reports as disabled`, () => {
    const followups = buildTreeFollowUps({
      nodes: [{ testID: 'disabled-btn', handlers: ['onPress'], disabled: true }],
      testID: null,
      platform: null,
    });

    expect(commands(followups).join(' ')).not.toContain('disabled-btn');
  });

  it(`offers the input it found as somewhere to type`, () => {
    const followups = buildTreeFollowUps({ nodes: screenNodes, testID: null, platform: null });

    expect(commands(followups)).toContain(
      'npx @expo/agent-cli runtime:type "hello" --testID name-input'
    );
  });

  it(`carries the platform the caller named into every command`, () => {
    const followups = buildTreeFollowUps({ nodes: screenNodes, testID: null, platform: 'android' });

    for (const command of commands(followups)) {
      expect(command).toContain('--android');
    }
  });

  it(`sends a screen with no testID at all somewhere useful`, () => {
    const followups = buildTreeFollowUps({ nodes: [], testID: null, platform: null });

    expect(ids(followups)).toEqual(['tree-all']);
    expect(commands(followups)[0]).toBe('npx @expo/agent-cli runtime:tree --all');
  });

  it(`taps the element a --testID run was about`, () => {
    const followups = buildTreeFollowUps({
      nodes: [{ testID: 'inc-btn', handlers: ['onPress'], disabled: false }],
      testID: 'inc-btn',
      platform: null,
    });

    expect(commands(followups)[0]).toBe('npx @expo/agent-cli runtime:tap inc-btn --verify');
  });

  it(`quotes a testID a shell would split`, () => {
    const followups = buildTreeFollowUps({
      nodes: [{ testID: 'add note', handlers: ['onPress'], disabled: false }],
      testID: null,
      platform: null,
    });

    expect(commands(followups)[0]).toBe('npx @expo/agent-cli runtime:tap "add note" --verify');
  });
});

describe(buildTapFollowUps, () => {
  it(`offers the proof the run did not ask for`, () => {
    const followups = buildTapFollowUps({
      testID: 'inc-btn',
      verified: false,
      changed: null,
      platform: null,
    });

    expect(commands(followups)[0]).toBe('npx @expo/agent-cli runtime:tap inc-btn --verify');
    expect(followups[0]!.why).toMatch(/proof|changed/i);
  });

  it(`asks about errors when the tap was verified and nothing changed`, () => {
    const followups = buildTapFollowUps({
      testID: 'inc-btn',
      verified: true,
      changed: false,
      platform: null,
    });

    expect(ids(followups)[0]).toBe('runtime-errors');
    expect(commands(followups)[0]).toBe('npx @expo/agent-cli runtime:errors --fail-on-error');
  });

  it(`reads the screen it changed when the diff saw something`, () => {
    const followups = buildTapFollowUps({
      testID: 'inc-btn',
      verified: true,
      changed: true,
      platform: 'ios',
    });

    expect(ids(followups)).toContain('read-screen');
    expect(commands(followups)).toContain('npx @expo/agent-cli runtime:tree --ios');
  });
});

describe(buildTypeFollowUps, () => {
  it(`offers the submit the run did not make`, () => {
    const followups = buildTypeFollowUps({
      testID: 'name-input',
      text: 'alice',
      submitted: false,
      submitRequested: false,
      platform: null,
    });

    expect(commands(followups)[0]).toBe(
      'npx @expo/agent-cli runtime:type "alice" --testID name-input --submit'
    );
  });

  it(`sends a run that did submit to the tree that shows what changed`, () => {
    const followups = buildTypeFollowUps({
      testID: 'name-input',
      text: 'alice',
      submitted: true,
      submitRequested: true,
      platform: null,
    });

    expect(ids(followups)[0]).toBe('read-screen');
  });

  it(`points at the button that consumes the text, which only the tree can name`, () => {
    const followups = buildTypeFollowUps({
      testID: 'name-input',
      text: 'alice',
      submitted: false,
      submitRequested: false,
      platform: null,
    });

    expect(ids(followups)).toContain('find-button');
    expect(commands(followups)).toContain('npx @expo/agent-cli runtime:tree');
  });

  it(`carries text that would break a shell line through JSON quoting`, () => {
    const followups = buildTypeFollowUps({
      testID: 'name-input',
      text: 'he said "hi"',
      submitted: false,
      submitRequested: false,
      platform: null,
    });

    expect(commands(followups)[0]).toContain('"he said \\"hi\\""');
  });
});
