'use strict';

export const name = 'FileSystem';

import { FileSystem as FS } from 'expo';
import { CameraRoll } from 'react-native';

export function test(t) {
  t.describe('FileSystem', () => {
    const throws = async run => {
      let error = null;
      try {
        await run();
      } catch (e) {
        // Uncomment to log error message.
        // const func = run.toString().match(/[A-Za-z]+\(/)[0].slice(0, -1);
        // console.log(`${func}: ${e.message}`);
        error = e;
      }
      t.expect(error).toBeTruthy();
    };

    /*t.it(
      'delete(idempotent) -> !exists -> download(md5, uri) -> exists ' + '-> delete -> !exists',
      async () => {
        const localUri = FS.documentDirectory + 'download1.png';

        const assertExists = async expectedToExist => {
          let { exists } = await FS.getInfoAsync(localUri);
          if (expectedToExist) {
            t.expect(exists).toBeTruthy();
          } else {
            t.expect(exists).not.toBeTruthy();
          }
        };

        await FS.deleteAsync(localUri, { idempotent: true });
        await assertExists(false);

        const {
          md5,
          uri,
          headers,
        } = await FS.downloadAsync(
          'https://s3-us-west-1.amazonaws.com/test-suite-data/avatar2.png',
          localUri,
          { md5: true }
        );
        t.expect(md5).toBe('1e02045c10b8f1145edc7c8375998f87');
        await assertExists(true);
        t.expect(headers['Content-Type']).toBe('image/png');

        await FS.deleteAsync(localUri);
        await assertExists(false);
      },
      9000
    );*/

    t.it('delete(idempotent) -> delete[error]', async () => {
      const localUri = FS.documentDirectory + 'willDelete.png';

      await FS.deleteAsync(localUri, { idempotent: true });

      let error;
      try {
        await FS.deleteAsync(localUri);
      } catch (e) {
        error = e;
      }
      t.expect(error.message).toMatch(/not.*found/);
    });

    /*t.it(
      'download(md5, uri) -> read -> delete -> !exists -> read[error]',
      async () => {
        const localUri = FS.documentDirectory + 'download1.txt';

        const {
          md5,
          uri,
        } = await FS.downloadAsync(
          'https://s3-us-west-1.amazonaws.com/test-suite-data/text-file.txt',
          localUri,
          { md5: true }
        );
        t.expect(md5).toBe('86d73d2f11e507365f7ea8e7ec3cc4cb');

        const string = await FS.readAsStringAsync(localUri);
        t.expect(string).toBe('hello, world\nthis is a test file\n');

        await FS.deleteAsync(localUri, { idempotent: true });

        let error;
        try {
          await FS.readAsStringAsync(localUri);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeTruthy();
      },
      9000
    );*/

    t.it('delete(idempotent) -> !exists -> write -> read -> write -> read', async () => {
      const localUri = FS.documentDirectory + 'write1.txt';

      await FS.deleteAsync(localUri, { idempotent: true });

      const { exists } = await FS.getInfoAsync(localUri);
      t.expect(exists).not.toBeTruthy();

      const writeAndVerify = async expected => {
        await FS.writeAsStringAsync(localUri, expected);
        const string = await FS.readAsStringAsync(localUri);
        t.expect(string).toBe(expected);
      };

      await writeAndVerify('hello, world');
      await writeAndVerify('hello, world!!!!!!');
    });

    t.it('delete(new) -> 2 * [write -> move -> !exists(orig) -> read(new)]', async () => {
      const from = FS.documentDirectory + 'from.txt';
      const to = FS.documentDirectory + 'to.txt';
      const contents = ['contents 1', 'contents 2'];

      await FS.deleteAsync(to, { idempotent: true });

      // Move twice to make sure we can overwrite
      for (let i = 0; i < 2; ++i) {
        await FS.writeAsStringAsync(from, contents[i]);

        await FS.moveAsync({ from, to });

        const { exists } = await FS.getInfoAsync(from);
        t.expect(exists).not.toBeTruthy();

        t.expect(await FS.readAsStringAsync(to)).toBe(contents[i]);
      }
    });

    t.it('delete(new) -> 2 * [write -> copy -> exists(orig) -> read(new)]', async () => {
      const from = FS.documentDirectory + 'from.txt';
      const to = FS.documentDirectory + 'to.txt';
      const contents = ['contents 1', 'contents 2'];

      await FS.deleteAsync(to, { idempotent: true });

      // Copy twice to make sure we can overwrite
      for (let i = 0; i < 2; ++i) {
        await FS.writeAsStringAsync(from, contents[i]);

        await FS.copyAsync({ from, to });

        const { exists } = await FS.getInfoAsync(from);
        t.expect(exists).toBeTruthy();

        t.expect(await FS.readAsStringAsync(to)).toBe(contents[i]);
      }
    });

    t.it(
      'delete(dir) -> write(dir/file)[error] -> mkdir(dir) ->' +
        'mkdir(dir)[error] -> write(dir/file) -> read',
      async () => {
        let error;
        const path = FS.documentDirectory + 'dir/file';
        const dir = FS.documentDirectory + 'dir';
        const contents = 'hello, world';

        await FS.deleteAsync(dir, { idempotent: true });

        error = null;
        try {
          await FS.writeAsStringAsync(path, contents);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeTruthy();

        await FS.makeDirectoryAsync(dir);

        error = null;
        try {
          await FS.makeDirectoryAsync(dir);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeTruthy();

        await FS.writeAsStringAsync(path, contents);

        t.expect(await FS.readAsStringAsync(path)).toBe(contents);
      }
    );

    t.it(
      'delete(dir) -> write(dir/dir2/file)[error] -> ' +
        'mkdir(dir/dir2, intermediates) -> ' +
        'mkdir(dir/dir2, intermediates) -> write(dir/dir2/file) -> read',
      async () => {
        let error;
        const path = FS.documentDirectory + 'dir/dir2/file';
        const dir = FS.documentDirectory + 'dir/dir2';
        const contents = 'hello, world';

        await FS.deleteAsync(dir, { idempotent: true });

        error = null;
        try {
          await FS.writeAsStringAsync(path, contents);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeTruthy();

        await FS.makeDirectoryAsync(dir, {
          intermediates: true,
        });

        error = null;
        try {
          await FS.makeDirectoryAsync(dir);
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeTruthy();

        await FS.writeAsStringAsync(path, contents);

        t.expect(await FS.readAsStringAsync(path)).toBe(contents);
      }
    );

    t.it(
      'delete(dir, idempotent) -> make tree -> check contents ' +
        '-> check directory listings' +
        '-> move -> check directory listings' +
        '-> copy -> check directory listings',
      async () => {
        let error;
        const dir = FS.documentDirectory + 'dir';

        await FS.deleteAsync(dir, { idempotent: true });

        await FS.makeDirectoryAsync(dir + '/child1', {
          intermediates: true,
        });
        await FS.makeDirectoryAsync(dir + '/child2', {
          intermediates: true,
        });

        await FS.writeAsStringAsync(dir + '/file1', 'contents1');
        await FS.writeAsStringAsync(dir + '/file2', 'contents2');

        await FS.writeAsStringAsync(dir + '/child1/file3', 'contents3');

        await FS.writeAsStringAsync(dir + '/child2/file4', 'contents4');
        await FS.writeAsStringAsync(dir + '/child2/file5', 'contents5');

        const checkContents = async (path, contents) =>
          t.expect(await FS.readAsStringAsync(path)).toBe(contents);

        await checkContents(dir + '/file1', 'contents1');
        await checkContents(dir + '/file2', 'contents2');
        await checkContents(dir + '/child1/file3', 'contents3');
        await checkContents(dir + '/child2/file4', 'contents4');
        await checkContents(dir + '/child2/file5', 'contents5');

        const checkDirectory = async (path, expected) => {
          const list = await FS.readDirectoryAsync(path);
          t.expect(list.sort()).toEqual(expected.sort());
        };

        const checkRoot = async root => {
          await checkDirectory(root, ['file1', 'file2', 'child1', 'child2']);
          await checkDirectory(root + '/child1', ['file3']);
          await checkDirectory(root + '/child2', ['file4', 'file5']);

          error = null;
          try {
            await checkDirectory(root + '/file1', ['nope']);
          } catch (e) {
            error = e;
          }
          t.expect(error).toBeTruthy();
        };

        await checkRoot(dir);

        await FS.deleteAsync(FS.documentDirectory + 'moved', {
          idempotent: true,
        });
        await FS.moveAsync({ from: dir, to: FS.documentDirectory + 'moved' });
        await checkRoot(FS.documentDirectory + 'moved');
        await FS.copyAsync({
          from: FS.documentDirectory + 'moved',
          to: FS.documentDirectory + 'copied',
        });
        await checkRoot(FS.documentDirectory + 'copied');
      }
    );

    t.it(
      'delete(idempotent) -> download(md5) -> getInfo(size)',
      async () => {
        const localUri = FS.documentDirectory + 'download1.png';

        await FS.deleteAsync(localUri, { idempotent: true });

        const {
          md5,
        } = await FS.downloadAsync(
          'https://s3-us-west-1.amazonaws.com/test-suite-data/avatar2.png',
          localUri,
          { md5: true }
        );
        t.expect(md5).toBe('1e02045c10b8f1145edc7c8375998f87');

        const { size, modificationTime } = await FS.getInfoAsync(localUri);
        t.expect(size).toBe(3230);
        const nowTime = 0.001 * new Date().getTime();
        t.expect(nowTime - modificationTime).toBeLessThan(3600);

        await FS.deleteAsync(localUri);
      },
      9000
    );

    t.it('throws out-of-scope exceptions', async () => {
      const p = FS.documentDirectory;

      await throws(() => FS.getInfoAsync(p + '../hello/world'));
      await throws(() => FS.readAsStringAsync(p + '../hello/world'));
      await throws(() => FS.writeAsStringAsync(p + '../hello/world', ''));
      await throws(() => FS.deleteAsync(p + '../hello/world'));
      await throws(() => FS.deleteAsync(p));
      await throws(() => FS.deleteAsync(FS.cacheDirectory));
      await throws(() => FS.moveAsync({ from: p + '../a/b', to: 'c' }));
      await throws(() => FS.moveAsync({ from: 'c', to: p + '../a/b' }));
      await throws(() => FS.copyAsync({ from: p + '../a/b', to: 'c' }));
      await throws(() => FS.copyAsync({ from: 'c', to: p + '../a/b' }));
      await throws(() => FS.makeDirectoryAsync(p + '../hello/world'));
      await throws(() => FS.readDirectoryAsync(p + '../hello/world'));
      await throws(() => FS.downloadAsync('http://www.google.com', p + '../hello/world'));
      await throws(() => FS.readDirectoryAsync(p + '../'));
      await throws(() => FS.downloadAsync('http://www.google.com', p + '../hello/world'));
    });

    t.it('missing parameters', async () => {
      const p = FS.documentDirectory + 'test';

      await throws(() => FS.moveAsync({ from: p }));
      await throws(() => FS.moveAsync({ to: p }));
      await throws(() => FS.copyAsync({ from: p }));
      await throws(() => FS.copyAsync({ to: p }));
    });

    t.it('can read root directories', async () => {
      await FS.readDirectoryAsync(FS.documentDirectory);
      await FS.readDirectoryAsync(FS.cacheDirectory);
    });

    /*t.it('can copy from `CameraRoll`, verify hash, other methods restricted', async () => {
      await Promise.all(
        (await CameraRoll.getPhotos({
          first: 1,
        })).edges.map(async ({ node: { image: { uri: cameraRollUri } } }) => {
          const destinationUri = FS.documentDirectory + 'photo.jpg';

          await throws(() => FS.readAsStringAsync(cameraRollUri));
          await throws(() => FS.writeAsStringAsync(cameraRollUri));
          await throws(() => FS.deleteAsync(cameraRollUri));
          await throws(() => FS.moveAsync({ from: cameraRollUri, to: destinationUri }));
          await throws(() => FS.copyAsync({ from: destinationUri, to: cameraRollUri }));
          await throws(() => FS.makeDirectoryAsync(cameraRollUri));
          await throws(() => FS.readDirectoryAsync(cameraRollUri));
          await throws(() => FS.downloadAsync('http://www.google.com', cameraRollUri));

          await FS.copyAsync({ from: cameraRollUri, to: destinationUri });

          const origInfo = await FS.getInfoAsync(cameraRollUri, {
            size: true,
            md5: true,
          });
          const copyInfo = await FS.getInfoAsync(destinationUri, {
            size: true,
            md5: true,
          });

          t.expect(origInfo.md5).toEqual(copyInfo.md5);
          t.expect(origInfo.size).toEqual(copyInfo.size);
        })
      );
    });*/

    t.it(
      'download(network failure)',
      async () => {
        const localUri = FS.documentDirectory + 'download1.png';

        const assertExists = async expectedToExist => {
          let { exists } = await FS.getInfoAsync(localUri);
          if (expectedToExist) {
            t.expect(exists).toBeTruthy();
          } else {
            t.expect(exists).not.toBeTruthy();
          }
        };

        await FS.deleteAsync(localUri, { idempotent: true });
        await assertExists(false);

        let error;
        try {
          const { md5, uri } = await FS.downloadAsync(
            'https://nonexistent-subdomain.expo.io',
            localUri,
            { md5: true }
          );
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeTruthy();
        await assertExists(false);
        await FS.deleteAsync(localUri, { idempotent: true });
      },
      9000
    );

    t.it(
      'download(404)',
      async () => {
        const localUri = FS.documentDirectory + 'download1.png';

        const assertExists = async expectedToExist => {
          let { exists } = await FS.getInfoAsync(localUri);
          if (expectedToExist) {
            t.expect(exists).toBeTruthy();
          } else {
            t.expect(exists).not.toBeTruthy();
          }
        };

        await FS.deleteAsync(localUri, { idempotent: true });
        await assertExists(false);

        const { md5, uri, status } = await FS.downloadAsync('https://expo.io/404', localUri, {
          md5: true,
        });
        await assertExists(true);
        t.expect(status).toBe(404);

        await FS.deleteAsync(localUri);
        await assertExists(false);
      },
      9000
    );
  });
}
