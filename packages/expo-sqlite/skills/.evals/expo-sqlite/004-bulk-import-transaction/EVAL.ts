import { check, notApplicable, score, type Scorer } from '../../types';

/**
 * Atomic bulk insert while other queries run concurrently: the skill's
 * guidance is withExclusiveTransactionAsync (plain withTransactionAsync lets
 * unrelated in-flight queries join the transaction) and prepared statements
 * finalized in a finally block for the hot loop.
 *
 * The seeded src/db.ts already opens the database and lists notes; scoring is
 * scoped to the file(s) defining importNotesAsync so seeded code cannot pass
 * checks on the agent's behalf.
 */
const scorer: Scorer = async (ctx) => {
  const importFiles = ctx
    .sourceFiles()
    .filter((f) => /importNotesAsync/.test(f.contents))
    .map((f) => f.contents);
  const importSource = importFiles.join('\n');
  const usesPreparedStatement = /prepareAsync\(/.test(importSource);

  const checks = [
    check('importNotesAsync exists', importFiles.length > 0),
    check(
      'wraps the import in a transaction',
      /withExclusiveTransactionAsync\(|withTransactionAsync\(/.test(importSource)
    ),
    check(
      'uses the exclusive transaction variant',
      /withExclusiveTransactionAsync\(/.test(importSource),
      'concurrent queries elsewhere would silently join a plain withTransactionAsync'
    ),
    check(
      'binds row values as parameters',
      /(runAsync|executeAsync)\s*(<[^>]*>)?\(\s*[^)]*[?$]/.test(importSource) ||
        /\.sql[<`]/.test(importSource)
    ),
    // Engagement-gated: only meaningful when a prepared statement is used at all.
    usesPreparedStatement
      ? check(
          'finalizes the prepared statement in finally',
          /finally\s*{[^}]*finalize(Async|Sync)\(/s.test(importSource)
        )
      : notApplicable('finalizes the prepared statement in finally', 'no prepared statement used'),
  ];

  return score(checks);
};

export default scorer;
