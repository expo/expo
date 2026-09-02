import path from 'node:path';
import url from 'node:url';

import { annotateError } from '../codeframe';

const filename = path.join(__dirname, 'fixtures', 'eval.js');
const fileHref = url.pathToFileURL(filename).href;
const code = ['const value = undefined;', 'value.missingMethod();', ''].join('\n');

function errorWithStack(name: string, message: string, frames: string[]) {
  const error = new Error(message);
  error.name = name;
  error.stack = [`${name}: ${message}`, ...frames.map((frame) => `    at ${frame}`)].join('\n');
  return error;
}

describe('annotateError', () => {
  it('annotates a TypeError whose top frame matches the module', () => {
    const error = errorWithStack(
      'TypeError',
      "Cannot read properties of undefined (reading 'missingMethod')",
      [`${fileHref}:2:7`, 'Module._compile (node:internal/modules/cjs/loader:1234:14)']
    );

    const result = annotateError(code, filename, error) as (Error & { codeFrame: string }) | null;
    expect(result).toBe(error);
    expect(typeof result?.codeFrame).toBe('string');
    expect(result?.codeFrame).toContain('missingMethod');
    expect(result?.message).toContain('missingMethod');
  });

  it('does not annotate when the top frame is a different file', () => {
    const otherHref = url.pathToFileURL(path.join(__dirname, 'fixtures', 'other.js')).href;
    const error = errorWithStack('TypeError', 'boom', [`${otherHref}:1:1`, `${fileHref}:2:7`]);

    expect(annotateError(code, filename, error)).toBeNull();
  });

  it('returns null for a non-Error thrown value without crashing', () => {
    expect(annotateError(code, filename, { code: 'CUSTOM_THROW' } as any)).toBeNull();
  });
});
