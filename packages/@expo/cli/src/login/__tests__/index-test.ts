import { Readable } from 'stream';

import { readWordFromStdin } from '../index';

const originalStdin = process.stdin;

function withFakeStdin(chunks: string[]) {
  Object.defineProperty(process, 'stdin', {
    value: Readable.from(chunks.map((chunk) => Buffer.from(chunk))),
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true });
});

it('returns the first line of stdin', async () => {
  withFakeStdin(['supersecret\nignored\n']);

  expect(await readWordFromStdin()).toBe('supersecret');
});

it('reassembles a line split across chunks', async () => {
  withFakeStdin(['super', 'sec', 'ret\n']);

  expect(await readWordFromStdin()).toBe('supersecret');
});

it('strips a trailing CR for CRLF input', async () => {
  withFakeStdin(['supersecret\r\n']);

  expect(await readWordFromStdin()).toBe('supersecret');
});

it('returns the buffered content when EOF arrives without a newline', async () => {
  withFakeStdin(['supersecret']);

  expect(await readWordFromStdin()).toBe('supersecret');
});

it('returns an empty string when stdin is empty', async () => {
  withFakeStdin([]);

  expect(await readWordFromStdin()).toBe('');
});
