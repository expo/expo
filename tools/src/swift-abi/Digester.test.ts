import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isBreakingFinding, parseDigesterReport } from './Digester';

const RECORD_DECODE_REPORT = `
/* Generic Signature Changes */

/* RawRepresentable Changes */

/* Removed Decls */
Func Record.decode(_:in:) has been removed

/* Moved Decls */

/* Renamed Decls */

/* Type Changes */

/* Decl Attribute changes */

/* Others */
`;

describe('parseDigesterReport', () => {
  it('keeps the section of each finding', () => {
    assert.deepEqual(parseDigesterReport(RECORD_DECODE_REPORT), [
      { section: 'Removed Decls', message: 'Func Record.decode(_:in:) has been removed' },
    ]);
  });

  it('returns nothing for an empty report', () => {
    const empty = RECORD_DECODE_REPORT.replace('Func Record.decode(_:in:) has been removed\n', '');
    assert.deepEqual(parseDigesterReport(empty), []);
  });
});

describe('isBreakingFinding', () => {
  it('drops availability notes', () => {
    assert.equal(
      isBreakingFinding({
        section: 'Decl Attribute changes',
        message: "Class ArgumentCastException is a new API without '@available'",
      }),
      false
    );
  });

  it('keeps removals, renames and final changes', () => {
    for (const [section, message] of [
      ['Removed Decls', 'Func Record.decode(_:in:) has been removed'],
      [
        'Renamed Decls',
        'Func ClassRegistry.register(nativeClassId:javaScriptClass:) has been renamed to Func register(nativeClassId:prototype:)',
      ],
      ['Decl Attribute changes', 'Var AppContext.runtime is now without final'],
    ]) {
      assert.equal(isBreakingFinding({ section, message }), true, message);
    }
  });
});
