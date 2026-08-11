import { check, notApplicable, score, type Scorer } from '../harness/types';

/**
 * Atomic bulk insert while other queries run concurrently: the skill's
 * guidance is withExclusiveTransactionAsync (plain withTransactionAsync lets
 * unrelated in-flight queries join the transaction) and prepared statements
 * finalized in a finally block for the hot loop.
 */
const scorer: Scorer = async (ctx) => {
  const source = ctx.sourceFiles()
    .map((f) => f.contents)
    .join('\n');
  const usesPreparedStatement = /prepareAsync\(/.test(source);

  const checks = [
    check('importNotesAsync exists', /importNotesAsync/.test(source)),
    check(
      'wraps the import in a transaction',
      /withExclusiveTransactionAsync\(|withTransactionAsync\(/.test(source)
    ),
    check(
      'uses the exclusive transaction variant',
      /withExclusiveTransactionAsync\(/.test(source),
      'concurrent queries elsewhere would silently join a plain withTransactionAsync'
    ),
    check(
      'binds row values as parameters',
      /(runAsync|executeAsync)\s*(<[^>]*>)?\(\s*[^)]*[?$]/.test(source) || /\.sql[<`]/.test(source)
    ),
    // Engagement-gated: only meaningful when a prepared statement is used at all.
    usesPreparedStatement
      ? check(
          'finalizes the prepared statement in finally',
          /finally\s*{[^}]*finalize(Async|Sync)\(/s.test(source)
        )
      : notApplicable('finalizes the prepared statement in finally', 'no prepared statement used'),
  ];

  return score(checks);
};

export default scorer;
