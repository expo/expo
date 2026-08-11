import { check, score, type Scorer } from '../harness/types';

/**
 * The seeded src/db.ts interpolates user input into a SQL string. A correct
 * fix binds the parameter (?/$ placeholders or the db.sql tagged template).
 * Escaping the apostrophe by hand would stop the crash but keep the injection.
 */
const scorer: Scorer = async (ctx) => {
  const dbSource = ctx.read('src/db.ts');
  const source = ctx
    .sourceFiles()
    .map((f) => f.contents)
    .join('\n');

  // `${...}` inside a quoted SQL string passed to the string-source APIs.
  const interpolatesIntoSql =
    /(getAllAsync|getFirstAsync|getEachAsync|runAsync|execAsync)\s*(<[^>]*>)?\(\s*`[^`]*'[^`]*\$\{/.test(
      source
    );
  const usesBinding =
    /(getAllAsync|getFirstAsync|getEachAsync|runAsync)\s*(<[^>]*>)?\(\s*['"`][^'"`]*[?$]/.test(
      source
    ) ||
    /\.sql[<`]/.test(source) ||
    /prepareAsync\(/.test(source);
  const escapesByHand = /replace\s*\(\s*\/?.?'.*\)/.test(dbSource) && !usesBinding;

  return score([
    check(
      'searchNotesAsync still exists',
      /export\s+(async\s+)?function\s+searchNotesAsync|export\s+const\s+searchNotesAsync/.test(
        dbSource
      )
    ),
    check('no user input interpolated into SQL strings', !interpolatesIntoSql),
    check('binds the search term as a parameter', usesBinding),
    check(
      'does not hand-escape quotes instead of binding',
      !escapesByHand,
      'string replace of apostrophes fixes the crash but keeps the injection'
    ),
  ]);
};

export default scorer;
