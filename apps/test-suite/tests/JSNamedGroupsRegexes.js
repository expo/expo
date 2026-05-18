/* eslint-disable */
'use strict';

// Comprehensive runtime compliance tests for named capturing groups in regexes.
// Validates that (?<name>...) syntax works correctly at runtime in the Hermes engine.
// Cases sourced from @babel/plugin-transform-named-capturing-groups-regex
// and supplemented with edge cases.

export const name = 'JS Named Groups Regexes';

export function test({ describe, it, xit, expect }) {
  describe('JS Named Groups Regexes', () => {
    describe('basic named groups', () => {
      it('exec() returns groups object', () => {
        const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
        const match = re.exec('2025-05-01');
        expect(match).not.toBe(null);
        expect(match.groups.year).toBe('2025');
        expect(match.groups.month).toBe('05');
        expect(match.groups.day).toBe('01');
      });

      it('match() returns groups object', () => {
        const re = /(?<greeting>hello) (?<target>world)/;
        const match = 'hello world'.match(re);
        expect(match.groups.greeting).toBe('hello');
        expect(match.groups.target).toBe('world');
      });

      it('single named group', () => {
        const re = /(?<name>\w+)/;
        const match = re.exec('foobar');
        expect(match.groups.name).toBe('foobar');
      });

      it('named group with no match returns null', () => {
        const re = /(?<year>\d{4})/;
        const match = re.exec('no digits here');
        expect(match).toBe(null);
      });

      it('groups is a null-prototype object', () => {
        const re = /(?<a>x)/;
        const match = re.exec('x');
        expect(match.groups.a).toBe('x');
        // groups should not inherit from Object.prototype
        expect(match.groups.hasOwnProperty).toBe(undefined);
      });

      it('numbered capture still works alongside named', () => {
        const re = /(?<first>\w+) (\w+)/;
        const match = re.exec('hello world');
        expect(match[1]).toBe('hello');
        expect(match[2]).toBe('world');
        expect(match.groups.first).toBe('hello');
      });
    });

    describe('multiple named groups', () => {
      it('three groups', () => {
        const re = /(?<r>\d+)\.(?<g>\d+)\.(?<b>\d+)/;
        const match = re.exec('255.128.0');
        expect(match.groups.r).toBe('255');
        expect(match.groups.g).toBe('128');
        expect(match.groups.b).toBe('0');
      });

      it('groups with different character classes', () => {
        const re = /(?<letters>[a-z]+)(?<digits>\d+)(?<rest>.*)/;
        const match = re.exec('abc123!@#');
        expect(match.groups.letters).toBe('abc');
        expect(match.groups.digits).toBe('123');
        expect(match.groups.rest).toBe('!@#');
      });

      it('five groups', () => {
        const re = /(?<proto>\w+):\/\/(?<host>[^/:]+)(?::(?<port>\d+))?(?<path>\/[^?]*)?(?:\?(?<query>.*))?/;
        const match = re.exec('https://example.com:8080/path?q=1');
        expect(match.groups.proto).toBe('https');
        expect(match.groups.host).toBe('example.com');
        expect(match.groups.port).toBe('8080');
        expect(match.groups.path).toBe('/path');
        expect(match.groups.query).toBe('q=1');
      });
    });

    describe('backreferences', () => {
      it('\\k<name> matches same text as named group', () => {
        const re = /(?<quote>['"]).*?\k<quote>/;
        expect(re.test("'hello'")).toBe(true);
        expect(re.test('"hello"')).toBe(true);
        expect(re.test("'hello\"")).toBe(false);
      });

      it('\\k<name> with exec', () => {
        const re = /^(?<tag>\w+).*\k<tag>$/;
        const match = re.exec('div content div');
        expect(match).not.toBe(null);
        expect(match.groups.tag).toBe('div');
      });

      it('\\k<name> fails when group content differs', () => {
        const re = /^(?<word>\w+) \k<word>$/;
        expect(re.test('abc abc')).toBe(true);
        expect(re.test('abc def')).toBe(false);
      });

      it('multiple backreferences', () => {
        const re = /(?<a>\w)(?<b>\w) \k<a>\k<b>/;
        const match = re.exec('ab ab');
        expect(match).not.toBe(null);
        expect(match.groups.a).toBe('a');
        expect(match.groups.b).toBe('b');
      });
    });

    describe('string replace with named groups', () => {
      it('$<name> in replacement string', () => {
        const re = /(?<first>\w+) (?<second>\w+)/;
        const result = 'hello world'.replace(re, '$<second> $<first>');
        expect(result).toBe('world hello');
      });

      it('$<name> with date reformatting', () => {
        const re = /(?<month>\d{2})\/(?<day>\d{2})\/(?<year>\d{4})/;
        const result = '05/01/2025'.replace(re, '$<year>-$<month>-$<day>');
        expect(result).toBe('2025-05-01');
      });

      it('$<name> with global flag replaces all', () => {
        const re = /(?<vowel>[aeiou])/g;
        const result = 'hello'.replace(re, '[$<vowel>]');
        expect(result).toBe('h[e]ll[o]');
      });

      it('$<nonexistent> produces empty string', () => {
        const re = /(?<a>x)/;
        const result = 'x'.replace(re, '$<a>$<b>');
        // $<b> doesn't match a named group, should produce empty string
        expect(result).toBe('x');
      });

      it('replace function receives groups as last argument', () => {
        const re = /(?<first>\w+) (?<second>\w+)/;
        let capturedGroups = null;
        'hello world'.replace(re, function () {
          capturedGroups = arguments[arguments.length - 1];
        });
        expect(capturedGroups).not.toBe(null);
        expect(capturedGroups.first).toBe('hello');
        expect(capturedGroups.second).toBe('world');
      });

      it('replace function return value is used', () => {
        const re = /(?<n>\d+)/g;
        const result = 'a1b2c3'.replace(re, function (match, n, offset, str, groups) {
          return String(Number(groups.n) * 2);
        });
        expect(result).toBe('a2b4c6');
      });

      it('numbered references $1 $2 still work', () => {
        const re = /(?<a>\w+) (?<b>\w+)/;
        const result = 'hello world'.replace(re, '$2 $1');
        expect(result).toBe('world hello');
      });
    });

    describe('test() method', () => {
      it('test() works with named groups', () => {
        const re = /(?<year>\d{4})/;
        expect(re.test('2025')).toBe(true);
        expect(re.test('nope')).toBe(false);
      });

      it('test() with backreference', () => {
        const re = /(?<char>.)\k<char>/;
        expect(re.test('aa')).toBe(true);
        expect(re.test('ab')).toBe(false);
      });

      it('test() with global flag advances lastIndex', () => {
        const re = /(?<d>\d)/g;
        const str = 'a1b2c3';
        expect(re.test(str)).toBe(true);
        expect(re.lastIndex).toBe(2);
        expect(re.test(str)).toBe(true);
        expect(re.lastIndex).toBe(4);
      });
    });

    describe('flags', () => {
      it('case-insensitive flag', () => {
        const re = /(?<word>[a-z]+)/i;
        const match = re.exec('HELLO');
        expect(match.groups.word).toBe('HELLO');
      });

      it('global flag with exec iteration', () => {
        const re = /(?<num>\d+)/g;
        const str = 'a1b22c333';
        const results = [];
        let m;
        while ((m = re.exec(str)) !== null) {
          results.push(m.groups.num);
        }
        expect(results).toEqual(['1', '22', '333']);
      });

      it('multiline flag', () => {
        const re = /^(?<first>\w+)/gm;
        const str = 'hello\nworld\nfoo';
        const results = [];
        let m;
        while ((m = re.exec(str)) !== null) {
          results.push(m.groups.first);
        }
        expect(results).toEqual(['hello', 'world', 'foo']);
      });

      it('dotAll flag', () => {
        const re = /(?<all>.*)/s;
        const match = re.exec('line1\nline2');
        expect(match.groups.all).toBe('line1\nline2');
      });

      it('unicode flag', () => {
        const re = /(?<emoji>.)/u;
        const match = re.exec('\u{1F600}');
        expect(match.groups.emoji).toBe('\u{1F600}');
      });

      it('sticky flag', () => {
        const re = /(?<ch>\w)/y;
        re.lastIndex = 2;
        const match = re.exec('abcdef');
        expect(match.groups.ch).toBe('c');
      });
    });

    describe('matchAll', () => {
      // TODO(@kitten): _wrapRegExp helper does not override [Symbol.matchAll].
      // matchAll creates a regex copy via `new this.constructor(R, flags)` which
      // drops the group mapping (3rd arg), so buildGroups() fails on the copy.
      xit('matchAll returns groups on each match', () => {
        const re = /(?<n>\d+)/g;
        const matches = [...'a1b22c333'.matchAll(re)];
        expect(matches.length).toBe(3);
        expect(matches[0].groups.n).toBe('1');
        expect(matches[1].groups.n).toBe('22');
        expect(matches[2].groups.n).toBe('333');
      });

      // TODO(@kitten): Same _wrapRegExp matchAll limitation as above.
      xit('matchAll with multiple named groups', () => {
        const re = /(?<key>\w+)=(?<val>\w+)/g;
        const matches = [...'a=1&b=2&c=3'.matchAll(re)];
        expect(matches.length).toBe(3);
        expect(matches[0].groups.key).toBe('a');
        expect(matches[0].groups.val).toBe('1');
        expect(matches[2].groups.key).toBe('c');
        expect(matches[2].groups.val).toBe('3');
      });
    });

    describe('optional and alternation groups', () => {
      it('optional named group returns undefined when unmatched', () => {
        const re = /(?<required>\w+)(?:\.(?<ext>\w+))?/;
        const match = re.exec('readme');
        expect(match.groups.required).toBe('readme');
        expect(match.groups.ext).toBe(undefined);
      });

      it('optional named group returns value when matched', () => {
        const re = /(?<required>\w+)(?:\.(?<ext>\w+))?/;
        const match = re.exec('readme.md');
        expect(match.groups.required).toBe('readme');
        expect(match.groups.ext).toBe('md');
      });

      it('alternation with named groups', () => {
        const re = /(?<hex>#[0-9a-f]{6})|(?<rgb>rgb\(\d+,\s*\d+,\s*\d+\))/i;
        const hexMatch = re.exec('#ff0000');
        expect(hexMatch.groups.hex).toBe('#ff0000');
        expect(hexMatch.groups.rgb).toBe(undefined);

        const rgbMatch = re.exec('rgb(255, 0, 0)');
        expect(rgbMatch.groups.rgb).toBe('rgb(255, 0, 0)');
        expect(rgbMatch.groups.hex).toBe(undefined);
      });

      it('named group in one branch of alternation', () => {
        const re = /(?:(?<a>foo)|bar)/;
        const m1 = re.exec('foo');
        expect(m1.groups.a).toBe('foo');
        const m2 = re.exec('bar');
        expect(m2.groups.a).toBe(undefined);
      });
    });

    describe('mixed named and unnamed groups', () => {
      it('unnamed groups do not appear in groups object', () => {
        const re = /(\d+)-(?<named>\w+)/;
        const match = re.exec('123-abc');
        expect(match[1]).toBe('123');
        expect(match[2]).toBe('abc');
        expect(match.groups.named).toBe('abc');
        expect(Object.keys(match.groups).length).toBe(1);
      });

      it('non-capturing groups are transparent', () => {
        const re = /(?:prefix_)(?<value>\w+)/;
        const match = re.exec('prefix_hello');
        expect(match.groups.value).toBe('hello');
        expect(match[1]).toBe('hello');
      });

      it('nested named group inside unnamed group', () => {
        const re = /((?<inner>\d+))/;
        const match = re.exec('42');
        expect(match[1]).toBe('42');
        expect(match.groups.inner).toBe('42');
      });
    });

    describe('string search and split', () => {
      it('search() works with named groups', () => {
        const re = /(?<word>\bhello\b)/;
        const idx = 'say hello there'.search(re);
        expect(idx).toBe(4);
      });

      it('split() with named capturing group retains captures', () => {
        const re = /(?<sep>[,;])/;
        const parts = 'a,b;c'.split(re);
        // split includes capturing group matches
        expect(parts).toEqual(['a', ',', 'b', ';', 'c']);
      });
    });

    describe('destructuring groups', () => {
      it('destructure groups from exec result', () => {
        const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
        const { groups: { year, month, day } } = re.exec('2025-05-01');
        expect(year).toBe('2025');
        expect(month).toBe('05');
        expect(day).toBe('01');
      });

      it('destructure with default for optional group', () => {
        const re = /(?<host>[^:]+)(?::(?<port>\d+))?/;
        const { groups: { host, port = '80' } } = re.exec('example.com');
        expect(host).toBe('example.com');
        expect(port).toBe('80');
      });
    });

    describe('edge cases', () => {
      it('empty string match', () => {
        const re = /(?<empty>)/;
        const match = re.exec('anything');
        expect(match.groups.empty).toBe('');
      });

      it('group name with underscores and digits', () => {
        const re = /(?<my_group_1>\w+)/;
        const match = re.exec('hello');
        expect(match.groups.my_group_1).toBe('hello');
      });

      it('group name with dollar sign', () => {
        const re = /(?<$val>\d+)/;
        const match = re.exec('42');
        expect(match.groups.$val).toBe('42');
      });

      it('very long match in named group', () => {
        const long = 'a'.repeat(10000);
        const re = /(?<all>.+)/s;
        const match = re.exec(long);
        expect(match.groups.all.length).toBe(10000);
      });

      it('named group with quantifier', () => {
        const re = /(?<digits>\d+)/;
        const match = re.exec('abc123def');
        expect(match.groups.digits).toBe('123');
      });

      it('named group captures last iteration of quantified group', () => {
        const re = /(?:(?<ch>\w))+/;
        const match = re.exec('abcd');
        // A repeated capturing group only keeps the last match
        expect(match.groups.ch).toBe('d');
      });

      it('lookahead does not interfere with named groups', () => {
        const re = /(?<word>\w+)(?=\s)/;
        const match = re.exec('hello world');
        expect(match.groups.word).toBe('hello');
        expect(match[0]).toBe('hello');
      });

      it('lookbehind does not interfere with named groups', () => {
        const re = /(?<=\s)(?<word>\w+)/;
        const match = re.exec('hello world');
        expect(match.groups.word).toBe('world');
      });

      it('regex constructed with new RegExp also supports named groups', () => {
        const re = new RegExp('(?<n>\\d+)');
        const match = re.exec('42');
        expect(match.groups.n).toBe('42');
      });

      // TODO(@kitten): _wrapRegExp [Symbol.replace] processes $<name> before
      // the native replace handles $$ escaping. It converts $$<val> → $$1, which
      // native replace then interprets as literal "$" + "1" → "$1".
      // Native named groups correctly treat $$ as literal $ first, leaving "<val>"
      // as literal text → "$<val>".
      xit('named group in replace with special characters in replacement', () => {
        const re = /(?<val>\d+)/;
        const result = '42'.replace(re, '$$<val>');
        // $$ is a literal $, so result should be literal "$<val>"
        expect(result).toBe('$<val>');
      });

      it('incomplete $< in replacement is literal', () => {
        const re = /(?<a>x)/;
        // $< without closing > is treated as literal by the wrapRegExp helper
        const result = 'x'.replace(re, '$<a');
        expect(result).toBe('$<a');
      });
    });

    describe('practical patterns', () => {
      it('parse semver version string', () => {
        const re = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<pre>[a-z0-9.]+))?(?:\+(?<build>[a-z0-9.]+))?$/i;
        const m1 = re.exec('1.2.3');
        expect(m1.groups.major).toBe('1');
        expect(m1.groups.minor).toBe('2');
        expect(m1.groups.patch).toBe('3');
        expect(m1.groups.pre).toBe(undefined);

        const m2 = re.exec('1.0.0-beta.1+build.42');
        expect(m2.groups.pre).toBe('beta.1');
        expect(m2.groups.build).toBe('build.42');
      });

      it('parse email-like address', () => {
        const re = /(?<user>[^@]+)@(?<domain>[^.]+)\.(?<tld>\w+)/;
        const match = re.exec('user@example.com');
        expect(match.groups.user).toBe('user');
        expect(match.groups.domain).toBe('example');
        expect(match.groups.tld).toBe('com');
      });

      it('extract key-value pairs from query string', () => {
        const re = /(?<key>[^=&]+)=(?<value>[^&]*)/g;
        const str = 'foo=bar&baz=qux&n=42';
        const pairs = {};
        let m;
        while ((m = re.exec(str)) !== null) {
          pairs[m.groups.key] = m.groups.value;
        }
        expect(pairs).toEqual({ foo: 'bar', baz: 'qux', n: '42' });
      });

      it('reformat dates with replace', () => {
        const re = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g;
        const result = 'From 2025-05-01 to 2025-12-31'.replace(re, '$<d>/$<m>/$<y>');
        expect(result).toBe('From 01/05/2025 to 31/12/2025');
      });

      it('CSS hex color extraction', () => {
        const re = /#(?<r>[0-9a-f]{2})(?<g>[0-9a-f]{2})(?<b>[0-9a-f]{2})/i;
        const match = re.exec('#FF8800');
        expect(match.groups.r).toBe('FF');
        expect(match.groups.g).toBe('88');
        expect(match.groups.b).toBe('00');
      });

      it('log line parsing', () => {
        const re = /\[(?<level>\w+)\] (?<ts>\d{4}-\d{2}-\d{2}T[\d:]+) (?<msg>.*)/;
        const match = re.exec('[ERROR] 2025-05-01T12:00:00 Something failed');
        expect(match.groups.level).toBe('ERROR');
        expect(match.groups.ts).toBe('2025-05-01T12:00:00');
        expect(match.groups.msg).toBe('Something failed');
      });
    });
  });
}
