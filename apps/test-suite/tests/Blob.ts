// Based on tests in https://github.com/web-platform-tests/wpt/tree/master/FileAPI/blob

import { ExpoBlob as Blob } from 'expo-blob';
import { Platform } from 'expo-modules-core';

export const name = 'Blob';

var test_error = {
  name: 'test',
  message: 'test error',
};

export async function test({ describe, it, expect, jasmine }) {
  const test_blob = (fn, expectations) => {
    var expected = expectations.expected,
      type = expectations.type,
      desc = expectations.desc;

    it(desc, async (t) => {
      var blob = fn();
      expect(blob instanceof Blob).toBeTruthy();
      expect(blob instanceof File).toBeFalsy();
      expect(blob.type).toEqual(type);
      expect(blob.size).toBe(expected.length);

      const text = await blob.text();
      const text1 = blob.syncText();
      expect(text).toEqual(expected);
      expect(text).toEqual(text1);
    });
  };
  const test_blob_binary = async (fn, expectations) => {
    var expected = expectations.expected,
      type = expectations.type,
      desc = expectations.desc;
    it(desc, async () => {
      var blob = fn();
      expect(blob instanceof Blob).toBeTruthy();
      expect(blob instanceof File).toBeFalsy();
      expect(blob.type).toBe(type);
      expect(blob.size).toBe(expected.length);

      const ab = await blob.arrayBuffer();
      expect(ab instanceof ArrayBuffer).toBeTruthy();
      expect(new Uint8Array(ab)).toEqual(expected);
    });
  };

  // Helper function that triggers garbage collection while reading a chunk
  // if perform_gc is true.
  const read_and_gc = async (reader, perform_gc) => {
    // Passing Uint8Array for byte streams; non-byte streams will simply ignore it
    const read_promise = reader.read(new Uint8Array(64));
    if (perform_gc) {
      // TODO Actually perform garbage collection in here
      // await garbageCollect();
    }
    return read_promise;
  };

  // Takes in a ReadableStream and reads from it until it is done, returning
  // an array that contains the results of each read operation. If perform_gc
  // is true, garbage collection is triggered while reading every chunk.
  const read_all_chunks = async (stream, { perform_gc = false, mode } = {}) => {
    expect(stream instanceof ReadableStream).toBeTruthy();
    expect('getReader' in stream).toBeTruthy();
    const reader = stream.getReader({ mode });

    expect('read' in reader).toBeTruthy();
    let read_value = await read_and_gc(reader, perform_gc);

    let out = [];
    let i = 0;
    while (!read_value.done) {
      for (let val of read_value.value) {
        out[i++] = val;
      }
      read_value = await read_and_gc(reader, perform_gc);
    }
    return out;
  };

  describe('Blob', async () => {
    describe('Blob creation', () => {
      it('Empty blob', () => {
        const blob = new Blob([]);
        expect(blob).toBeTruthy();
      });
      it('String blob', () => {
        const blob = new Blob(['ab', 'cd']);
        expect(blob).toBeTruthy();
      });
      it('TypedArray blob', () => {
        const blob = new Blob([Int32Array.from([-1, 2]), Uint8Array.from([1, 2, 0])]);
        expect(blob).toBeTruthy();
      });
      it('Blob blob', () => {
        const blob = new Blob([new Blob([]), new Blob(['a', 'b'])]);
        expect(blob).toBeTruthy();
      });
      it('Mixed blob', () => {
        const blob0 = new Blob([Int32Array.from([-1, 2]), Uint8Array.from([1, 2, 0])]);
        const blob1 = new Blob(['ab', 'cd']);
        const blob2 = new Blob(['a', new Blob([new Blob(['b'])])]);
        const blob = new Blob([blob0, blob1, blob2]);
        expect(blob).toBeTruthy();
      });
      it('Blob flatten', () => {
        const blob = new Blob(['aa', ['ab', 'cd'], 'ef']);
        expect(blob).toBeTruthy();
      });
    });

    describe('Array buffer', () => {
      it('simple', async () => {
        const input_arr = new TextEncoder().encode('PASS');
        const blob = new Blob([input_arr]);
        const array_buffer = await blob.arrayBuffer();
        expect(array_buffer instanceof ArrayBuffer).toBeTruthy();
        expect(new Uint8Array(array_buffer)).toEqual(input_arr);
      });
      it('empty Blob data', async () => {
        const input_arr = new TextEncoder().encode('');
        const blob = new Blob([input_arr]);
        const array_buffer = await blob.arrayBuffer();
        expect(array_buffer instanceof ArrayBuffer).toBeTruthy();
        expect(new Uint8Array(array_buffer)).toEqual(input_arr);
      });
      it('non-ascii input', async () => {
        const input_arr = new TextEncoder().encode('\u08B8\u000a');
        const blob = new Blob([input_arr]);
        const array_buffer = await blob.arrayBuffer();
        expect(new Uint8Array(array_buffer)).toEqual(input_arr);
      });
      it('non-unicode input', async () => {
        const input_arr = [8, 241, 48, 123, 151];
        const typed_arr = new Uint8Array(input_arr);
        const blob = new Blob([typed_arr]);
        // const array_buffer = await blob.arrayBuffer();
        const array_buffer = await blob.bytes();
        // expect(blob.syncText()).toEqual("\u0008\u00F1\u0030\u007B\u0097")
        // expect(new Uint8Array(array_buffer) == typed_arr).toBeTruthy()
        // expect(new Uint8Array(array_buffer)).toEqual(typed_arr);
        expect(blob.size).toBe(5);
        expect(array_buffer.length).toBe(5);
        console.log(array_buffer.byteOffset);
        console.log(array_buffer, typed_arr);
        expect(array_buffer).toEqual(typed_arr);
      });
      it('concurrent reads', async () => {
        const input_arr = new TextEncoder().encode('PASS');
        const blob = new Blob([input_arr]);
        const array_buffer_results = await Promise.all([
          blob.arrayBuffer(),
          blob.arrayBuffer(),
          blob.arrayBuffer(),
        ]);
        for (let array_buffer of array_buffer_results) {
          expect(array_buffer instanceof ArrayBuffer).toBeTruthy();
          expect(new Uint8Array(array_buffer)).toEqual(input_arr);
        }
      });
    });

    describe('Bytes', async () => {
      it('Simple', async () => {
        const input_arr = new TextEncoder().encode('PASS');
        const blob = new Blob([input_arr]);
        const uint8array = await blob.bytes();
        expect(uint8array instanceof Uint8Array).toBeTruthy();
        expect(uint8array).toEqual(input_arr);
      });
      it('empty Blob data', async () => {
        const input_arr = new TextEncoder().encode('');
        const blob = new Blob([input_arr]);
        const uint8array = await blob.bytes();
        expect(uint8array instanceof Uint8Array).toBeTruthy();
        expect(uint8array).toEqual(input_arr);
      });
      it('non-ascii input', async () => {
        const input_arr = new TextEncoder().encode('\u08B8\u000a');
        const blob = new Blob([input_arr]);
        const uint8array = await blob.bytes();
        expect(uint8array).toEqual(input_arr);
      });
      it('non-unicode input', async () => {
        const input_arr = [8, 241, 48, 123, 151];
        const typed_arr = new Uint8Array(input_arr);
        const blob = new Blob([typed_arr]);
        const uint8array = await blob.bytes();
        expect(uint8array).toEqual(typed_arr);
      });
      it('concurrent reads', async () => {
        const input_arr = new TextEncoder().encode('PASS');
        const blob = new Blob([input_arr]);
        const uint8array_results = await Promise.all([blob.bytes(), blob.bytes(), blob.bytes()]);
        for (let uint8array of uint8array_results) {
          expect(uint8array instanceof Uint8Array).toBeTruthy();
          expect(uint8array).toEqual(input_arr);
        }
      });
    });

    // Windows platforms use CRLF as the native line ending. All others use LF.
    const crlf = Platform.OS == 'windows';
    const native_ending = crlf ? '\r\n' : '\n';
    describe('constructor-endings', async () => {
      it('valid endings value', () => {
        const blob0 = new Blob([], { endings: 'native' });
        const blob1 = new Blob([], { endings: 'transparent' });
        expect(blob0).toBeTruthy();
        expect(blob1).toBeTruthy();
      });
      it('invalud endings value', () => {
        [null, '', 'invalidEnumValue', 'Transparent', 'NATIVE', 0, {}].forEach((ending) => {
          // @ts-expect-error
          expect(() => new Blob([], { endings: ending })).toThrow();
        });
      });
      it('Exception propagation from options', () => {
        const test_error = { name: 'test string' };
        // @ts-expect-error
        expect(
          () =>
            new Blob([], {
              get endings() {
                throw test_error;
              },
            })
        ).toThrow('test string');
      });
      // TODO weird test, as it could maybe be used lazily and not in the constructor
      it("The 'endings' options property is used", () => {
        let got = false;
        // @ts-expect-error
        new Blob([], {
          get endings() {
            got = true;
          },
        });
        expect(got).toBeTruthy();
      });
      const sampleEndings = [
        { name: 'LF', input: '\n', native: native_ending },
        { name: 'CR', input: '\r', native: native_ending },

        { name: 'CRLF', input: '\r\n', native: native_ending },
        { name: 'CRCR', input: '\r\r', native: native_ending.repeat(2) },
        { name: 'LFCR', input: '\n\r', native: native_ending.repeat(2) },
        { name: 'LFLF', input: '\n\n', native: native_ending.repeat(2) },

        { name: 'CRCRLF', input: '\r\r\n', native: native_ending.repeat(2) },
        { name: 'CRLFLF', input: '\r\n\n', native: native_ending.repeat(2) },
        { name: 'CRLFCR', input: '\r\n\r\n', native: native_ending.repeat(2) },

        { name: 'CRLFCRLF', input: '\r\n\r\n', native: native_ending.repeat(2) },
        { name: 'LFCRLFCR', input: '\n\r\n\r', native: native_ending.repeat(3) },
      ];
      it('Newlines should not change with endings unspecified', () => {
        sampleEndings.forEach((testCase) => {
          const blob = new Blob([testCase.input]);
          expect(blob.syncText()).toBe(testCase.input);
        });
      });
      it('Newlines should not change with endings "transparent"', () => {
        sampleEndings.forEach((testCase) => {
          const blob = new Blob([testCase.input], { endings: 'transparent' });
          expect(blob.syncText()).toBe(testCase.input);
        });
      });
      it('Newlines should match the platform with endings "native"', () => {
        sampleEndings.forEach((testCase) => {
          const blob = new Blob([testCase.input], { endings: 'native' });
          expect(blob.syncText()).toBe(testCase.native);
        });
      });
      it('CR/LF in adjacent input strings', () => {
        const blob = new Blob(['\r', '\n'], { endings: 'native' });
        const expected = native_ending.repeat(2);
        expect(blob.syncText()).toBe(expected);
      });
    });

    describe('constructor', () => {
      it('globalThis should have a Blob property.', () => {
        expect('Blob' in globalThis).toBeTruthy();
      });
      it('Blob.length should be 0', () => {
        expect(Blob.length).toBe(0);
      });
      it('Blob should be a function', () => {
        expect(Blob instanceof Function).toBeTruthy();
      });
      it('Blob constructor with no arguments', () => {
        var blob = new Blob();
        expect(blob instanceof Blob).toBeTruthy();
        expect(String(blob)).toBe('[object Blob]');
        expect(blob.size).toBe(0);
        expect(blob.type).toBe('');
      });
      it("Blob constructor with no arguments, without 'new'", () => {
        expect(() => {
          var blob = Blob();
        }).toThrow();
      });
      it('Blob constructor without brackets', () => {
        var blob = new Blob();
        expect(blob instanceof Blob).toBeTruthy();
        expect(blob.size).toBe(0);
        expect(blob.type).toBe('');
      });
      it('Blob constructor with undefined as first argument', () => {
        var blob = new Blob(undefined);
        expect(blob instanceof Blob).toBeTruthy();
        expect(String(blob)).toBe('[object Blob]');
        expect(blob.size).toBe(0);
        expect(blob.type).toBe('');
      });
      // TODO Something wrong with null ? Why should Blob() work and Blob(null) not ???
      it('Passing non-objects, Dates and RegExps for blobParts should throw a TypeError.', () => {
        var args = [
          null,
          true,
          false,
          0,
          1,
          1.5,
          'FAIL',
          new Date(),
          // @ts-expect-error
          new RegExp(),
          {},
          { 0: 'FAIL', length: 1 },
        ];
        args.forEach((arg) => {
          // @ts-expect-error
          expect(() => new Blob(arg)).toThrow();
        });
      });
      test_blob(
        function () {
          return new Blob({
            [Symbol.iterator]: Array.prototype[Symbol.iterator],
          });
        },
        {
          expected: '',
          type: '',
          desc: 'A plain object with @@iterator should be treated as a sequence for the blobParts argument.',
        }
      );
      it('A plain object with custom @@iterator should be treated as a sequence for the blobParts argument.', () => {
        const blob = new Blob({
          [Symbol.iterator]() {
            var i = 0;
            return {
              next: () =>
                [{ done: false, value: 'ab' }, { done: false, value: 'cde' }, { done: true }][i++],
            };
          },
        });
        expect(blob.size).toBe(5);
      });
      it('A plain object with @@iterator and a length property should be treated as a sequence for the blobParts argument.', () => {
        let blob = new Blob({
          [Symbol.iterator]: Array.prototype[Symbol.iterator],
          0: 'PASS',
          length: 1,
        });
        expect(blob.syncText()).toEqual('PASS');
        expect(blob.type).toBe('');
      });
      it('A String object should be treated as a sequence for the blobParts argument.', () => {
        let blob = new Blob(new String('xyz'));
        expect(blob.syncText()).toEqual('xyz');
        expect(blob.type).toBe('');
      });
      test_blob(
        function () {
          return new Blob(new String('xyz'));
        },
        {
          expected: 'xyz',
          type: '',
          desc: 'A String object should be treated as a sequence for the blobParts argument.',
        }
      );
      test_blob(
        function () {
          return new Blob(new Uint8Array([1, 2, 3]));
        },
        {
          expected: '123',
          type: '',
          desc: 'A Uint8Array object should be treated as a sequence for the blobParts argument.',
        }
      );

      it('The length getter should be invoked and any exceptions should be propagated.', () => {
        expect(() => {
          var obj = {
            [Symbol.iterator]: Array.prototype[Symbol.iterator],
            get length() {
              throw test_error;
            },
          };
          new Blob(obj);
        }).toThrow(test_error);
      });
      it('ToUint32 should be applied to the length and any exceptions should be propagated.', () => {
        expect(() => {
          var obj = {
            [Symbol.iterator]: Array.prototype[Symbol.iterator],
            length: {
              valueOf: null,
              toString: function () {
                throw test_error;
              },
            },
          };
          new Blob(obj);
        }).toThrow(test_error);
        expect(() => {
          var obj = {
            [Symbol.iterator]: Array.prototype[Symbol.iterator],
            length: {
              valueOf: function () {
                throw test_error;
              },
            },
          };
          new Blob(obj);
        }).toThrow(test_error);
      });
      it('Getters and value conversions should happen in order until an exception is thrown.', () => {
        var received = [];
        var obj = {
          get [Symbol.iterator]() {
            received.push('Symbol.iterator');
            return Array.prototype[Symbol.iterator];
          },
          get length() {
            received.push('length getter');
            return {
              valueOf: function () {
                received.push('length valueOf');
                return 3;
              },
            };
          },
          get 0() {
            received.push('0 getter');
            return {
              toString: function () {
                received.push('0 toString');
                return 'a';
              },
            };
          },
          get 1() {
            received.push('1 getter');
            throw test_error;
          },
          get 2() {
            received.push('2 getter');
            expect(true).toBe(false);
            return 'unreachable';
          },
        };
        expect(() => new Blob(obj)).toThrow(test_error);
        // Somehow we don't call 0 toString but I don't know why not or why would we
        expect(received).toEqual([
          'Symbol.iterator',
          'length getter',
          'length valueOf',
          '0 getter',
          '0 toString',
          'length getter',
          'length valueOf',
          '1 getter',
        ]);
      });
      it('ToString should be called on elements of the blobParts array and any exceptions should be propagated.', () => {
        expect(
          () =>
            new Blob([
              {
                toString: function () {
                  throw test_error;
                },
              },
            ])
        ).toThrow(test_error);
        expect(
          () =>
            new Blob([
              {
                toString: undefined,
                valueOf: function () {
                  throw test_error;
                },
              },
            ])
        ).toThrow(test_error);
        expect(
          () =>
            new Blob([
              {
                toString: function () {
                  throw test_error;
                },
                valueOf: function () {
                  expect(false).toBe(true);
                },
              },
            ])
        ).toThrow(test_error);
        // TODO add the proper TypeError type to toThrow
        expect(() => new Blob([{ toString: null, valueOf: null }])).toThrow();
      });
      test_blob(
        function () {
          var arr = [
            {
              toString: function () {
                arr.pop();
                return 'PASS';
              },
            },
            { toString: function () {} },
          ];
          return new Blob(arr);
        },
        {
          expected: 'PASS',
          type: '',
          desc: 'Changes to the blobParts array should be reflected in the returned Blob (pop).',
        }
      );
      test_blob(
        function () {
          var arr = [
            {
              toString: function () {
                if (arr.length === 3) {
                  return 'A';
                }
                arr.unshift({
                  toString: function () {
                    expect(true).toBe(false);
                  },
                });
                return 'P';
              },
            },
            {
              toString: function () {
                return 'SS';
              },
            },
          ];
          return new Blob(arr);
        },
        {
          expected: 'PASS',
          type: '',
          desc: 'Changes to the blobParts array should be reflected in the returned Blob (unshift).',
        }
      );
      test_blob(
        function () {
          // https://www.w3.org/Bugs/Public/show_bug.cgi?id=17652
          return new Blob([
            null,
            undefined,
            true,
            false,
            0,
            1,
            new String('stringobject'),
            [],
            ['x', 'y'],
            {},
            { 0: 'FAIL', length: 1 },
            {
              toString: function () {
                return 'stringA';
              },
            },
            {
              toString: undefined,
              valueOf: function () {
                return 'stringB';
              },
            },
            {
              valueOf: function () {
                expect(false).toBe(true);
              },
            },
          ]);
        },
        {
          expected:
            'nullundefinedtruefalse01stringobjectx,y[object Object][object Object]stringAstringB[object Object]',
          type: '',
          desc: 'ToString should be called on elements of the blobParts array.',
        }
      );
      test_blob(
        function () {
          return new Blob([new ArrayBuffer(8)]);
        },
        {
          expected: '\0\0\0\0\0\0\0\0',
          type: '',
          desc: 'ArrayBuffer elements of the blobParts array should be supported.',
        }
      );

      test_blob(
        function () {
          return new Blob([
            new Uint8Array([0x50, 0x41, 0x53, 0x53]),
            new Int8Array([0x50, 0x41, 0x53, 0x53]),
            new Uint16Array([0x4150, 0x5353]),
            new Int16Array([0x4150, 0x5353]),
            new Uint32Array([0x53534150]),
            new Int32Array([0x53534150]),
            new Float32Array([0xd341500000]),
          ]);
        },
        {
          expected: 'PASSPASSPASSPASSPASSPASSPASS',
          type: '',
          desc: 'Passing typed arrays as elements of the blobParts array should work.',
        }
      );
      test_blob(
        function () {
          return new Blob([new Float16Array([2.65625, 58.59375])]);
        },
        {
          expected: 'PASS',
          type: '',
          desc: 'Passing a Float16Array as element of the blobParts array should work.',
        }
      );
      test_blob(
        function () {
          return new Blob([
            // 0x535 3415053534150
            // 0x535 = 0b010100110101 -> Sign = +, Exponent = 1333 - 1023 = 310
            // 0x13415053534150 * 2**(-52)
            // ==> 0x13415053534150 * 2**258 = 2510297372767036725005267563121821874921913208671273727396467555337665343087229079989707079680
            new Float64Array([
              2510297372767036725005267563121821874921913208671273727396467555337665343087229079989707079680,
            ]),
          ]);
        },
        {
          expected: 'PASSPASS',
          type: '',
          desc: 'Passing a Float64Array as element of the blobParts array should work.',
        }
      );
      test_blob(
        function () {
          return new Blob([
            new BigInt64Array([BigInt('0x5353415053534150')]),
            new BigUint64Array([BigInt('0x5353415053534150')]),
          ]);
        },
        {
          expected: 'PASSPASSPASSPASS',
          type: '',
          desc: 'Passing BigInt typed arrays as elements of the blobParts array should work.',
        }
      );

      // TODO revisit this one as its implementation is weird in the wpt
      it('Passing a FrozenArray as the blobParts array should work (FrozenArray<MessagePort>).', async () => {
        var channel = new MessageChannel();
        channel.port2.onmessage = this.step_func(function (e) {
          var b_ports = new Blob(e.ports);
          expect(b_ports.size).toEqual('[object MessagePort]'.length);
          this.done();
        });
        var channel2 = new MessageChannel();
        channel.port1.postMessage('', [channel2.port1]);
      });

      test_blob(
        function () {
          var blob = new Blob(['foo']);
          return new Blob([blob, blob]);
        },
        {
          expected: 'foofoo',
          type: '',
          desc: 'Array with two blobs',
        }
      );
      test_blob_binary(
        function () {
          var view = new Uint8Array([0, 255, 0]);
          return new Blob([view.buffer, view.buffer]);
        },
        {
          expected: [0, 255, 0, 0, 255, 0],
          type: '',
          desc: 'Array with two buffers',
        }
      );

      test_blob_binary(
        function () {
          var view = new Uint8Array([0, 255, 0, 4]);
          var blob = new Blob([view, view]);
          expect(blob.size).toBe(8);
          var view1 = new Uint16Array(view.buffer, 2);
          return new Blob([view1, view.buffer, view1]);
        },
        {
          expected: [0, 4, 0, 255, 0, 4, 0, 4],
          type: '',
          desc: 'Array with two bufferviews',
        }
      );

      // TODO revisit this, why can we pass view but not the buffer?
      test_blob(
        function () {
          var view = new Uint8Array([0]);
          var blob = new Blob(['fo']);
          return new Blob([view.buffer, blob, 'foo']);
        },
        {
          expected: '\0fofoo',
          type: '',
          desc: 'Array with mixed types',
        }
      );

      it('options properties should be accessed in lexicographic order.', async () => {
        const accessed = [];
        const stringified = [];

        new Blob([], {
          get type() {
            accessed.push('type');
          },
          get endings() {
            accessed.push('endings');
          },
        });
        new Blob([], {
          type: {
            toString: () => {
              stringified.push('type');
              return '';
            },
          },
          endings: {
            toString: () => {
              stringified.push('endings');
              return 'transparent';
            },
          },
        });
        expect(accessed).toEqual(['endings', 'type']);
        expect(stringified).toEqual(['endings', 'type']);
      });

      it('Arguments should be evaluated from left to right.', async () => {
        expect(
          () =>
            new Blob(
              [
                {
                  toString: function () {
                    throw test_error;
                  },
                },
              ],
              {
                get type() {
                  assert_unreached('type getter should not be called.');
                },
              }
            )
        ).toThrow(test_error);
      });

      describe('Passing arguments for options', () => {
        [null, undefined, {}, { unrecognized: true }, /regex/, function () {}].forEach(
          (arg: any, idx) => {
            test_blob(
              function () {
                return new Blob([], arg);
              },
              {
                expected: '',
                type: '',
                desc:
                  'Passing ' +
                  JSON.stringify(arg) +
                  ' (index ' +
                  idx +
                  ') for options should use the defaults.',
              }
            );
            test_blob(
              function () {
                return new Blob(['\na\r\nb\n\rc\r'], arg);
              },
              {
                expected: '\na\r\nb\n\rc\r',
                type: '',
                desc:
                  'Passing ' +
                  JSON.stringify(arg) +
                  ' (index ' +
                  idx +
                  ') for options should use the defaults (with newlines).',
              }
            );
          }
        );
      });

      describe('Blob constructor should throw with invalid property bag', () => {
        [123, 123.4, true, 'abc'].forEach((arg: any) => {
          it('Passing ' + JSON.stringify(arg) + ' for options should throw', () => {
            expect(() => {
              new Blob([], arg);
            }).toThrow();
          });
        });
      });

      describe('Type test', () => {
        var type_tests = [
          // blobParts, type, expected type
          [[], '', ''],
          [[], 'a', 'a'],
          [[], 'A', 'a'],
          [[], 'text/html', 'text/html'],
          [[], 'TEXT/HTML', 'text/html'],
          [[], 'text/plain;charset=utf-8', 'text/plain;charset=utf-8'],
          [[], '\u00E5', ''],
          [[], '\uD801\uDC7E', ''], // U+1047E
          [[], ' image/gif ', ' image/gif '],
          [[], '\timage/gif\t', ''],
          [[], 'image/gif;\u007f', ''],
          [[], '\u0130mage/gif', ''], // uppercase i with dot
          [[], '\u0131mage/gif', ''], // lowercase dotless i
          [[], 'image/gif\u0000', ''],
          // check that type isn't changed based on sniffing
          [[0x3c, 0x48, 0x54, 0x4d, 0x4c, 0x3e], 'unknown/unknown', 'unknown/unknown'], // "<HTML>"
          [[0x00, 0xff], 'text/plain', 'text/plain'],
          [[0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 'image/png', 'image/png'], // "GIF89a"
        ];

        type_tests.forEach(function (t: Array<any>) {
          it('Blob with type ' + JSON.stringify(t[1]), () => {
            // TODO Why this construction? It does'nt work yet, but it's not what we test for...
            // var arr = new Uint8Array([t[0]]).buffer;
            // var b = new Blob([arr], {type:t[1]});

            var b = new Blob(t[0], { type: t[1] });
            expect(b.type).toEqual(t[2]);
          });
        });
      });
    });

    describe('constructor dom windows', async () => {
      it('Passing platform objects for blobParts should throw a TypeError.', () => {
        const document = new Document();
        var args = [document.createElement('div'), window];
        args.forEach((arg) => {
          expect(() => new Blob(arg)).toThrow();
        });
      });

      it("A platform object that supports indexed properties should be treated as a sequence for the blobParts argument (overwritten 'length'.)", () => {
        var element = document.createElement('div');
        element.appendChild(document.createElement('div'));
        element.appendChild(document.createElement('p'));
        var list = element.children;
        Object.defineProperty(list, 'length', {
          get: function () {
            throw test_error;
          },
        });
        expect(() => {
          new Blob(list);
        }).toThrow(test_error);
      });

      test_blob(
        function () {
          const document = new Document();
          var select = document.createElement('select');
          select.appendChild(document.createElement('option'));
          return new Blob(select);
        },
        {
          expected: '[object HTMLOptionElement]',
          type: '',
          desc: 'Passing a platform object that supports indexed properties as the blobParts array should work (select).',
        }
      );

      test_blob(
        function () {
          const document = new Document();
          var elm = document.createElement('div');
          elm.setAttribute('foo', 'bar');
          return new Blob(elm.attributes);
        },
        {
          expected: '[object Attr]',
          type: '',
          desc: 'Passing an platform object that supports indexed properties as the blobParts array should work (attributes).',
        }
      );
    });

    describe('Text', async () => {
      it('simple', async () => {
        const blob = new Blob(['PASS']);
        const text = await blob.text();
        expect(text).toBe('PASS');
      });
      it('empty blob data', async () => {
        const blob = new Blob();
        const text = await blob.text();
        expect(text).toBe('');
      });
      it('multi-element array in constructor', async () => {
        const blob = new Blob(['P', 'A', 'SS']);
        const text = await blob.text();
        expect(text).toBe('PASS');
      });
      it('non-unicode', async () => {
        const non_unicode = '\u0061\u030A';
        const input_arr = new TextEncoder().encode(non_unicode);
        const blob = new Blob([input_arr]);
        const text = await blob.text();
        expect(text).toBe(non_unicode);
      });
      it('different charset param in type option', async () => {
        const blob = new Blob(['PASS'], { type: 'text/plain;charset=utf-16le' });
        const text = await blob.text();
        expect(text).toBe('PASS');
      });
      it('Sync Text', () => {
        const blob = new Blob(['PA', 'SS']);
        const text = blob.syncText();
        expect(text).toBe('PASS');
      });
      it('different charset param with non-ascii input', async () => {
        const non_unicode = '\u0061\u030A';
        const input_arr = new TextEncoder().encode(non_unicode);
        const blob = new Blob([input_arr], { type: 'text/plain;charset=utf-16le' });
        const text = await blob.text();
        expect(text).toBe(non_unicode);
      });
      it('invalid utf-8 input', async () => {
        const input_arr = new Uint8Array([
          192, 193, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255,
        ]);
        const blob = new Blob([input_arr]);
        const text = await blob.text();
        expect(text).toBe(
          '\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd'
        );
      });
      it('Promise.all multiple reads', async () => {
        const input_arr = new Uint8Array([
          192, 193, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255,
        ]);
        const blob = new Blob([input_arr]);
        const text_results = await Promise.all([blob.text(), blob.text(), blob.text()]);
        text_results.forEach((text) => {
          expect(text).toBe(
            '\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd\ufffd'
          );
        });
      });
    });

    describe('Worker', async () => {
      it('Create Blob in Worker', async () => {
        const data = 'TEST';
        const blob = new Blob([data], { type: 'text/plain' });
        expect(await blob.text()).toEqual(data);
      });
    });

    describe('Blob slice overflow', async () => {
      var text = '';

      for (var i = 0; i < 2000; ++i) {
        text += 'A';
      }

      it('slice start is negative, relativeStart will be max((size + start), 0)', () => {
        var blob = new Blob([text]);
        var sliceBlob = blob.slice(-1, blob.size);
        expect(sliceBlob.size).toBe(1);
      });

      it('slice start is greater than blob size, relativeStart will be min(start, size)', () => {
        var blob = new Blob([text]);
        var sliceBlob = blob.slice(blob.size + 1, blob.size);
        expect(sliceBlob.size).toBe(0);
      });

      it('slice end is negative, relativeEnd will be max((size + end), 0)', () => {
        var blob = new Blob([text]);
        var sliceBlob = blob.slice(blob.size - 2, -1);
        expect(sliceBlob.size).toBe(1);
      });

      it('slice end is greater than blob size, relativeEnd will be min(end, size)', () => {
        var blob = new Blob([text]);
        var sliceBlob = blob.slice(blob.size - 2, blob.size + 999);
        expect(sliceBlob.size).toBe(2);
      });
    });

    describe('Blob Slice', async () => {
      test_blob(
        () => {
          var blobTemp = new Blob(['PASS']);
          return blobTemp.slice();
        },
        {
          expected: 'PASS',
          type: '',
          desc: 'no-argument Blob slice',
        }
      );

      describe('Slices', async () => {
        var blob1 = new Blob(['squiggle']);
        var blob2 = new Blob(['steak'], { type: 'content/type' });

        test_blob(() => blob1, {
          expected: 'squiggle',
          type: '',
          desc: 'blob1.',
        });

        test_blob(() => blob2, {
          expected: 'steak',
          type: 'content/type',
          desc: 'blob2.',
        });

        test_blob(
          () => {
            return new Blob().slice(0, 0, null);
          },
          {
            expected: '',
            type: 'null',
            desc: 'null type Blob slice',
          }
        );

        test_blob(
          () => {
            return new Blob().slice(0, 0, undefined);
          },
          {
            expected: '',
            type: '',
            desc: 'undefined type Blob slice',
          }
        );

        test_blob(
          () => {
            return new Blob().slice(0, 0);
          },
          {
            expected: '',
            type: '',
            desc: 'no type Blob slice',
          }
        );

        var arrayBuffer = new ArrayBuffer(16);
        var int8View = new Int8Array(arrayBuffer);
        for (var i = 0; i < 16; i++) {
          int8View[i] = i + 65;
        }

        var testData = [
          [
            ['PASSSTRING'],
            [
              { start: -6, contents: 'STRING' },
              { start: -12, contents: 'PASSSTRING' },
              { start: 4, contents: 'STRING' },
              { start: 12, contents: '' },
              { start: 0, end: -6, contents: 'PASS' },
              { start: 0, end: -12, contents: '' },
              { start: 0, end: 4, contents: 'PASS' },
              { start: 0, end: 12, contents: 'PASSSTRING' },
              { start: 7, end: 4, contents: '' },
            ],
          ],

          // Test 3 strings
          [
            ['foo', 'bar', 'baz'],
            [
              { start: 0, end: 9, contents: 'foobarbaz' },
              { start: 0, end: 3, contents: 'foo' },
              { start: 3, end: 9, contents: 'barbaz' },
              { start: 6, end: 9, contents: 'baz' },
              { start: 6, end: 12, contents: 'baz' },
              { start: 0, end: 9, contents: 'foobarbaz' },
              { start: 0, end: 11, contents: 'foobarbaz' },
              { start: 10, end: 15, contents: '' },
            ],
          ],

          // Test string, Blob, string
          [
            ['foo', blob1, 'baz'],
            [
              { start: 0, end: 3, contents: 'foo' },
              { start: 3, end: 11, contents: 'squiggle' },
              { start: 2, end: 4, contents: 'os' },
              { start: 10, end: 12, contents: 'eb' },
            ],
          ],

          // Test blob, string, blob
          [
            [blob1, 'foo', blob1],
            [
              { start: 0, end: 8, contents: 'squiggle' },
              { start: 7, end: 9, contents: 'ef' },
              { start: 10, end: 12, contents: 'os' },
              { start: 1, end: 4, contents: 'qui' },
              { start: 12, end: 15, contents: 'qui' },
              { start: 40, end: 60, contents: '' },
            ],
          ],

          // Test blobs all the way down
          [
            [blob2, blob1, blob2],
            [
              { start: 0, end: 5, contents: 'steak' },
              { start: 5, end: 13, contents: 'squiggle' },
              { start: 13, end: 18, contents: 'steak' },
              { start: 1, end: 3, contents: 'te' },
              { start: 6, end: 10, contents: 'quig' },
            ],
          ],

          // Test an ArrayBufferView
          [
            [int8View, blob1, 'foo'],
            [
              { start: 0, end: 8, contents: 'ABCDEFGH' },
              { start: 8, end: 18, contents: 'IJKLMNOPsq' },
              { start: 17, end: 20, contents: 'qui' },
              { start: 4, end: 12, contents: 'EFGHIJKL' },
            ],
          ],

          // Test a partial ArrayBufferView
          [
            [new Uint8Array(arrayBuffer, 3, 5), blob1, 'foo'],
            [
              { start: 0, end: 8, contents: 'DEFGHsqu' },
              { start: 8, end: 18, contents: 'igglefoo' },
              { start: 4, end: 12, contents: 'Hsquiggl' },
            ],
          ],

          // Test type coercion of a number
          [
            [3, int8View, 'foo'],
            [
              { start: 0, end: 8, contents: '3ABCDEFG' },
              { start: 8, end: 18, contents: 'HIJKLMNOPf' },
              { start: 17, end: 21, contents: 'foo' },
              { start: 4, end: 12, contents: 'DEFGHIJK' },
            ],
          ],

          [
            [new Uint8Array([0, 255, 0]).buffer, new Blob(['abcd']), 'efgh', 'ijklmnopqrstuvwxyz'],
            [
              { start: 1, end: 4, contents: '\uFFFD\u0000a' },
              { start: 4, end: 8, contents: 'bcde' },
              { start: 8, end: 12, contents: 'fghi' },
              { start: 1, end: 12, contents: '\uFFFD\u0000abcdefghi' },
            ],
          ],
        ];

        testData.forEach(function (data, i) {
          var blobs = data[0];
          var tests = data[1];
          tests.forEach(function (expectations, j) {
            describe('Slicing test (' + i + ',' + j + ').', () => {
              var blob = new Blob(blobs);

              it('blob is an instance of Blob', () => {
                expect(blob instanceof Blob).toBeTruthy();
                expect(blob instanceof File).toBeFalsy();
              });

              test_blob(
                () => {
                  return expectations.end === undefined
                    ? blob.slice(expectations.start)
                    : blob.slice(expectations.start, expectations.end);
                },
                {
                  expected: expectations.contents,
                  type: '',
                  desc: 'Slicing test: slice (' + i + ',' + j + ').',
                }
              );
            });
          });
        });
      });

      describe('Invalid content types', () => {
        var invalidTypes = [
          '\xFF',
          'te\x09xt/plain',
          'te\x00xt/plain',
          'te\x1Fxt/plain',
          'te\x7Fxt/plain',
        ];
        invalidTypes.forEach(function (type) {
          test_blob(
            () => {
              var blob = new Blob(['PASS']);
              return blob.slice(0, 4, type);
            },
            {
              expected: 'PASS',
              type: '',
              desc: 'Invalid contentType (' + JSON.stringify(type) + ')',
            }
          );
        });
      });

      var validTypes = [
        'te(xt/plain',
        'te)xt/plain',
        'te<xt/plain',
        'te>xt/plain',
        'te@xt/plain',
        'te,xt/plain',
        'te;xt/plain',
        'te:xt/plain',
        'te\\xt/plain',
        'te"xt/plain',
        'te/xt/plain',
        'te[xt/plain',
        'te]xt/plain',
        'te?xt/plain',
        'te=xt/plain',
        'te{xt/plain',
        'te}xt/plain',
        'te\x20xt/plain',
        'TEXT/PLAIN',
        'text/plain;charset = UTF-8',
        'text/plain;charset=UTF-8',
      ];
      describe('valid content types', () => {
        validTypes.forEach((type) => {
          test_blob(
            () => {
              var blob = new Blob(['PASS']);
              return blob.slice(0, 4, type);
            },
            {
              expected: 'PASS',
              type: type.toLowerCase(),
              desc: 'Valid contentType (' + JSON.stringify(type) + ')',
            }
          );
        });
      });
    });

    describe('stream', async () => {
      it('stream byob crash', async () => {
        let a = new Blob(['', '', undefined], {});
        let b = a.stream();
        let c = new ReadableStreamBYOBReader(b);
        let d = new Int16Array(8);
        await c.read(d);
        c.releaseLock();
        await a.text();
        await b.cancel();
      });

      it('stream xhr crash', async () => {
        // TODO this constructor doesn't work need to fix it
        // const blob = new Blob([1, 2]);
        const blob = new Blob([Int32Array.from([1, 2])]);
        const readable = blob.stream();
        const writable = new WritableStream(
          {},
          {
            size() {
              let xhr = new XMLHttpRequest();
              xhr.open('POST', '1', false);
              xhr.send();
            },
          }
        );
        readable.pipeThrough({ readable, writable });
      });

      it('Blob.stream()', async () => {
        const blob = new Blob(['PASS']);
        const stream = blob.stream();
        const chunks = await read_all_chunks(stream);
        for (let [index, value] of chunks.entries()) {
          expect(value).toEqual('PASS'.charCodeAt(index));
        }
      });

      it('Blob.stream() empty Blob', async () => {
        const blob = new Blob();
        const stream = blob.stream();
        const chunks = await read_all_chunks(stream);
        expect(chunks).toEqual([]);
      });

      it('Blob.stream() non-unicode input', async () => {
        const input_arr = [8, 241, 48, 123, 151];
        const typed_arr = new Uint8Array(input_arr);
        const blob = new Blob([typed_arr]);
        const stream = blob.stream();
        const chunks = await read_all_chunks(stream);
        expect(chunks).toEqual(input_arr);
      });

      it(
        "Blob.stream() garbage collection of blob shouldn't break stream " + 'consumption',
        async () => {
          const input_arr = [8, 241, 48, 123, 151];
          const typed_arr = new Uint8Array(input_arr);
          let blob = new Blob([typed_arr]);
          const stream = blob.stream();
          blob = null;
          // TODO Actually call garbageCollect()
          // await garbageCollect();
          const chunks = await read_all_chunks(stream, { perform_gc: true });
          expect(chunks).toEqual(input_arr);
        }
      );

      it(
        "Blob.stream() garbage collection of stream shouldn't break stream " + 'consumption',
        async () => {
          const input_arr = [8, 241, 48, 123, 151];
          const typed_arr = new Uint8Array(input_arr);
          let blob = new Blob([typed_arr]);
          const chunksPromise = read_all_chunks(blob.stream());
          // It somehow matters to do GC here instead of doing `perform_gc: true`
          // TODO Actually call garbageCollect()
          // await garbageCollect();
          expect(await chunksPromise).toEqual(input_arr);
        }
      );

      it('Reading Blob.stream() with BYOB reader', async () => {
        const input_arr = [8, 241, 48, 123, 151];
        const typed_arr = new Uint8Array(input_arr);
        let blob = new Blob([typed_arr]);
        const stream = blob.stream();
        const chunks = await read_all_chunks(stream, { mode: 'byob' });
        expect(chunks).toEqual(input_arr);
      });
    });
  });
}
