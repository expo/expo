import path from 'node:path';
import * as ts from 'typescript';

describe('published declarations', () => {
  it('keeps the bundled xcode types reachable after declaration emit', () => {
    const fileName = path.join(__dirname, '../index.ts');
    let outputText = '';
    const program = ts.createProgram([fileName], {
      declaration: true,
      emitDeclarationOnly: true,
      noCheck: true,
      rootDir: path.join(__dirname, '..'),
      outDir: path.join(__dirname, '../../build'),
    });
    program.emit(undefined, (outputPath, content) => {
      if (outputPath.endsWith('/build/index.d.ts')) outputText = content;
    });
    const references = ts.preProcessFile(outputText).typeReferenceDirectives;
    expect(references.map(({ fileName }) => fileName)).toContain('./ts-declarations/xcode');
  });

  it('checks the bundled xcode types with strict library checking', () => {
    const program = ts.createProgram([path.join(__dirname, '../ts-declarations/xcode.d.ts')], {
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      types: [],
      target: ts.ScriptTarget.ES2022,
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(
      diagnostics.map(({ messageText }) => ts.flattenDiagnosticMessageText(messageText, '\n'))
    ).toEqual([]);
  });
});
