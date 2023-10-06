import { Asset } from 'expo-asset';
import * as FS from 'expo-file-system';
import { Platform } from 'expo-modules-core';
import * as SQLite from 'expo-sqlite';

export const name = 'SQLite';

// The version here needs to be the same as both the podspec and build.gradle for expo-sqlite
const VERSION = '3.42.0';

// TODO: Only tests successful cases, needs to test error cases like bad database name etc.
export function test(t) {
  t.describe('SQLite', () => {
    t.it('should be able to drop + create a table, insert, query', async () => {
      const db = SQLite.openDatabase('test.db');
      await new Promise((resolve, reject) => {
        db.transaction(
          (tx) => {
            const nop = () => {};
            const onError = (tx, error) => {
              reject(error);
              return false;
            };

            tx.executeSql('DROP TABLE IF EXISTS Users;', [], nop, onError);
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);',
              [],
              nop,
              onError
            );
            tx.executeSql(
              'INSERT INTO Users (name, k, j) VALUES (?, ?, ?)',
              ['Tim Duncan', 1, 23.4],
              nop,
              onError
            );
            tx.executeSql(
              'INSERT INTO Users (name, k, j) VALUES ("Manu Ginobili", 5, 72.8)',
              [],
              nop,
              onError
            );
            tx.executeSql(
              'INSERT INTO Users (name, k, j) VALUES ("Nikhilesh Sigatapu", 7, 42.14)',
              [],
              nop,
              onError
            );

            tx.executeSql(
              'SELECT * FROM Users',
              [],
              (tx, results) => {
                t.expect(results.rows.length).toEqual(3);
                t.expect(results.rows.item(0).j).toBeCloseTo(23.4);
              },
              onError
            );
          },
          reject,
          () => {
            resolve(null);
          }
        );
      });

      if (Platform.OS !== 'web') {
        const { exists } = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
        t.expect(exists).toBeTruthy();
      }
    });

    t.it(`should use specified SQLite version: ${VERSION}`, async () => {
      const db = SQLite.openDatabase('test.db');

      await new Promise((resolve, reject) => {
        db.transaction(
          (tx) => {
            tx.executeSql('SELECT sqlite_version()', [], (_, results) => {
              const queryVersion = results.rows._array[0]['sqlite_version()'];
              t.expect(queryVersion).toEqual(VERSION);
            });
          },
          reject,
          () => {
            resolve(null);
          }
        );
      });
    });

    t.it(`unixepoch() is supported`, async () => {
      const db = SQLite.openDatabase('test.db');

      await new Promise((resolve, reject) => {
        db.transaction(
          (tx) => {
            tx.executeSql('SELECT unixepoch()', [], (_, results) => {
              const epoch = results.rows._array[0]['unixepoch()'];
              t.expect(epoch).toBeTruthy();
            });
          },
          reject,
          () => {
            resolve(null);
          }
        );
      });
    });

    if (Platform.OS !== 'web') {
      t.it(
        'should work with a downloaded .db file',
        async () => {
          await FS.downloadAsync(
            Asset.fromModule(require('../assets/asset-db.db')).uri,
            `${FS.documentDirectory}SQLite/downloaded.db`
          );

          const db = SQLite.openDatabase('downloaded.db');
          await new Promise((resolve, reject) => {
            db.transaction(
              (tx) => {
                const onError = (tx, error) => {
                  reject(error);
                  return false;
                };
                tx.executeSql(
                  'SELECT * FROM Users',
                  [],
                  (tx, results) => {
                    t.expect(results.rows.length).toEqual(3);
                    t.expect(results.rows._array[0].j).toBeCloseTo(23.4);
                  },
                  onError
                );
              },
              reject,
              () => {
                resolve(null);
              }
            );
          });
          db.closeAsync();
        },
        30000
      );
    }

    t.it('should be able to recreate db from scratch by deleting file', async () => {
      {
        const db = SQLite.openDatabase('test.db');
        await new Promise((resolve, reject) => {
          db.transaction(
            (tx) => {
              const nop = () => {};
              const onError = (tx, error) => {
                reject(error);
                return false;
              };

              tx.executeSql('DROP TABLE IF EXISTS Users;', [], nop, onError);
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);',
                [],
                nop,
                onError
              );
              tx.executeSql(
                'INSERT INTO Users (name, k, j) VALUES (?, ?, ?)',
                ['Tim Duncan', 1, 23.4],
                nop,
                onError
              );

              tx.executeSql(
                'SELECT * FROM Users',
                [],
                (tx, results) => {
                  t.expect(results.rows.length).toEqual(1);
                },
                onError
              );
            },
            reject,
            () => {
              resolve(null);
            }
          );
        });
      }

      if (Platform.OS !== 'web') {
        const { exists } = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
        t.expect(exists).toBeTruthy();
      }

      if (Platform.OS !== 'web') {
        await FS.deleteAsync(`${FS.documentDirectory}SQLite/test.db`);
        const { exists } = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
        t.expect(exists).toBeFalsy();
      }

      {
        const db = SQLite.openDatabase('test.db');
        await new Promise((resolve, reject) => {
          db.transaction(
            (tx) => {
              const nop = () => {};
              const onError = (tx, error) => {
                reject(error);
                return false;
              };

              tx.executeSql('DROP TABLE IF EXISTS Users;', [], nop, onError);
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);',
                [],
                nop,
                onError
              );
              tx.executeSql(
                'SELECT * FROM Users',
                [],
                (tx, results) => {
                  t.expect(results.rows.length).toEqual(0);
                },
                onError
              );

              tx.executeSql(
                'INSERT INTO Users (name, k, j) VALUES (?, ?, ?)',
                ['Tim Duncan', 1, 23.4],
                nop,
                onError
              );
              tx.executeSql(
                'SELECT * FROM Users',
                [],
                (tx, results) => {
                  t.expect(results.rows.length).toEqual(1);
                },
                onError
              );
            },
            reject,
            () => {
              resolve(null);
            }
          );
        });
      }
    });

    t.it('should maintain correct type of potentialy null bind parameters', async () => {
      const db = SQLite.openDatabase('test.db');
      await new Promise((resolve, reject) => {
        db.transaction(
          (tx) => {
            const nop = () => {};
            const onError = (tx, error) => {
              reject(error);
              return false;
            };

            tx.executeSql('DROP TABLE IF EXISTS Nulling;', [], nop, onError);
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS Nulling (id INTEGER PRIMARY KEY NOT NULL, x NUMERIC, y NUMERIC)',
              [],
              nop,
              onError
            );
            tx.executeSql('INSERT INTO Nulling (x, y) VALUES (?, ?)', [null, null], nop, onError);
            tx.executeSql('INSERT INTO Nulling (x, y) VALUES (null, null)', [], nop, onError);

            tx.executeSql(
              'SELECT * FROM Nulling',
              [],
              (tx, results) => {
                t.expect(results.rows.item(0).x).toBeNull();
                t.expect(results.rows.item(0).y).toBeNull();
                t.expect(results.rows.item(1).x).toBeNull();
                t.expect(results.rows.item(1).y).toBeNull();
              },
              onError
            );
          },
          reject,
          () => {
            resolve(null);
          }
        );
      });

      if (Platform.OS !== 'web') {
        const { exists } = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
        t.expect(exists).toBeTruthy();
      }
    });

    // Do not try to test PRAGMA statements support in web
    // as it is expected to not be working.
    // See https://stackoverflow.com/a/10298712
    if (Platform.OS !== 'web') {
      t.it('should support PRAGMA statements', async () => {
        const db = SQLite.openDatabase('test.db');
        await new Promise((resolve, reject) => {
          db.transaction(
            (tx) => {
              const nop = () => {};
              const onError = (tx, error) => {
                reject(error);
                return false;
              };

              tx.executeSql('DROP TABLE IF EXISTS SomeTable;', [], nop, onError);
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS SomeTable (id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));',
                [],
                nop,
                onError
              );
              // a result-returning pragma
              tx.executeSql(
                'PRAGMA table_info(SomeTable);',
                [],
                (tx, results) => {
                  t.expect(results.rows.length).toEqual(2);
                  t.expect(results.rows.item(0).name).toEqual('id');
                  t.expect(results.rows.item(1).name).toEqual('name');
                },
                onError
              );
              // a no-result pragma
              tx.executeSql('PRAGMA case_sensitive_like = true;', [], nop, onError);
              // a setter/getter pragma
              tx.executeSql('PRAGMA user_version = 123;', [], nop, onError);
              tx.executeSql(
                'PRAGMA user_version;',
                [],
                (tx, results) => {
                  t.expect(results.rows.length).toEqual(1);
                  t.expect(results.rows.item(0).user_version).toEqual(123);
                },
                onError
              );
            },
            reject,
            () => {
              resolve(null);
            }
          );
        });
      });
    }

    t.it('should support the `RETURNING` clause using raw queries', async () => {
      const db = SQLite.openDatabase('test.db');
      await new Promise((resolve, reject) => {
        db.transaction(
          (tx) => {
            const nop = () => {};
            const onError = (_, error) => {
              reject(error);
              return false;
            };

            tx.executeSql('DROP TABLE IF EXISTS customers;', [], nop, onError);
            tx.executeSql(
              'CREATE TABLE customers (id PRIMARY KEY NOT NULL, name VARCHAR(255),email VARCHAR(255));',
              [],
              nop,
              onError
            );
          },
          reject,
          () => {
            resolve(null);
          }
        );
      });

      db.execRawQuery(
        [
          {
            // Unsupprted on Android using the `exec` function
            sql: "INSERT INTO customers (id, name, email) VALUES (1, 'John Doe', 'john@example.com') RETURNING name, email;",
            args: [],
          },
        ],
        false,
        (tx, results) => {
          // @ts-expect-error
          t.expect(results.rows[0].email).toBe('john@example.com');
          // @ts-expect-error
          t.expect(results.rows[0].name).toBe('John Doe');
        }
      );

      db.execRawQuery(
        [
          {
            sql: "UPDATE customers SET name='Jane Doe', email='jane@example.com' WHERE id=1 RETURNING name, email;",
            args: [],
          },
        ],
        false,
        (tx, results) => {
          // @ts-expect-error
          t.expect(results.rows[0].email).toBe('jane@example.com');
          // @ts-expect-error
          t.expect(results.rows[0].name).toBe('Jane Doe');
        }
      );

      db.execRawQuery(
        [
          {
            // Unsupprted on Android using the `exec` function
            sql: 'DELETE from customers WHERE id=1 RETURNING name, email;',
            args: [],
          },
        ],
        false,
        (tx, results) => {
          // @ts-expect-error
          t.expect(results.rows[0].email).toBe('jane@example.com');
          // @ts-expect-error
          t.expect(results.rows[0].name).toBe('Jane Doe');
        }
      );
    });

    t.it('should return correct rowsAffected value', async () => {
      const db = SQLite.openDatabase('test.db');
      await new Promise((resolve, reject) => {
        db.transaction(
          (tx) => {
            const nop = () => {};
            const onError = (tx, error) => {
              reject(error);
              return false;
            };

            tx.executeSql('DROP TABLE IF EXISTS Users;', [], nop, onError);
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));',
              [],
              nop,
              onError
            );
            tx.executeSql(
              'INSERT INTO Users (name) VALUES (?), (?), (?)',
              ['name1', 'name2', 'name3'],
              nop,
              onError
            );
          },
          reject,
          () => {
            resolve(null);
          }
        );
      });
      await new Promise((resolve, reject) => {
        db.transaction(
          (tx) => {
            const onError = (tx, error) => {
              reject(error);
              return false;
            };
            tx.executeSql(
              'DELETE FROM Users WHERE name=?',
              ['name1'],
              (tx, results) => {
                t.expect(results.rowsAffected).toEqual(1);
              },
              onError
            );
            tx.executeSql(
              'DELETE FROM Users WHERE name=? OR name=?',
              ['name2', 'name3'],
              (tx, results) => {
                t.expect(results.rowsAffected).toEqual(2);
              },
              onError
            );
            tx.executeSql(
              // ensure deletion succeedeed
              'SELECT * from Users',
              [],
              (tx, results) => {
                t.expect(results.rows.length).toEqual(0);
              },
              onError
            );
          },
          reject,
          () => {
            resolve(null);
          }
        );
      });
    });

    if (Platform.OS !== 'web') {
      // It is not expected to work on web, since we cannot execute PRAGMA to enable foreign keys support
      t.it('should return correct rowsAffected value when deleting cascade', async () => {
        const db = SQLite.openDatabase('test.db');
        db.exec([{ sql: 'PRAGMA foreign_keys = ON;', args: [] }], false, () => {});
        await new Promise((resolve, reject) => {
          db.transaction(
            (tx) => {
              const nop = () => {};
              const onError = (tx, error) => {
                reject(error);
                return false;
              };

              tx.executeSql('DROP TABLE IF EXISTS Users;', [], nop, onError);
              tx.executeSql('DROP TABLE IF EXISTS Posts;', [], nop, onError);
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));',
                [],
                nop,
                onError
              );
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS Posts (post_id INTEGER PRIMARY KEY NOT NULL, content VARCHAR(64), userposted INTEGER, FOREIGN KEY(userposted) REFERENCES Users(user_id) ON DELETE CASCADE);',
                [],
                nop,
                onError
              );
              tx.executeSql(
                'INSERT INTO Users (name) VALUES (?), (?), (?)',
                ['name1', 'name2', 'name3'],
                nop,
                onError
              );

              tx.executeSql(
                'INSERT INTO Posts (content, userposted) VALUES (?, ?), (?, ?), (?, ?)',
                ['post1', 1, 'post2', 1, 'post3', 2],
                nop,
                onError
              );
              tx.executeSql('PRAGMA foreign_keys=off;', [], nop, onError);
            },
            reject,
            () => {
              resolve(null);
            }
          );
        });
        await new Promise((resolve, reject) => {
          db.transaction(
            (tx) => {
              const nop = () => {};
              const onError = (tx, error) => {
                reject(error);
                return false;
              };
              tx.executeSql('PRAGMA foreign_keys=on;', [], nop, onError);
              tx.executeSql(
                'DELETE FROM Users WHERE name=?',
                ['name1'],
                (tx, results) => {
                  t.expect(results.rowsAffected).toEqual(1);
                },
                onError
              );
              tx.executeSql(
                'DELETE FROM Users WHERE name=? OR name=?',
                ['name2', 'name3'],
                (tx, results) => {
                  t.expect(results.rowsAffected).toEqual(2);
                },
                onError
              );

              tx.executeSql(
                // ensure deletion succeeded
                'SELECT * from Users',
                [],
                (tx, results) => {
                  t.expect(results.rows.length).toEqual(0);
                },
                onError
              );

              tx.executeSql(
                'SELECT * from Posts',
                [],
                (tx, results) => {
                  t.expect(results.rows.length).toEqual(0);
                },
                onError
              );
              tx.executeSql('PRAGMA foreign_keys=off;', [], nop, onError);
            },
            reject,
            () => {
              resolve(null);
            }
          );
        });
      });
    }

    if (Platform.OS !== 'web') {
      t.it('should delete db on filesystem from the `deleteAsync()` call', async () => {
        const db = SQLite.openDatabase('test.db');
        let fileInfo = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
        t.expect(fileInfo.exists).toBeTruthy();

        await db.closeAsync();
        await db.deleteAsync();
        fileInfo = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
        t.expect(fileInfo.exists).toBeFalsy();
      });
    }
  });

  if (Platform.OS !== 'web') {
    t.describe('SQLiteAsync', () => {
      const throws = async (run) => {
        let error = null;
        try {
          await run();
        } catch (e) {
          error = e;
        }
        t.expect(error).toBeTruthy();
      };

      t.it('should support async transaction', async () => {
        const db = SQLite.openDatabase('test.db');

        // create table
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync('DROP TABLE IF EXISTS Users;', []);
          await tx.executeSqlAsync(
            'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));',
            []
          );
        });

        // fetch data from network
        async function fakeUserFetcher(userID) {
          switch (userID) {
            case 1: {
              return Promise.resolve('Tim Duncan');
            }
            case 2: {
              return Promise.resolve('Manu Ginobili');
            }
            case 3: {
              return Promise.resolve('Nikhilesh Sigatapu');
            }
            default: {
              return null;
            }
          }
        }

        const userName = await fakeUserFetcher(1);
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync('INSERT INTO Users (name) VALUES (?)', [userName]);
          const result = await tx.executeSqlAsync('SELECT * FROM Users LIMIT 1');
          const currentUser = result.rows[0].name;
          t.expect(currentUser).toEqual('Tim Duncan');
        });
      });

      t.it('should load crsqlite extension correctly', async () => {
        const db = SQLite.openDatabase('test.db');
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync('DROP TABLE IF EXISTS foo;', []);
          await tx.executeSqlAsync('create table foo (a primary key, b INTEGER);', []);
          await tx.executeSqlAsync('select crsql_as_crr("foo");', []);
          await tx.executeSqlAsync('insert into foo (a,b) values (?, ?);', [1, 2]);
          await tx.executeSqlAsync('insert into foo (a,b) values (?, ?);', [3, 4]);
          const result = await tx.executeSqlAsync('select * from crsql_changes;', []);
          const table = result.rows[0].table;
          const value = result.rows[0].val;
          t.expect(table).toEqual('foo');
          t.expect(value).toEqual(2);
        });
      });

      t.it('should support Promise.all', async () => {
        const db = SQLite.openDatabase('test.db');

        // create table
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync('DROP TABLE IF EXISTS Users;', []);
          await tx.executeSqlAsync(
            'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));',
            []
          );
        });

        await db.transactionAsync(async (tx) => {
          await Promise.all([
            tx.executeSqlAsync('INSERT INTO Users (name) VALUES (?)', ['aaa']),
            tx.executeSqlAsync('INSERT INTO Users (name) VALUES (?)', ['bbb']),
            tx.executeSqlAsync('INSERT INTO Users (name) VALUES (?)', ['ccc']),
          ]);

          const result = await tx.executeSqlAsync('SELECT COUNT(*) FROM Users');
          const recordCount = result.rows[0]['COUNT(*)'];
          t.expect(recordCount).toEqual(3);
        });
      });

      t.it(
        'should return `could not prepare ...` error when having write statements in readOnly transaction',
        async () => {
          const db = SQLite.openDatabase('test.db');

          // create table in readOnly transaction
          await db.transactionAsync(async (tx) => {
            let error: Error | null = null;
            try {
              await tx.executeSqlAsync('DROP TABLE IF EXISTS Users;', []);
            } catch (e: unknown) {
              if (e instanceof Error) {
                error = e;
              }
            }
            t.expect(error).toBeDefined();
            t.expect(error.message).toContain('could not prepare ');
          }, true);
        }
      );

      t.it('should rollback transaction when exception happens inside a transaction', async () => {
        const db = SQLite.openDatabase('test.db');

        // create table
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync('DROP TABLE IF EXISTS Users;', []);
          await tx.executeSqlAsync(
            'CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));',
            []
          );
        });
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync('INSERT INTO Users (name) VALUES (?)', ['aaa']);
        });
        await db.transactionAsync(async (tx) => {
          const result = await tx.executeSqlAsync('SELECT COUNT(*) FROM Users');
          const recordCount = result.rows[0]['COUNT(*)'];
          t.expect(recordCount).toEqual(1);
        }, true);

        await throws(() =>
          db.transactionAsync(async (tx) => {
            await tx.executeSqlAsync('INSERT INTO Users (name) VALUES (?)', ['bbb']);
            await tx.executeSqlAsync('INSERT INTO Users (name) VALUES (?)', ['ccc']);
            // exeuting invalid sql statement will throw an exception
            await tx.executeSqlAsync(null);
          })
        );

        await db.transactionAsync(async (tx) => {
          const result = await tx.executeSqlAsync('SELECT COUNT(*) FROM Users');
          const recordCount = result.rows[0]['COUNT(*)'];
          t.expect(recordCount).toEqual(1);
        }, true);
      });

      t.it('should support async PRAGMA statements', async () => {
        const db = SQLite.openDatabase('test.db');
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync('DROP TABLE IF EXISTS SomeTable;', []);
          await tx.executeSqlAsync(
            'CREATE TABLE IF NOT EXISTS SomeTable (id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));',
            []
          );
          // a result-returning pragma
          let result = await tx.executeSqlAsync('PRAGMA table_info(SomeTable);', []);
          t.expect(result.rows.length).toEqual(2);
          t.expect(result.rows[0].name).toEqual('id');
          t.expect(result.rows[1].name).toEqual('name');
          // a no-result pragma
          await tx.executeSqlAsync('PRAGMA case_sensitive_like = true;', []);
          // a setter/getter pragma
          await tx.executeSqlAsync('PRAGMA user_version = 123;', []);
          result = await tx.executeSqlAsync('PRAGMA user_version;', []);
          t.expect(result.rows.length).toEqual(1);
          t.expect(result.rows[0].user_version).toEqual(123);
        });
      });
    }); // t.describe('SQLiteAsync')
  }
}
