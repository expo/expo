import { agentEval, expect, type EvalWorkspace } from './eval-kit';
import { setupProject } from './setup';

// Atomic bulk insert while other queries run concurrently: the skill's
// guidance is withExclusiveTransactionAsync (plain withTransactionAsync lets
// unrelated in-flight queries join the transaction) and prepared statements
// finalized in a finally block for the hot loop.
//
// The seeded src/db.ts already opens the database and lists notes, so checks
// are scoped to the file(s) defining importNotesAsync — seeded code cannot
// pass checks on the agent's behalf.
function importSource(ws: EvalWorkspace): string {
  return ws
    .sourceFiles()
    .filter((f) => /importNotesAsync/.test(f.contents))
    .map((f) => f.contents)
    .join('\n');
}

agentEval(
  import.meta.url,
  {
    title: 'import thousands of rows atomically',
    prompt: `Add an importNotesAsync(texts: string[]) function to this app that inserts up to a few thousand notes at once. If any row fails, none of them should be saved. It runs while the rest of the app keeps querying the database, and it should be reasonably fast.`,
    projectSetup: setupProject({ fixture: 'notes-db' }),
  },
  (check) => {
    check('importNotesAsync exists', (ws) => {
      expect(importSource(ws)).not.toBe('');
    });

    check('wraps the import in a transaction', (ws) => {
      expect(importSource(ws)).toMatch(/withExclusiveTransactionAsync\(|withTransactionAsync\(/);
    });

    // Concurrent queries elsewhere would silently join a plain withTransactionAsync.
    check('uses the exclusive transaction variant', (ws) => {
      expect(importSource(ws)).toMatch(/withExclusiveTransactionAsync\(/);
    });

    check('binds row values as parameters', (ws) => {
      const source = importSource(ws);
      const bindsParameters =
        /(runAsync|executeAsync)\s*(<[^>]*>)?\(\s*[^)]*[?$]/.test(source) ||
        /\.sql[<`]/.test(source);
      expect(bindsParameters).toBe(true);
    });

    // Engagement-gated: only meaningful when a prepared statement is used at all.
    check('finalizes the prepared statement in finally', (ws, { skip }) => {
      const source = importSource(ws);
      if (!/prepareAsync\(/.test(source)) {
        skip('no prepared statement used');
      }
      expect(source).toMatch(/finally\s*{[^}]*finalize(Async|Sync)\(/s);
    });
  }
);
