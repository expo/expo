import assert from 'assert';

import plist from '../src';

describe('plist', function () {
  describe('build()', function () {
    it('should create a plist XML string from a String', function () {
      const xml = plist.build('test');
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <string>test</string>
</plist>`
      );
    });

    it('should create a plist XML integer from a whole Number', function () {
      const xml = plist.build(3);
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <integer>3</integer>
</plist>`
      );
    });

    it('should create a plist XML real from a fractional Number', function () {
      const xml = plist.build(Math.PI);
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <real>3.141592653589793</real>
</plist>`
      );
    });

    it('should create a plist XML date from a Date', function () {
      const xml = plist.build(new Date('2010-02-08T21:41:23Z'));
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <date>2010-02-08T21:41:23Z</date>
</plist>`
      );
    });

    it('should create a plist XML date from a Buffer', function () {
      const xml = plist.build(Buffer.from('☃'));
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <data>4piD</data>
</plist>`
      );
    });

    it('should create a plist XML true from a `true` Boolean', function () {
      const xml = plist.build(true);
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <true/>
</plist>`
      );
    });

    it('should create a plist XML false from a `false` Boolean', function () {
      const xml = plist.build(false);
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <false/>
</plist>`
      );
    });

    it('should create a plist XML dict from an Object', function () {
      const xml = plist.build({ foo: 'bar' });
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>foo</key>
    <string>bar</string>
  </dict>
</plist>`
      );
    });

    it('should create a plist XML array from an Array', function () {
      const xml = plist.build([1, 'foo', false, new Date(1234)]);
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <array>
    <integer>1</integer>
    <string>foo</string>
    <false/>
    <date>1970-01-01T00:00:01Z</date>
  </array>
</plist>`
      );
    });

    it('should properly encode an empty string', function () {
      const xml = plist.build({ a: '' });
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>a</key>
    <string/>
  </dict>
</plist>`
      );
    });

    it('should omit undefined values', function () {
      const xml = plist.build({ a: undefined });
      assert.strictEqual(
        xml,
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict/>
</plist>`
      );
    });
  });
});
