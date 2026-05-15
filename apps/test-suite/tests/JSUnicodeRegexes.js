/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for the Unicode flag (/u) in regexes.
// Validates that /u flag semantics work correctly at runtime in the Hermes engine.
//
// @babel/plugin-transform-unicode-regex rewrites /pattern/u regexes by:
// 1. Expanding astral plane characters (U+10000+) to surrogate pair sequences
// 2. Expanding \u{XXXXX} code point escapes to surrogate pairs or BMP chars
// 3. Making . match full code points (including astral) instead of code units
// 4. Expanding character classes to handle surrogate pairs correctly
// 5. Adjusting case-insensitive matching for Unicode case folding rules
// 6. Removing the /u flag after rewriting
//
// Cases sourced from regexpu-core transformations and @babel/plugin-transform-unicode-regex,
// supplemented with edge cases.

export const name = 'JS Unicode Regexes';

export function test({ describe, it, xit, expect }) {
  describe('JS Unicode Regexes', () => {
    describe('basic /u flag semantics', () => {
      it('/u flag regex matches ASCII text', () => {
        const re = /hello/u;
        expect(re.test('hello')).toBe(true);
        expect(re.test('world')).toBe(false);
      });

      it('/u flag regex works with exec()', () => {
        const re = /(\w+)/u;
        const match = re.exec('hello');
        expect(match[0]).toBe('hello');
        expect(match[1]).toBe('hello');
      });

      it('/u flag regex works with match()', () => {
        const match = 'hello world'.match(/(\w+)/u);
        expect(match[0]).toBe('hello');
        expect(match[1]).toBe('hello');
      });

      it('/u flag regex works with global search', () => {
        const re = /\w+/gu;
        const matches = 'hello world'.match(re);
        expect(matches.length).toBe(2);
        expect(matches[0]).toBe('hello');
        expect(matches[1]).toBe('world');
      });

      it('/u flag regex works with test()', () => {
        expect(/^\d+$/u.test('12345')).toBe(true);
        expect(/^\d+$/u.test('123a5')).toBe(false);
      });

      it('/u flag regex preserves lastIndex with global flag', () => {
        const re = /\d+/gu;
        const str = 'a1b22c333';
        expect(re.test(str)).toBe(true);
        expect(re.lastIndex).toBe(2);
        expect(re.test(str)).toBe(true);
        expect(re.lastIndex).toBe(5);
      });
    });

    describe('Unicode code point escapes (\\u{XXXXX})', () => {
      it('\\u{} matches BMP character', () => {
        const re = /\u{0041}/u;
        expect(re.test('A')).toBe(true);
        expect(re.test('B')).toBe(false);
      });

      it('\\u{} matches multi-digit BMP code point', () => {
        const re = /\u{00E9}/u;
        expect(re.test('\u00E9')).toBe(true); // é
        expect(re.test('e')).toBe(false);
      });

      it('\\u{} matches astral plane character', () => {
        const re = /\u{1F600}/u;
        expect(re.test('\u{1F600}')).toBe(true); // 😀
        expect(re.test('A')).toBe(false);
      });

      it('\\u{} matches musical symbol (astral plane)', () => {
        // U+1D306 = TETRAGRAM FOR CENTRE (𝌆)
        const re = /\u{1D306}/u;
        expect(re.test('\u{1D306}')).toBe(true);
        expect(re.test('A')).toBe(false);
      });

      it('\\u{} in character class', () => {
        const re = /[\u{1F600}\u{1F601}\u{1F602}]/u;
        expect(re.test('\u{1F600}')).toBe(true); // 😀
        expect(re.test('\u{1F601}')).toBe(true); // 😁
        expect(re.test('\u{1F602}')).toBe(true); // 😂
        expect(re.test('\u{1F603}')).toBe(false);
      });

      it('\\u{} range in character class', () => {
        const re = /[\u{1F600}-\u{1F602}]/u;
        expect(re.test('\u{1F600}')).toBe(true);
        expect(re.test('\u{1F601}')).toBe(true);
        expect(re.test('\u{1F602}')).toBe(true);
        expect(re.test('\u{1F603}')).toBe(false);
        expect(re.test('\u{1F5FF}')).toBe(false);
      });

      it('\\u{} with zero-padded code point', () => {
        const re = /\u{00000041}/u;
        expect(re.test('A')).toBe(true);
      });

      it('\\u{} maximum valid code point', () => {
        const re = /\u{10FFFF}/u;
        expect(re.test('\u{10FFFF}')).toBe(true);
      });
    });

    describe('astral plane character matching', () => {
      it('astral character literal in pattern', () => {
        const re = /𝌆/u;
        expect(re.test('𝌆')).toBe(true);
        expect(re.test('A')).toBe(false);
      });

      it('emoji literal in pattern', () => {
        const re = /😀/u;
        expect(re.test('😀')).toBe(true);
        expect(re.test('😁')).toBe(false);
      });

      it('astral character is one code point, not two code units', () => {
        // Without /u, emoji is two code units (surrogate pair) and . matches one unit
        // With /u, emoji is one code point and . matches the full character
        const re = /^.$/u;
        expect(re.test('😀')).toBe(true);
        expect(re.test('A')).toBe(true);
      });

      it('without /u, astral character is two code units', () => {
        // Without /u, . matches one code unit, so emoji (2 units) needs ..
        const re = /^.$/;
        expect(re.test('😀')).toBe(false); // Two code units, . only matches one
        const re2 = /^..$/;
        expect(re2.test('😀')).toBe(true); // Two code units matched by two dots
      });

      it('string of astral characters matches with /u', () => {
        const re = /^.{3}$/u;
        expect(re.test('😀😁😂')).toBe(true);
      });

      it('astral characters in character class range', () => {
        // U+1D306 to U+1D308
        const re = /[\u{1D306}-\u{1D308}]/u;
        expect(re.test('\u{1D306}')).toBe(true);
        expect(re.test('\u{1D307}')).toBe(true);
        expect(re.test('\u{1D308}')).toBe(true);
        expect(re.test('\u{1D305}')).toBe(false);
        expect(re.test('\u{1D309}')).toBe(false);
      });

      it('mixed BMP and astral in character class', () => {
        const re = /[a-z\u{1F600}-\u{1F602}]/u;
        expect(re.test('a')).toBe(true);
        expect(re.test('z')).toBe(true);
        expect(re.test('😀')).toBe(true);
        expect(re.test('😂')).toBe(true);
        expect(re.test('1')).toBe(false);
      });

      it('exec returns full code point, not surrogate halves', () => {
        const re = /(.)/u;
        const match = re.exec('😀');
        expect(match[0]).toBe('😀');
        expect(match[1]).toBe('😀');
        expect(match[0].length).toBe(2); // Still 2 UTF-16 code units
      });

      it('quantifier applies to full code point', () => {
        const re = /^(.)\1$/u;
        expect(re.test('😀😀')).toBe(true);
        expect(re.test('😀😁')).toBe(false);
      });
    });

    describe('dot matching with /u', () => {
      it('dot matches BMP character with /u', () => {
        const re = /^.$/u;
        expect(re.test('A')).toBe(true);
        expect(re.test('\u00E9')).toBe(true); // é
        expect(re.test('\u4E16')).toBe(true); // 世
      });

      it('dot matches astral plane character with /u', () => {
        const re = /^.$/u;
        expect(re.test('😀')).toBe(true);
        expect(re.test('𝌆')).toBe(true);
        expect(re.test('\u{1F4A9}')).toBe(true); // 💩
      });

      it('dot does not match newline with /u', () => {
        const re = /^.$/u;
        expect(re.test('\n')).toBe(false);
        expect(re.test('\r')).toBe(false);
        expect(re.test('\u2028')).toBe(false); // Line separator
        expect(re.test('\u2029')).toBe(false); // Paragraph separator
      });

      it('dot matches newline with /su', () => {
        const re = /^.$/su;
        expect(re.test('\n')).toBe(true);
        expect(re.test('\r')).toBe(true);
        expect(re.test('\u2028')).toBe(true);
        expect(re.test('\u2029')).toBe(true);
      });

      it('dot with /su matches astral characters', () => {
        const re = /^.$/su;
        expect(re.test('😀')).toBe(true);
        expect(re.test('A')).toBe(true);
      });

      it('multiple dots match multiple code points', () => {
        const re = /^..$/u;
        expect(re.test('AB')).toBe(true);
        expect(re.test('😀😁')).toBe(true);
        expect(re.test('A😀')).toBe(true);
        expect(re.test('ABC')).toBe(false);
      });

      it('dot with quantifier counts code points', () => {
        const re = /^.{2}$/u;
        expect(re.test('AB')).toBe(true);
        expect(re.test('😀😁')).toBe(true);
        expect(re.test('😀')).toBe(false);
      });
    });

    describe('character class escapes with /u', () => {
      it('\\d matches digits with /u', () => {
        const re = /^\d+$/u;
        expect(re.test('12345')).toBe(true);
        expect(re.test('abc')).toBe(false);
      });

      it('\\D matches non-digits including astral with /u', () => {
        const re = /^\D$/u;
        expect(re.test('A')).toBe(true);
        expect(re.test('😀')).toBe(true);
        expect(re.test('5')).toBe(false);
      });

      it('\\w matches word characters with /u', () => {
        const re = /^\w+$/u;
        expect(re.test('hello_123')).toBe(true);
        expect(re.test('hello world')).toBe(false);
      });

      it('\\W matches non-word characters including astral with /u', () => {
        const re = /^\W$/u;
        expect(re.test('!')).toBe(true);
        expect(re.test('😀')).toBe(true);
        expect(re.test('a')).toBe(false);
      });

      it('\\s matches whitespace with /u', () => {
        const re = /^\s+$/u;
        expect(re.test(' \t\n')).toBe(true);
        expect(re.test('\u00A0')).toBe(true); // non-breaking space
        expect(re.test('a')).toBe(false);
      });

      it('\\S matches non-whitespace including astral with /u', () => {
        const re = /^\S$/u;
        expect(re.test('A')).toBe(true);
        expect(re.test('😀')).toBe(true);
        expect(re.test(' ')).toBe(false);
      });

      it('\\b word boundary works with /u', () => {
        const re = /\bhello\b/u;
        expect(re.test('hello world')).toBe(true);
        expect(re.test('helloworld')).toBe(false);
      });
    });

    describe('negated character classes with /u', () => {
      it('negated class [^...] with BMP characters', () => {
        const re = /^[^abc]$/u;
        expect(re.test('d')).toBe(true);
        expect(re.test('a')).toBe(false);
      });

      it('negated class matches astral characters', () => {
        const re = /^[^abc]$/u;
        expect(re.test('😀')).toBe(true);
      });

      it('negated class with astral character', () => {
        const re = /^[^\u{1F600}]$/u;
        expect(re.test('A')).toBe(true);
        expect(re.test('😁')).toBe(true);
        expect(re.test('😀')).toBe(false);
      });

      it('negated class excludes full code point', () => {
        // Without /u, [^\u{1F600}] would exclude the individual surrogate halves
        // With /u, it excludes the whole code point
        const re = /^[^\u{1F600}]+$/u;
        expect(re.test('hello')).toBe(true);
        expect(re.test('😁😂')).toBe(true);
        expect(re.test('😀')).toBe(false);
      });
    });

    describe('case-insensitive with /u (ui flags)', () => {
      it('basic ASCII case insensitive', () => {
        const re = /^[a-z]+$/ui;
        expect(re.test('hello')).toBe(true);
        expect(re.test('HELLO')).toBe(true);
        expect(re.test('Hello')).toBe(true);
      });

      it('Unicode case equivalence: K (U+212A) matches k', () => {
        // U+212A is KELVIN SIGN, which case-folds to 'k'
        const re = /k/ui;
        expect(re.test('k')).toBe(true);
        expect(re.test('K')).toBe(true);
        expect(re.test('\u212A')).toBe(true); // Kelvin sign
      });

      it('Unicode case equivalence: long s (U+017F) matches s', () => {
        // U+017F is LATIN SMALL LETTER LONG S, which case-folds to 's'
        const re = /s/ui;
        expect(re.test('s')).toBe(true);
        expect(re.test('S')).toBe(true);
        expect(re.test('\u017F')).toBe(true); // ſ (long s)
      });

      it('case insensitive match for accented characters', () => {
        const re = /é/ui;
        expect(re.test('\u00E9')).toBe(true); // é
        expect(re.test('\u00C9')).toBe(true); // É
      });

      it('case insensitive with character class range', () => {
        const re = /^[a-z]$/ui;
        expect(re.test('A')).toBe(true);
        expect(re.test('z')).toBe(true);
        expect(re.test('Z')).toBe(true);
        // Long s and Kelvin sign are case equivalents of s and k
        expect(re.test('\u017F')).toBe(true); // ſ
        expect(re.test('\u212A')).toBe(true); // K (Kelvin)
      });

      it('case insensitive with astral characters', () => {
        // Most astral characters don't have case variants
        // But the flag combination should still work
        const re = /\u{1F600}/ui;
        expect(re.test('\u{1F600}')).toBe(true);
      });

      it('Greek case insensitive', () => {
        const re = /α/ui;
        expect(re.test('α')).toBe(true); // lowercase alpha
        expect(re.test('Α')).toBe(true); // uppercase Alpha
      });

      it('Cyrillic case insensitive', () => {
        const re = /б/ui;
        expect(re.test('б')).toBe(true); // lowercase
        expect(re.test('Б')).toBe(true); // uppercase
      });
    });

    describe('surrogate pair handling', () => {
      it('/u treats surrogate pair as single code point', () => {
        // 😀 is U+1F600, stored as surrogate pair \uD83D\uDE00
        const str = '\uD83D\uDE00';
        const re = /^.$/u;
        expect(re.test(str)).toBe(true); // One code point
      });

      it('without /u, surrogate pair is two code units', () => {
        const str = '\uD83D\uDE00';
        const re = /^..$/;
        expect(re.test(str)).toBe(true); // Two code units
      });

      it('lone high surrogate does not match . with /u', () => {
        // A lone high surrogate is not a valid code point sequence
        const re = /^.$/u;
        expect(re.test('\uD83D')).toBe(true);
      });

      it('astral range boundary correctness', () => {
        // U+10000 is the first astral code point
        const re = /\u{10000}/u;
        expect(re.test('\u{10000}')).toBe(true);
        expect(re.test('\uFFFF')).toBe(false);
      });

      it('consecutive astral characters', () => {
        const re = /^(.)(.)$/u;
        const match = re.exec('😀😁');
        expect(match[1]).toBe('😀');
        expect(match[2]).toBe('😁');
      });
    });

    describe('quantifiers with /u', () => {
      it('+ quantifier applies to full code point', () => {
        const re = /^a+$/u;
        expect(re.test('aaa')).toBe(true);
        expect(re.test('')).toBe(false);
      });

      it('* quantifier with astral characters', () => {
        const re = /^😀*$/u;
        expect(re.test('')).toBe(true);
        expect(re.test('😀')).toBe(true);
        expect(re.test('😀😀😀')).toBe(true);
        expect(re.test('😀a')).toBe(false);
      });

      it('{n} quantifier counts code points', () => {
        const re = /^.{3}$/u;
        expect(re.test('abc')).toBe(true);
        expect(re.test('😀😁😂')).toBe(true);
        expect(re.test('a😀b')).toBe(true);
        expect(re.test('abcd')).toBe(false);
      });

      it('{n,m} range quantifier with code points', () => {
        const re = /^.{2,4}$/u;
        expect(re.test('ab')).toBe(true);
        expect(re.test('😀😁')).toBe(true);
        expect(re.test('😀😁😂😃')).toBe(true);
        expect(re.test('a')).toBe(false);
        expect(re.test('abcde')).toBe(false);
      });

      it('? quantifier on astral character', () => {
        const re = /^a😀?b$/u;
        expect(re.test('ab')).toBe(true);
        expect(re.test('a😀b')).toBe(true);
        expect(re.test('a😀😀b')).toBe(false);
      });
    });

    describe('capturing groups with /u', () => {
      it('capturing group captures full code point', () => {
        const re = /^(.)$/u;
        const match = re.exec('😀');
        expect(match[1]).toBe('😀');
      });

      it('multiple groups with astral characters', () => {
        const re = /^(.)(.)(.)$/u;
        const match = re.exec('a😀b');
        expect(match[1]).toBe('a');
        expect(match[2]).toBe('😀');
        expect(match[3]).toBe('b');
      });

      it('backreference matches same code point', () => {
        const re = /^(.)\1$/u;
        expect(re.test('aa')).toBe(true);
        expect(re.test('😀😀')).toBe(true);
        expect(re.test('😀😁')).toBe(false);
      });

      it('named group with /u', () => {
        const re = /(?<emoji>.)/u;
        const match = re.exec('😀');
        expect(match.groups.emoji).toBe('😀');
      });

      it('non-capturing group with /u', () => {
        const re = /^(?:.)$/u;
        expect(re.test('😀')).toBe(true);
        expect(re.test('A')).toBe(true);
      });
    });

    describe('anchors and boundaries with /u', () => {
      it('^ and $ work with astral characters', () => {
        const re = /^😀$/u;
        expect(re.test('😀')).toBe(true);
        expect(re.test('😀😀')).toBe(false);
      });

      it('multiline anchors with /u', () => {
        const re = /^.$/gmu;
        const matches = 'a\n😀\nb'.match(re);
        expect(matches.length).toBe(3);
        expect(matches[0]).toBe('a');
        expect(matches[1]).toBe('😀');
        expect(matches[2]).toBe('b');
      });

      it('\\b boundary with /u before astral character', () => {
        const re = /\bword/u;
        expect(re.test('word')).toBe(true);
        expect(re.test('a word')).toBe(true);
      });
    });

    describe('alternation with /u', () => {
      it('alternation between BMP and astral', () => {
        const re = /^(?:A|😀)$/u;
        expect(re.test('A')).toBe(true);
        expect(re.test('😀')).toBe(true);
        expect(re.test('B')).toBe(false);
      });

      it('alternation between astral characters', () => {
        const re = /^(?:😀|😁|😂)$/u;
        expect(re.test('😀')).toBe(true);
        expect(re.test('😁')).toBe(true);
        expect(re.test('😂')).toBe(true);
        expect(re.test('😃')).toBe(false);
      });
    });

    describe('lookahead and lookbehind with /u', () => {
      it('positive lookahead with astral', () => {
        const re = /A(?=😀)/u;
        expect(re.test('A😀')).toBe(true);
        expect(re.test('AB')).toBe(false);
      });

      it('negative lookahead with astral', () => {
        const re = /A(?!😀)/u;
        expect(re.test('AB')).toBe(true);
        expect(re.test('A😀')).toBe(false);
      });

      it('positive lookbehind with astral', () => {
        const re = /(?<=😀)B/u;
        expect(re.test('😀B')).toBe(true);
        expect(re.test('AB')).toBe(false);
      });

      it('negative lookbehind with astral', () => {
        const re = /(?<!😀)B/u;
        expect(re.test('AB')).toBe(true);
        expect(re.test('😀B')).toBe(false);
      });
    });

    describe('replace and split with /u', () => {
      it('replace astral character', () => {
        const result = '😀'.replace(/😀/u, 'smile');
        expect(result).toBe('smile');
      });

      it('global replace of astral characters', () => {
        const result = 'a😀b😀c'.replace(/😀/gu, 'X');
        expect(result).toBe('aXbXc');
      });

      it('replace with capture group on astral', () => {
        const result = 'a😀b'.replace(/(😀)/u, '[$1]');
        expect(result).toBe('a[😀]b');
      });

      it('split on astral character', () => {
        const parts = 'a😀b😀c'.split(/😀/u);
        expect(parts).toEqual(['a', 'b', 'c']);
      });

      it('replace dot-matched astral character', () => {
        const result = 'a😀b'.replace(/(.)/gu, '[$1]');
        expect(result).toBe('[a][😀][b]');
      });

      it('search for astral character', () => {
        const idx = 'hello😀world'.search(/😀/u);
        expect(idx).toBe(5);
      });
    });

    describe('combined flags', () => {
      it('/gu global unicode', () => {
        const re = /./gu;
        const matches = '😀😁😂'.match(re);
        expect(matches.length).toBe(3);
        expect(matches[0]).toBe('😀');
        expect(matches[1]).toBe('😁');
        expect(matches[2]).toBe('😂');
      });

      it('/giu global case-insensitive unicode', () => {
        const re = /[a-z]/giu;
        const matches = 'Hello'.match(re);
        expect(matches.length).toBe(5);
      });

      it('/mu multiline unicode', () => {
        const re = /^.$/mu;
        expect(re.test('😀')).toBe(true);
      });

      it('/siu dotAll case-insensitive unicode', () => {
        const re = /^.$/siu;
        expect(re.test('\n')).toBe(true);
        expect(re.test('😀')).toBe(true);
      });

      it('/yu sticky unicode', () => {
        const re = /./yu;
        re.lastIndex = 0;
        const match = re.exec('😀A');
        expect(match[0]).toBe('😀');
        expect(re.lastIndex).toBe(2); // 2 code units for the surrogate pair
      });
    });

    describe('escapes with /u', () => {
      it('\\t \\n \\r work with /u', () => {
        expect(/^\t$/u.test('\t')).toBe(true);
        expect(/^\n$/u.test('\n')).toBe(true);
        expect(/^\r$/u.test('\r')).toBe(true);
      });

      it('\\0 matches null character', () => {
        expect(/^\0$/u.test('\0')).toBe(true);
      });

      it('hex escape \\xNN works with /u', () => {
        expect(/^\x41$/u.test('A')).toBe(true);
        expect(/^\xFF$/u.test('\xFF')).toBe(true);
      });

      it('BMP unicode escape \\uNNNN works with /u', () => {
        expect(/^\u0041$/u.test('A')).toBe(true);
        expect(/^\u00E9$/u.test('é')).toBe(true);
      });

      it('escaped special characters with /u', () => {
        expect(/^\.$/u.test('.')).toBe(true);
        expect(/^\*$/u.test('*')).toBe(true);
        expect(/^\($/u.test('(')).toBe(true);
        expect(/^\)$/u.test(')')).toBe(true);
        expect(/^\[$/u.test('[')).toBe(true);
        expect(/^\]$/u.test(']')).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('empty regex with /u', () => {
        const re = /(?:)/u;
        expect(re.test('')).toBe(true);
        expect(re.test('a')).toBe(true);
      });

      it('empty character class complement matches astral', () => {
        // [^] without /u matches any character including newlines
        // With /u we use [\s\S] to match any character
        const re = /^[\s\S]$/u;
        expect(re.test('😀')).toBe(true);
        expect(re.test('\n')).toBe(true);
      });

      it('consecutive astral characters in class', () => {
        const re = /^[😀😁😂]+$/u;
        expect(re.test('😀😁😂😀')).toBe(true);
        expect(re.test('😃')).toBe(false);
      });

      it('astral character at string boundaries', () => {
        const re = /^😀/u;
        expect(re.test('😀hello')).toBe(true);
        const re2 = /😀$/u;
        expect(re2.test('hello😀')).toBe(true);
      });

      it('very long string with astral characters', () => {
        const str = '😀'.repeat(1000);
        const re = /^(😀)+$/u;
        expect(re.test(str)).toBe(true);
      });

      it('mixed BMP and astral string', () => {
        const re = /^[a-z😀]+$/u;
        expect(re.test('hello😀world')).toBe(true);
        expect(re.test('hello😀world!')).toBe(false);
      });

      it('new RegExp with /u flag', () => {
        const re = new RegExp('.', 'u');
        const match = re.exec('😀');
        expect(match[0]).toBe('😀');
      });

      it('new RegExp with \\u{} escape and /u flag', () => {
        const re = new RegExp('\\u{1F600}', 'u');
        expect(re.test('😀')).toBe(true);
      });

      it('lastIndex advances by code units, not code points', () => {
        const re = /./gu;
        const str = '😀a';
        const m1 = re.exec(str);
        expect(m1[0]).toBe('😀');
        expect(re.lastIndex).toBe(2); // 2 code units
        const m2 = re.exec(str);
        expect(m2[0]).toBe('a');
        expect(re.lastIndex).toBe(3); // 3 code units total
      });
    });

    describe('practical patterns', () => {
      it('match any emoji in range', () => {
        const re = /[\u{1F600}-\u{1F64F}]/u;
        expect(re.test('😀')).toBe(true); // U+1F600
        expect(re.test('🙏')).toBe(true); // U+1F64F
        expect(re.test('A')).toBe(false);
      });

      it('extract emoji from text', () => {
        const re = /[\u{1F600}-\u{1F64F}]/gu;
        const matches = 'Hello 😀 World 😂!'.match(re);
        expect(matches.length).toBe(2);
        expect(matches[0]).toBe('😀');
        expect(matches[1]).toBe('😂');
      });

      it('count code points in string', () => {
        const re = /./gsu;
        const str = 'a😀b😁c';
        const count = str.match(re).length;
        expect(count).toBe(5); // 5 code points
        expect(str.length).toBe(7); // 7 code units
      });

      it('validate hex color with /u', () => {
        const re = /^#[0-9a-f]{6}$/ui;
        expect(re.test('#FF8800')).toBe(true);
        expect(re.test('#ff8800')).toBe(true);
        expect(re.test('#GGGGGG')).toBe(false);
      });

      it('match CJK characters', () => {
        const re = /^[\u4E00-\u9FFF]+$/u;
        expect(re.test('你好世界')).toBe(true);
        expect(re.test('hello')).toBe(false);
      });

      it('match mathematical symbols (astral plane)', () => {
        // U+1D400-U+1D7FF: Mathematical Alphanumeric Symbols
        const re = /[\u{1D400}-\u{1D7FF}]/u;
        expect(re.test('\u{1D400}')).toBe(true); // 𝐀 (Math bold A)
        expect(re.test('\u{1D7FF}')).toBe(true); // 𝟿 (Math monospace 9)
        expect(re.test('A')).toBe(false);
      });

      it('split text preserving emoji', () => {
        const re = /\s+/u;
        const parts = 'hello 😀 world'.split(re);
        expect(parts).toEqual(['hello', '😀', 'world']);
      });

      it('replace each code point individually', () => {
        const result = 'a😀b'.replace(/./gu, (ch) => `[${ch}]`);
        expect(result).toBe('[a][😀][b]');
      });
    });
  });
}
