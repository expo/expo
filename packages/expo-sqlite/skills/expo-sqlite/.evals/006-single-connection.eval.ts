import { agentEval, expect, loadAstSupport } from '@expo/skill-eval-kit';

import { setupProject } from './setup';

// Demonstrates an AST check for a rule regex can't verify honestly: counting
// real openDatabaseAsync call sites. A regex over source can be fooled by the
// word appearing in strings, and can't tell a call from a mention; the AST
// counts CallExpression nodes. The seed opens two separate connections.
agentEval(
  import.meta.url,
  {
    title: 'consolidate to a single shared database connection',
    prompt: `src/notes.ts and src/tags.ts each open their own database connection with openDatabaseAsync. Refactor so the app opens one shared connection and everything reuses it.`,
    projectSetup: setupProject({ fixture: 'notes-tags-split' }),
  },
  (check) => {
    // A single SQLiteProvider is also a valid "one shared connection" —
    // the skill itself teaches it — so both count toward the total.

    // Lexical tier: cheap approximation that always runs. Counts textual
    // occurrences in comment-stripped source — a string mentioning the API
    // would fool it, which is exactly what the AST tier below is for.
    check('opens exactly one database connection (lexical)', (ws) => {
      const source = ws.source();
      const connections =
        (source.match(/openDatabaseAsync\s*\(/g) ?? []).length +
        (source.match(/<SQLiteProvider[\s/>]/g) ?? []).length;
      expect(connections).toBe(1);
    });

    // AST tier: exactly one real connection site (openDatabaseAsync call or
    // SQLiteProvider element) across the app.
    check('opens exactly one database connection (AST)', async (ws, { skip }) => {
      const ast = await loadAstSupport(ws);
      if (!ast) {
        skip(
          '@babel/parser unavailable — npm install in .evals/, or run with EXPO_SKILL_EVAL_INSTALL=1'
        );
        return;
      }
      let connectionSites = 0;
      for (const file of ws.sourceFiles()) {
        ast.walk(ast.parse(file.contents, file.path), (node) => {
          if (node.type === 'CallExpression') {
            const callee = node.callee;
            const name =
              callee?.type === 'Identifier'
                ? callee.name
                : callee?.type === 'MemberExpression' && !callee.computed
                  ? callee.property?.name
                  : undefined;
            if (name === 'openDatabaseAsync') {
              connectionSites++;
            }
          } else if (node.type === 'JSXOpeningElement' && node.name?.name === 'SQLiteProvider') {
            connectionSites++;
          }
        });
      }
      expect(connectionSites).toBe(1);
    });

    check('notes and tags APIs preserved', (ws) => {
      for (const name of ['listNotesAsync', 'addNoteAsync', 'listTagsAsync', 'addTagAsync']) {
        expect(ws.source()).toContain(name);
      }
    });

    check('still binds parameters for writes', (ws) => {
      const bindsParameters =
        /runAsync\(\s*['"][^'"]*[?$]/.test(ws.source()) || /\.sql[<`]/.test(ws.source());
      expect(bindsParameters).toBe(true);
    });
  }
);
