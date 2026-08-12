import { agentEval, expect, loadAstSupport } from './eval-kit';

// Demonstrates an AST check for a rule regex can't verify honestly: counting
// real openDatabaseAsync call sites. A regex over source can be fooled by the
// word appearing in strings, and can't tell a call from a mention; the AST
// counts CallExpression nodes. The seed opens two separate connections.
agentEval(
  import.meta.url,
  {
    title: 'consolidate to a single shared database connection',
    prompt: `src/notes.ts and src/tags.ts each open their own database connection with openDatabaseAsync. Refactor so the app opens one shared connection and everything reuses it.`,
    seed: { fixture: 'notes-tags-split' },
  },
  (check) => {
    // Lexical tier: cheap approximation that always runs. Counts textual
    // occurrences in comment-stripped source — a string mentioning the API
    // would fool it, which is exactly what the AST tier below is for.
    check('opens exactly one database connection (lexical)', (ws) => {
      const occurrences = ws.source().match(/openDatabaseAsync\s*\(/g) ?? [];
      expect(occurrences).toHaveLength(1);
    });

    // AST tier: exactly one real openDatabaseAsync call site across the app.
    check('opens exactly one database connection (AST)', async (ws, { skip }) => {
      const ast = await loadAstSupport();
      if (!ast) {
        skip('@babel/parser not installed — run npm install in .evals/');
        return;
      }
      let callSites = 0;
      for (const file of ws.sourceFiles()) {
        ast.walk(ast.parse(file.contents, file.path), (node) => {
          if (node.type !== 'CallExpression') {
            return;
          }
          const callee = node.callee;
          const name =
            callee?.type === 'Identifier'
              ? callee.name
              : callee?.type === 'MemberExpression' && !callee.computed
                ? callee.property?.name
                : undefined;
          if (name === 'openDatabaseAsync') {
            callSites++;
          }
        });
      }
      expect(callSites).toBe(1);
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
