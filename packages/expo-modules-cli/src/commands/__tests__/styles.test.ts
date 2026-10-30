import { PassThrough } from 'node:stream';

import { styleComment, styleFileName, styleKind, styleTypeName, styleWarning } from '../styles';

function stream({ tty }: { tty: boolean }): NodeJS.WriteStream {
  const passThrough = new PassThrough() as unknown as NodeJS.WriteStream;
  passThrough.isTTY = tty;
  return passThrough;
}

describe('styles', () => {
  it('leaves text plain for a stream that is not a terminal', () => {
    const target = stream({ tty: false });
    expect(styleFileName('ios/Demo.swift', target)).toBe('ios/Demo.swift');
    expect(styleTypeName('Demo', target)).toBe('Demo');
    expect(styleKind('enum', target)).toBe('enum');
    expect(styleWarning('1 warning:', target)).toBe('1 warning:');
    expect(styleComment('/** Docs. */', target)).toBe('/** Docs. */');
  });

  it('colors file names cyan, type names bold, kinds magenta, warnings yellow, and comments gray on a terminal', () => {
    const target = stream({ tty: true });
    expect(styleFileName('ios/Demo.swift', target)).toBe('\u001b[36mios/Demo.swift\u001b[39m');
    expect(styleTypeName('Demo', target)).toBe('\u001b[1mDemo\u001b[22m');
    expect(styleKind('enum', target)).toBe('\u001b[35menum\u001b[39m');
    expect(styleWarning('1 warning:', target)).toBe('\u001b[33m1 warning:\u001b[39m');
    expect(styleComment('/** Docs. */', target)).toBe('\u001b[90m/** Docs. */\u001b[39m');
  });
});
