import stream from 'stream';

import { extractNpmTarballAsync, sanitizeNpmPackageName } from '../npm';

jest.mock('tar', () => ({
  extract: jest.fn().mockImplementation(() => {
    const { Writable } = jest.requireActual('stream');
    return new Writable({
      write(chunk, encoding, callback) {
        callback();
      },
    });
  }),
}));

describe(extractNpmTarballAsync, () => {
  it('should return the checksum from a tarball stream', async () => {
    // Create a dummy stream rather than a real tarball
    const readableStream = stream.Readable.from(Buffer.from('Hello world!'));

    await expect(
      extractNpmTarballAsync(readableStream, {
        name: 'test',
        cwd: '/tmp',
      })
    ).resolves.toMatchInlineSnapshot(`"86fb269d190d2c85f6e0468ceca42a20"`);

    await expect(
      extractNpmTarballAsync(readableStream, {
        name: 'test',
        cwd: '/tmp',
        checksumAlgorithm: 'sha256',
      })
    ).resolves.toMatchInlineSnapshot(
      `"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"`
    );
  });
});

describe(sanitizeNpmPackageName, () => {
  it(`leaves valid names`, () => {
    for (const name of ['@bacon/app', 'my-app', 'my-a.pp']) {
      expect(sanitizeNpmPackageName(name)).toBe(name);
    }
  });
  it(`sanitizes invalid names`, () => {
    for (const [before, after] of [
      ['..__..f_f', 'f_f'],
      ['_f', 'f'],
      ['Hello World', 'helloworld'],
      ['\u2665', 'love'],
      ['あいう', 'app'],
    ]) {
      expect(sanitizeNpmPackageName(before)).toBe(after);
    }
  });
});
