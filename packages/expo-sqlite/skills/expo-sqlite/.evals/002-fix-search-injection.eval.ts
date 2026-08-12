import { agentEval, expect } from './setup';

// The seeded src/db.ts interpolates user input into a SQL string. A correct
// fix binds the parameter (?/$ placeholders or the db.sql tagged template).
// Escaping the apostrophe by hand would stop the crash but keep the injection.
agentEval(
  import.meta.url,
  {
    title: 'fix the crashing (and injectable) search query',
    prompt: `Users report that searching notes crashes the app when the search text contains an apostrophe, like "don't". The search code is in src/db.ts. Please fix it properly.`,
    seed: { fixture: 'notes-search' },
  },
  (check) => {
    check('searchNotesAsync still exists', (ws) => {
      expect(ws.read('src/db.ts')).toMatch(
        /export\s+(async\s+)?function\s+searchNotesAsync|export\s+const\s+searchNotesAsync/
      );
    });

    // `${...}` inside a quoted SQL string passed to the string-source APIs.
    check('no user input interpolated into SQL strings', (ws) => {
      expect(ws.source()).not.toMatch(
        /(getAllAsync|getFirstAsync|getEachAsync|runAsync|execAsync)\s*(<[^>]*>)?\(\s*`[^`]*'[^`]*\$\{/
      );
    });

    check('binds the search term as a parameter', (ws) => {
      const usesBinding =
        /(getAllAsync|getFirstAsync|getEachAsync|runAsync)\s*(<[^>]*>)?\(\s*['"`][^'"`]*[?$]/.test(
          ws.source()
        ) ||
        /\.sql[<`]/.test(ws.source()) ||
        /prepareAsync\(/.test(ws.source());
      expect(usesBinding).toBe(true);
    });

    // A string replace of apostrophes fixes the crash but keeps the injection.
    check('does not hand-escape quotes instead of binding', (ws) => {
      expect(ws.read('src/db.ts')).not.toMatch(/\.replace\s*\([^)]*'[^)]*\)\s*[^;]*(LIKE|SELECT)/i);
    });
  }
);
