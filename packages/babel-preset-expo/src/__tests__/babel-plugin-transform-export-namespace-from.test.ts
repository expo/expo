import { codeFrameColumns } from '@babel/code-frame';
import { transformSync } from '@babel/core';
import type { SourceLocation, File } from '@babel/types';

import plugin from '../babel-plugin-transform-export-namespace-from';

// Tests of the loc transfer which was added and is missing in the original babel plugin.

it('transform export namespace syntax with loc', () => {
  const input = `export * as foo from "bar";`;

  const ast = transform(input);
  expect(formatProgramStatementLocs(ast, input)).toMatchInlineSnapshot(`
"
> 1 | export * as foo from "bar";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ Statement #0
> 1 | export * as foo from "bar";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ Statement #1"
`);
});

it('transform export namespace syntax with loc - example with import and const export', () => {
  const input = `
import { foo } from "foo";
export * as bar from "bar";

export const a = 'a';
`;

  const ast = transform(input);
  expect(formatProgramStatementLocs(ast, input)).toMatchInlineSnapshot(`
"
> 2 | import { foo } from "foo";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^ Statement #0
> 3 | export * as bar from "bar";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ Statement #1
> 3 | export * as bar from "bar";
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ Statement #2
> 5 | export const a = 'a';
    | ^^^^^^^^^^^^^^^^^^^^^ Statement #3"
`);
});

function transform(code: string) {
  const result = transformSync(code, {
    plugins: [plugin],
    configFile: false,
    babelrc: false,
    ast: true,
  });

  return result.ast;
}

function formatProgramStatementLocs(ast: File, code: string) {
  if (!ast.program || !ast.program.body) {
    return '\nNo program body found';
  }

  return (
    '\n' +
    ast.program.body
      .map((statement, index) => {
        if (!statement.loc) {
          return `Statement #${index}: no location recorded`;
        }
        return formatStatementLoc(statement.loc, index, code);
      })
      .join('\n')
  );
}

function adjustPosForCodeFrame(
  pos: SourceLocation['start'] | SourceLocation['end'] | null | undefined
) {
  return pos ? { ...pos, column: pos.column + 1 } : pos;
}

function adjustLocForCodeFrame(loc: SourceLocation) {
  return {
    start: adjustPosForCodeFrame(loc.start),
    end: adjustPosForCodeFrame(loc.end),
  };
}

function formatStatementLoc(loc: SourceLocation, statementIndex: number, code: string) {
  return codeFrameColumns(code, adjustLocForCodeFrame(loc), {
    message: `Statement #${statementIndex}`,
    linesAbove: 0,
    linesBelow: 0,
  });
}
