// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
import { buildUndoFollowUps } from '../followups';

describe(buildUndoFollowUps, () => {
  it(`should suggest nothing when only source files were restored`, () => {
    expect(buildUndoFollowUps({ paths: ['app/index.tsx', 'src/util.ts'] })).toEqual([]);
  });

  it(`should suggest reinstalling dependencies when package.json was restored`, () => {
    const followups = buildUndoFollowUps({ paths: ['package.json'] });

    expect(followups.map((followup) => followup.id)).toEqual(['install-dependencies']);
    expect(followups[0]!.command).toBe('npm install');
  });

  it(`should suggest a rebuild when native project files were restored`, () => {
    expect(buildUndoFollowUps({ paths: ['ios/Podfile'] }).map((followup) => followup.id)).toEqual([
      'dev',
    ]);
    expect(
      buildUndoFollowUps({ paths: ['android/app/build.gradle'] }).map((followup) => followup.id)
    ).toEqual(['dev']);
    expect(buildUndoFollowUps({ paths: ['app.json'] }).map((followup) => followup.id)).toEqual([
      'dev',
    ]);
    expect(buildUndoFollowUps({ paths: ['app.config.ts'] }).map((followup) => followup.id)).toEqual(
      ['dev']
    );
  });

  it(`should put the dependency install first when both apply`, () => {
    const followups = buildUndoFollowUps({ paths: ['package.json', 'ios/Podfile'] });

    expect(followups.map((followup) => followup.id)).toEqual(['install-dependencies', 'dev']);
  });

  it(`should read package.json in a nested project as a dependency change`, () => {
    expect(
      buildUndoFollowUps({ paths: ['apps/mobile/package.json'] }).map((followup) => followup.id)
    ).toEqual(['install-dependencies']);
  });
});
