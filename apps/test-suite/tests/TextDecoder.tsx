export const name = 'TextDecoder';

const THE_ENCODING = ['utf-8'];

const LEGACY_ENCODINGS = [
  'ibm866',
  'iso-8859-2',
  'iso-8859-3',
  'iso-8859-4',
  'iso-8859-5',
  'iso-8859-6',
  'iso-8859-7',
  'iso-8859-8',
  'iso-8859-10',
  'iso-8859-13',
  'iso-8859-14',
  'iso-8859-15',
  'iso-8859-16',
  'koi8-r',
  'koi8-u',
  'macintosh',
  'windows-874',
  'windows-1250',
  'windows-1251',
  'windows-1252',
  'windows-1253',
  'windows-1254',
  'windows-1255',
  'windows-1256',
  'windows-1257',
  'windows-1258',
  'x-mac-cyrillic',
  'gbk',
  'gb18030',
  'big5',
  'euc-jp',
  'iso-2022-jp',
  'shift_jis',
  'euc-kr',
  'utf-16le',
  'utf-16be',
];

const ASCII_SUPERSETS = THE_ENCODING.concat(LEGACY_ENCODINGS).filter(function (e) {
  return e !== 'utf-16le' && e !== 'utf-16be';
});

const FIXTURES = require.context('../assets/fixtures/encoding', false, /\.json$/);

export function test({ describe, it, expect }) {
  describe('TextDecoder', () => {
    // https://github.com/inexorabletash/text-encoding/blob/master/test/test-big5.js

    it(`uses the Expo built-in APIs`, () => {
      expect(TextDecoder[Symbol.for('expo.builtin')]).toBe(true);
      expect(TextEncoder[Symbol.for('expo.builtin')]).toBe(true);
    });

    FIXTURES.keys()
      .slice(0, 1)
      .forEach((key) => {
        const { encoding, bytes, string } = FIXTURES(key);
        it(`supports "${encoding}" encoding`, () => {
          const decoder = new TextDecoder(encoding);
          expect(decoder.encoding).toBe(encoding);
          expect(decoder.decode(new Uint8Array(bytes))).toBe(string);
        });
      });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L34C1-L47C18
    it(`has expected attributes`, () => {
      expect('encoding' in new TextEncoder()).toBe(true);
      expect(new TextEncoder().encoding).toBe('utf-8');

      expect('encoding' in new TextDecoder()).toBe(true);

      expect(new TextDecoder().encoding).toBe('utf-8');
      expect(new TextDecoder('utf-16le').encoding).toBe('utf-16le');

      expect('fatal' in new TextDecoder()).toBe(true);
      expect(new TextDecoder('utf-8').fatal).toBe(false);
      expect(new TextDecoder('utf-8', { fatal: true }).fatal).toBe(true);

      expect('ignoreBOM' in new TextDecoder()).toBe(true);
      expect(new TextDecoder('utf-8').ignoreBOM).toBe(false);
      expect(new TextDecoder('utf-8', { ignoreBOM: true }).ignoreBOM).toBe(true);
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L49C1-L64C16
    it(`handles bad data`, () => {
      [
        { input: '\ud800', expected: '\ufffd' }, // Surrogate half
        { input: '\udc00', expected: '\ufffd' }, // Surrogate half
        { input: 'abc\ud800def', expected: 'abc\ufffddef' }, // Surrogate half
        { input: 'abc\udc00def', expected: 'abc\ufffddef' }, // Surrogate half
        { input: '\udc00\ud800', expected: '\ufffd\ufffd' }, // Wrong order
      ].forEach(({ input, expected }) => {
        const encoded = new TextEncoder().encode(input);
        const decoded = new TextDecoder().decode(encoded);
        expect(expected).toBe(decoded);
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L66C1-L91C18
    describe('fatal flag', () => {
      const bad = [
        { encoding: 'utf-8', input: [0xc0] }, // ends early
        { encoding: 'utf-8', input: [0xc0, 0x00] }, // invalid trail
        { encoding: 'utf-8', input: [0xc0, 0xc0] }, // invalid trail
        { encoding: 'utf-8', input: [0xe0] }, // ends early
        { encoding: 'utf-8', input: [0xe0, 0x00] }, // invalid trail
        { encoding: 'utf-8', input: [0xe0, 0xc0] }, // invalid trail
        { encoding: 'utf-8', input: [0xe0, 0x80, 0x00] }, // invalid trail
        { encoding: 'utf-8', input: [0xe0, 0x80, 0xc0] }, // invalid trail
        { encoding: 'utf-8', input: [0xfc, 0x80, 0x80, 0x80, 0x80, 0x80] }, // > 0x10FFFF
        { encoding: 'utf-16le', input: [0x00] }, // truncated code unit
        { encoding: 'utf-16le', input: [0x00, 0xd8] }, // surrogate half
        { encoding: 'utf-16le', input: [0x00, 0xd8, 0x00, 0x00] }, // surrogate half
        { encoding: 'utf-16le', input: [0x00, 0xdc, 0x00, 0x00] }, // trail surrogate
        { encoding: 'utf-16le', input: [0x00, 0xdc, 0x00, 0xd8] }, // swapped surrogates
        // TODO: Single byte encoding cases
      ];

      bad.forEach((t) => {
        it(`should throw a TypeError for encoding ${t.encoding} and input ${t.input}`, () => {
          expect(() => {
            new TextDecoder(t.encoding, { fatal: true }).decode(new Uint8Array(t.input));
          }).toThrow(TypeError);
        });
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L93C1-L108C43
    it('Encoding names are case insensitive', () => {
      const encodings = [
        { label: 'utf-8', encoding: 'utf-8' },
        { label: 'utf-16', encoding: 'utf-16le' },
        { label: 'utf-16le', encoding: 'utf-16le' },
        { label: 'utf-16be', encoding: 'utf-16be' },
        { label: 'ascii', encoding: 'windows-1252' },
        { label: 'iso-8859-1', encoding: 'windows-1252' },
      ];

      encodings.forEach((test) => {
        expect(new TextDecoder(test.label.toLowerCase()).encoding).toBe(test.encoding);
        expect(new TextDecoder(test.label.toUpperCase()).encoding).toBe(test.encoding);
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L110C1-L163C24
    it('Byte-order marks', () => {
      const utf8_bom = [0xef, 0xbb, 0xbf];
      const utf8 = [
        0x7a, 0xc2, 0xa2, 0xe6, 0xb0, 0xb4, 0xf0, 0x9d, 0x84, 0x9e, 0xf4, 0x8f, 0xbf, 0xbd,
      ];

      const utf16le_bom = [0xff, 0xfe];
      const utf16le = [
        0x7a, 0x00, 0xa2, 0x00, 0x34, 0x6c, 0x34, 0xd8, 0x1e, 0xdd, 0xff, 0xdb, 0xfd, 0xdf,
      ];

      const utf16be_bom = [0xfe, 0xff];
      const utf16be = [
        0x00, 0x7a, 0x00, 0xa2, 0x6c, 0x34, 0xd8, 0x34, 0xdd, 0x1e, 0xdb, 0xff, 0xdf, 0xfd,
      ];

      const string = 'z\xA2\u6C34\uD834\uDD1E\uDBFF\uDFFD'; // z, cent, CJK water, G-Clef, Private-use character

      // missing BOMs
      expect(new TextDecoder('utf-8').decode(new Uint8Array(utf8))).toBe(string);
      expect(new TextDecoder('utf-16le').decode(new Uint8Array(utf16le))).toBe(string);
      expect(new TextDecoder('utf-16be').decode(new Uint8Array(utf16be))).toBe(string);

      // matching BOMs
      expect(new TextDecoder('utf-8').decode(new Uint8Array([...utf8_bom, ...utf8]))).toBe(string);
      expect(new TextDecoder('utf-16le').decode(new Uint8Array([...utf16le_bom, ...utf16le]))).toBe(
        string
      );
      expect(new TextDecoder('utf-16be').decode(new Uint8Array([...utf16be_bom, ...utf16be]))).toBe(
        string
      );

      // mismatching BOMs
      expect(new TextDecoder('utf-8').decode(new Uint8Array([...utf16le_bom, ...utf8]))).not.toBe(
        string
      );
      expect(new TextDecoder('utf-8').decode(new Uint8Array([...utf16be_bom, ...utf8]))).not.toBe(
        string
      );

      expect(
        new TextDecoder('utf-16le').decode(new Uint8Array([...utf8_bom, ...utf16le]))
      ).not.toBe(string);
      expect(
        new TextDecoder('utf-16le').decode(new Uint8Array([...utf16be_bom, ...utf16le]))
      ).not.toBe(string);

      expect(
        new TextDecoder('utf-16be').decode(new Uint8Array([...utf8_bom, ...utf16be]))
      ).not.toBe(string);
      expect(
        new TextDecoder('utf-16be').decode(new Uint8Array([...utf16le_bom, ...utf16be]))
      ).not.toBe(string);

      // ignore BOMs
      expect(
        new TextDecoder('utf-8', { ignoreBOM: true }).decode(new Uint8Array([...utf8_bom, ...utf8]))
      ).toBe('\uFEFF' + string);
      expect(
        new TextDecoder('utf-16le', { ignoreBOM: true }).decode(
          new Uint8Array([...utf16le_bom, ...utf16le])
        )
      ).toBe('\uFEFF' + string);
      expect(
        new TextDecoder('utf-16be', { ignoreBOM: true }).decode(
          new Uint8Array([...utf16be_bom, ...utf16be])
        )
      ).toBe('\uFEFF' + string);
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L165
    describe('Encoding names', () => {
      it('should return canonical case for utf-8', () => {
        expect(new TextDecoder('utf-8').encoding).toBe('utf-8');
      });

      it('should return canonical case and name for UTF-16', () => {
        expect(new TextDecoder('UTF-16').encoding).toBe('utf-16le');
      });

      it('should return canonical case and name for UTF-16BE', () => {
        expect(new TextDecoder('UTF-16BE').encoding).toBe('utf-16be');
      });

      it('should return canonical case and name for iso8859-1', () => {
        expect(new TextDecoder('iso8859-1').encoding).toBe('windows-1252');
      });

      it('should return canonical case and name for iso-8859-1', () => {
        expect(new TextDecoder('iso-8859-1').encoding).toBe('windows-1252');
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L173
    describe('Streaming Decode', () => {
      const string = '\x00123ABCabc\x80\xFF\u0100\u1000\uFFFD\uD800\uDC00\uDBFF\uDFFF';
      const cases = [
        {
          encoding: 'utf-8',
          encoded: [
            0, 49, 50, 51, 65, 66, 67, 97, 98, 99, 194, 128, 195, 191, 196, 128, 225, 128, 128, 239,
            191, 189, 240, 144, 128, 128, 244, 143, 191, 191,
          ],
        },
        {
          encoding: 'utf-16le',
          encoded: [
            0, 0, 49, 0, 50, 0, 51, 0, 65, 0, 66, 0, 67, 0, 97, 0, 98, 0, 99, 0, 128, 0, 255, 0, 0,
            1, 0, 16, 253, 255, 0, 216, 0, 220, 255, 219, 255, 223,
          ],
        },
        {
          encoding: 'utf-16be',
          encoded: [
            0, 0, 0, 49, 0, 50, 0, 51, 0, 65, 0, 66, 0, 67, 0, 97, 0, 98, 0, 99, 0, 128, 0, 255, 1,
            0, 16, 0, 255, 253, 216, 0, 220, 0, 219, 255, 223, 255,
          ],
        },
      ];

      cases.forEach((c) => {
        it(`should correctly stream decode ${c.encoding}`, () => {
          for (let len = 1; len <= 5; ++len) {
            let out = '';
            const decoder = new TextDecoder(c.encoding);
            for (let i = 0; i < c.encoded.length; i += len) {
              const sub = c.encoded.slice(i, i + len);
              out += decoder.decode(new Uint8Array(sub), { stream: true });
            }
            out += decoder.decode();
            expect(out).toBe(string);
          }
        });
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L212
    describe('Shift_JIS Decode', () => {
      it('should correctly decode Shift_JIS to corresponding Unicode characters', () => {
        const jis = [0x82, 0xc9, 0x82, 0xd9, 0x82, 0xf1];
        const expected = '\u306B\u307B\u3093'; // Nihon
        expect(new TextDecoder('shift_jis').decode(new Uint8Array(jis))).toBe(expected);
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L218
    describe('Supersets of ASCII decode ASCII correctly', () => {
      it.each(ASCII_SUPERSETS)('should decode ASCII correctly for encoding: %s', (encoding) => {
        let string = '',
          bytes = [];
        for (let i = 0; i < 128; ++i) {
          // Encodings that have escape codes in 0x00-0x7F
          if (encoding === 'iso-2022-jp' && (i === 0x0e || i === 0x0f || i === 0x1b)) {
            continue;
          }

          string += String.fromCharCode(i);
          bytes.push(i);
        }
        const ascii_encoded = new TextEncoder().encode(string);
        expect(new TextDecoder(encoding).decode(ascii_encoded)).toBe(string);
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L236
    describe('Non-fatal errors at EOF', () => {
      it('should throw TypeError for fatal utf-8', () => {
        expect(() =>
          new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array([0xff]))
        ).toThrow(TypeError);
        new TextDecoder('utf-8').decode(new Uint8Array([0xff]));
      });

      it('should throw TypeError for fatal utf-16le', () => {
        expect(() =>
          new TextDecoder('utf-16le', { fatal: true }).decode(new Uint8Array([0x00]))
        ).toThrow(TypeError);
        new TextDecoder('utf-16le').decode(new Uint8Array([0x00]));
      });

      it('should throw TypeError for fatal utf-16be', () => {
        expect(() =>
          new TextDecoder('utf-16be', { fatal: true }).decode(new Uint8Array([0x00]))
        ).toThrow(TypeError);
        new TextDecoder('utf-16be').decode(new Uint8Array([0x00]));
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L250
    describe('Legacy encodings supported only for decode, not encode', () => {
      it.each(LEGACY_ENCODINGS)('should handle encoding %s correctly', (encoding) => {
        expect(new TextDecoder(encoding).encoding).toBe(encoding);
        expect(
          new TextEncoder(
            // @ts-expect-error
            encoding
          ).encoding
        ).toBe('utf-8');
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L257

    describe('Replacement encoding labels', () => {
      const replacementEncodings = [
        'csiso2022kr',
        'hz-gb-2312',
        'iso-2022-cn',
        'iso-2022-cn-ext',
        'iso-2022-kr',
      ];

      it.each(replacementEncodings)(
        'should handle replacement encoding %s correctly',
        (encoding) => {
          expect(
            new TextEncoder(
              // @ts-expect-error
              encoding
            ).encoding
          ).toBe('utf-8');

          expect(() => {
            new TextDecoder(encoding, { fatal: true });
          }).toThrow(RangeError);

          expect(() => {
            new TextDecoder(encoding, { fatal: false });
          }).toThrow(RangeError);
        }
      );
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L280
    describe('ArrayBuffer, ArrayBufferView and buffer offsets', () => {
      it('should decode correctly from various buffer views', () => {
        const decoder = new TextDecoder();
        const bytes = [65, 66, 97, 98, 99, 100, 101, 102, 103, 104, 67, 68, 69, 70, 71, 72];
        const chars = 'ABabcdefghCDEFGH';
        const buffer = new Uint8Array(bytes).buffer;

        expect(decoder.decode(buffer)).toBe(chars);

        const types = [
          'Uint8Array',
          'Int8Array',
          'Uint8ClampedArray',
          'Uint16Array',
          'Int16Array',
          'Uint32Array',
          'Int32Array',
          'Float32Array',
          'Float64Array',
        ];

        types.forEach((typeName) => {
          const TypeConstructor = self[typeName];
          const array = new TypeConstructor(buffer);

          expect(decoder.decode(array)).toBe(chars);

          const subset = new TypeConstructor(
            buffer,
            TypeConstructor.BYTES_PER_ELEMENT,
            8 / TypeConstructor.BYTES_PER_ELEMENT
          );
          expect(decoder.decode(subset)).toBe(
            chars.substring(
              TypeConstructor.BYTES_PER_ELEMENT,
              TypeConstructor.BYTES_PER_ELEMENT + 8
            )
          );
        });
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L305
    describe('Invalid parameters', () => {
      it('should throw errors for invalid parameters', () => {
        expect(() => new TextDecoder(null)).toThrowError(RangeError);
        expect(() => new TextDecoder('utf-8', '')).toThrowError(TypeError);
        expect(() => new TextDecoder('utf-8').decode(null, '')).toThrowError(TypeError);
      });
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L326
    it('GB 18030 2000 vs 2005: U+1E3F, U+E7C7 (decoding)', () => {
      const result = new TextDecoder('gb18030').decode(
        new Uint8Array([0xa8, 0xbc, 0x81, 0x35, 0xf4, 0x37])
      );
      expect(result).toBe('\u1E3F\uE7C7');
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L383
    it('encode() called with falsy arguments (polyfill bindings)', () => {
      const encoder = new TextEncoder();
      expect([...encoder.encode(false)]).toEqual([102, 97, 108, 115, 101]);
      expect([...encoder.encode(0)]).toEqual([48]);
    });

    // https://github.com/inexorabletash/text-encoding/blob/3f330964c0e97e1ed344c2a3e963f4598610a7ad/test/test-misc.js#L389
    it('windows-1255 map 0xCA to U+05BA', () => {
      // Regression test for https://github.com/inexorabletash/text-encoding/issues/59
      expect(new TextDecoder('windows-1255').decode(new Uint8Array([0xca]))).toBe('\u05BA');
    });

    // https://github.com/inexorabletash/text-encoding/blob/master/test/test-utf.js
    describe('UTF-8, UTF-16LE, UTF-16BE - Encode/Decode - reference sample', () => {
      // z, cent, CJK water, G-Clef, Private-use character
      var sample = 'z\xA2\u6C34\uD834\uDD1E\uDBFF\uDFFD';
      var cases = [
        {
          encoding: 'utf-8',
          expected: [
            0x7a, 0xc2, 0xa2, 0xe6, 0xb0, 0xb4, 0xf0, 0x9d, 0x84, 0x9e, 0xf4, 0x8f, 0xbf, 0xbd,
          ],
        },
        {
          encoding: 'utf-16le',
          expected: [
            0x7a, 0x00, 0xa2, 0x00, 0x34, 0x6c, 0x34, 0xd8, 0x1e, 0xdd, 0xff, 0xdb, 0xfd, 0xdf,
          ],
        },
        {
          encoding: 'utf-16',
          expected: [
            0x7a, 0x00, 0xa2, 0x00, 0x34, 0x6c, 0x34, 0xd8, 0x1e, 0xdd, 0xff, 0xdb, 0xfd, 0xdf,
          ],
        },
        {
          encoding: 'utf-16be',
          expected: [
            0x00, 0x7a, 0x00, 0xa2, 0x6c, 0x34, 0xd8, 0x34, 0xdd, 0x1e, 0xdb, 0xff, 0xdf, 0xfd,
          ],
        },
      ];

      cases.forEach(function (t) {
        it('expected equal decodings - ' + t.encoding, () => {
          var decoded = new TextDecoder(t.encoding).decode(new Uint8Array(t.expected));

          expect(decoded).toBe(sample);
        });
      });
    });

    it('UTF-8, UTF-16LE, UTF-16BE - Encode/Decode - full roundtrip and agreement with encode/decodeURIComponent', () => {
      function assert_string_equals(actual, expected, description) {
        // short circuit success case
        if (actual === expected) {
          return;
        }

        // length check
        expect(actual.length).toBe(expected.length);

        for (var i = 0; i < actual.length; i++) {
          var a = actual.charCodeAt(i);
          var b = expected.charCodeAt(i);
          if (a !== b) {
            throw new Error(
              description +
                ': code unit ' +
                i.toString() +
                ' unequal: ' +
                cpname(a) +
                ' != ' +
                cpname(b)
            );
          }
        }

        // It should be impossible to get here, because the initial
        // comparison failed, so either the length comparison or the
        // codeunit-by-codeunit comparison should also fail.
        throw new Error(description + ': failed to detect string difference');
      }

      // Inspired by:
      // http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
      function encode_utf8(string) {
        var utf8 = unescape(encodeURIComponent(string));
        var octets = new Uint8Array(utf8.length),
          i;
        for (i = 0; i < utf8.length; i += 1) {
          octets[i] = utf8.charCodeAt(i);
        }
        return octets;
      }

      function decode_utf8(octets) {
        var utf8 = String.fromCharCode.apply(null, octets);
        return decodeURIComponent(escape(utf8));
      }

      // Helpers for test_utf_roundtrip.
      function cpname(n) {
        if (n + 0 !== n) return n.toString();
        var w = n <= 0xffff ? 4 : 6;
        return 'U+' + ('000000' + n.toString(16).toUpperCase()).slice(-w);
      }

      function genblock(from, len, skip) {
        var block = [];
        for (var i = 0; i < len; i += skip) {
          var cp = from + i;
          if (0xd800 <= cp && cp <= 0xdfff) continue;
          if (cp < 0x10000) {
            block.push(String.fromCharCode(cp));
            continue;
          }
          cp = cp - 0x10000;
          block.push(String.fromCharCode(0xd800 + (cp >> 10)));
          block.push(String.fromCharCode(0xdc00 + (cp & 0x3ff)));
        }
        return block.join('');
      }

      function encode_utf16le(s) {
        return encode_utf16(s, true);
      }
      function encode_utf16be(s) {
        return encode_utf16(s, false);
      }
      function encode_utf16(s, le) {
        var a = new Uint8Array(s.length * 2),
          view = new DataView(a.buffer);
        s.split('').forEach(function (c, i) {
          view.setUint16(i * 2, c.charCodeAt(0), le);
        });
        return a;
      }

      var MIN_CODEPOINT = 0;
      var MAX_CODEPOINT = 0x10ffff;
      var BLOCK_SIZE = 0x1000;
      var SKIP_SIZE = 31;

      var TD_U16LE = new TextDecoder('UTF-16LE');
      var TD_U16BE = new TextDecoder('UTF-16BE');

      var TE_U8 = new TextEncoder();
      var TD_U8 = new TextDecoder('UTF-8');

      for (var i = MIN_CODEPOINT; i < MAX_CODEPOINT; i += BLOCK_SIZE) {
        var block_tag = cpname(i) + ' - ' + cpname(i + BLOCK_SIZE - 1);
        var block = genblock(i, BLOCK_SIZE, SKIP_SIZE);

        // test UTF-16LE, UTF-16BE, and UTF-8 encodings against themselves
        var encoded = encode_utf16le(block);
        var decoded = TD_U16LE.decode(encoded);
        assert_string_equals(block, decoded, 'UTF-16LE round trip ' + block_tag);

        encoded = encode_utf16be(block);
        decoded = TD_U16BE.decode(encoded);
        assert_string_equals(block, decoded, 'UTF-16BE round trip ' + block_tag);

        encoded = TE_U8.encode(block);
        decoded = TD_U8.decode(encoded);
        assert_string_equals(block, decoded, 'UTF-8 round trip ' + block_tag);

        // test TextEncoder(UTF-8) against the older idiom
        var exp_encoded = encode_utf8(block);

        expect(encoded.length).toBe(exp_encoded.length);
        // assert_array_equals(encoded, exp_encoded, 'UTF-8 reference encoding ' + block_tag);

        var exp_decoded = decode_utf8(exp_encoded);
        assert_string_equals(decoded, exp_decoded, 'UTF-8 reference decoding ' + block_tag);
      }
    });
  });
}
