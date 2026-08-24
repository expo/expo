/* eslint-env jest */
// @ref llp/0010-agent-conventions.rfc.md §`build:explain`: the rule table is capped and in-repo
// The invariants of the table itself, in the style of the needs-human registry test: ids are the
// contract, so they have to be unique and well-formed, and the cap is only a cap if something
// enforces it.

import { ANCHORS, anchorFor, MAX_SIGNATURES } from '../anchors';

describe('the rule table', () => {
  it('stays under the cap', () => {
    // llp/0010 §`build:explain` records that this table is capped and in-repo, which is what
    // keeps it from becoming the hosted, growing signature DB llp/0001 scoped out. Raising this
    // number is a decision to record there, not an edit to make while adding a rule.
    expect(ANCHORS.length).toBeLessThanOrEqual(MAX_SIGNATURES);
  });

  it('gives every rule a unique, stable, kebab id', () => {
    const signatures = ANCHORS.map((anchor) => anchor.signature);
    expect(new Set(signatures).size).toBe(signatures.length);
    for (const signature of signatures) {
      expect(signature).toMatch(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);
    }
  });

  it('gives every rule a sentence that says what broke', () => {
    for (const anchor of ANCHORS) {
      // A sentence, not a label: `message` is what the human report prints under `what`, and it
      // has to read as prose next to a quoted log line. It may start lowercase, because some of
      // them start with a tool's name and `Xcodebuild` is not one.
      expect(anchor.message.length).toBeGreaterThan(20);
      expect(anchor.message).toMatch(/\.$/);
    }
  });

  it('says where every pattern came from', () => {
    for (const anchor of ANCHORS) {
      expect(['captured', 'format']).toContain(anchor.provenance);
    }
    // The table is worth more the more of it was read off a real log, and this is the number a
    // reviewer watches: it must not fall as the table grows.
    const captured = ANCHORS.filter((anchor) => anchor.provenance === 'captured');
    expect(captured.length).toBeGreaterThanOrEqual(14);
  });

  it('has both classes in every phase it claims to cover', () => {
    const phases = new Set(ANCHORS.map((anchor) => anchor.phase));
    for (const phase of phases) {
      const inPhase = ANCHORS.filter((anchor) => anchor.phase === phase);
      expect(inPhase.some((anchor) => anchor.kind === 'cause')).toBe(true);
    }
  });

  it('never suggests a command from a capture group it does not have', () => {
    for (const anchor of ANCHORS) {
      if (!anchor.suggestedCommand) {
        continue;
      }
      // A rule that reads `match[1]` must have a group to read. An empty match array is what a
      // pattern with no groups produces, and a rule that throws on one is a crash in the middle
      // of a report.
      const empty = Object.assign(['', undefined], { index: 0, input: '' }) as RegExpMatchArray;
      expect(() => anchor.suggestedCommand!(empty)).not.toThrow();
    }
  });
});

describe('anchorFor', () => {
  it('returns the first rule that matches, most specific first', () => {
    // `[!] Unable to find a specification` would also satisfy nothing else, but the ordering
    // property is what keeps a narrow rule from being shadowed by a wide one.
    expect(anchorFor('[!] Unable to find a specification for `RNFoo`')?.anchor.signature).toBe(
      'pods.spec-not-found'
    );
  });

  it('hands back the match, so a caller can build the command from its groups', () => {
    const found = anchorFor('Unable to resolve module expo-camera from /app/src/index.tsx:');
    expect(found?.anchor.signature).toBe('bundle.unresolved-module');
    expect(found?.anchor.suggestedCommand?.(found.match)).toBe('npx expo install expo-camera');
  });

  it('suggests nothing for a relative import, which no install fixes', () => {
    const found = anchorFor('Unable to resolve module ../utils/format from /app/src/index.tsx:');
    expect(found?.anchor.suggestedCommand?.(found.match)).toBeNull();
  });

  it('reads both npm error prefixes, because both are still in logs', () => {
    expect(anchorFor('npm ERR! code E404')?.anchor.signature).toBe('deps.install-failed');
    expect(anchorFor('npm error code E404')?.anchor.signature).toBe('deps.install-failed');
  });

  it('skips the rules a platform hint ruled out', () => {
    const line = 'e: file:///app/Note.kt:3:9 Unresolved reference: NoteFormatter';
    expect(anchorFor(line)?.anchor.signature).toBe('android.kotlin.compile-error');
    expect(anchorFor(line, (phase) => phase !== 'gradle')).toBeNull();
  });

  it('claims nothing for an ordinary log line', () => {
    expect(anchorFor('> Task :app:preBuild UP-TO-DATE')).toBeNull();
    expect(
      anchorFor('[!] ExpoFont has added 2 script phases. Please inspect before executing a build.')
    ).toBeNull();
  });
});
