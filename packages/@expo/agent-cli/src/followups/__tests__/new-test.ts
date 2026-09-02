import { buildNewFollowUps } from '../new';

describe(buildNewFollowUps, () => {
  it(`should name the commands that orient, run and wire up the new project`, () => {
    expect(buildNewFollowUps({ directory: 'my-app', installed: true })).toEqual([
      expect.objectContaining({ id: 'status', command: 'cd my-app && npx @expo/agent-cli status' }),
      expect.objectContaining({
        id: 'dev',
        command: 'cd my-app && npx @expo/agent-cli dev',
      }),
      expect.objectContaining({
        id: 'agents-setup',
        command: 'cd my-app && npx @expo/agent-cli agents:setup',
      }),
    ]);
  });

  it(`should ask for the skipped install first`, () => {
    // Nothing else in the list can work before `node_modules` exists.
    const followups = buildNewFollowUps({ directory: 'my-app', installed: false });

    expect(followups[0]).toEqual(
      expect.objectContaining({ id: 'install-dependencies', command: 'cd my-app && npm install' })
    );
    expect(followups).toHaveLength(3);
  });

  it(`should keep the directory as typed, so the commands can be pasted`, () => {
    expect(buildNewFollowUps({ directory: 'apps/my-app', installed: true })[0]!.command).toBe(
      'cd apps/my-app && npx @expo/agent-cli status'
    );
  });

  it(`should never print more than the three lines a follow-up block allows`, () => {
    expect(buildNewFollowUps({ directory: 'my-app', installed: false })).toHaveLength(3);
    expect(buildNewFollowUps({ directory: 'my-app', installed: true })).toHaveLength(3);
  });
});
