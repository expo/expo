import fs from 'fs';
import { vol } from 'memfs';

import { buildResourceItem, readResourcesXMLAsync } from '../../android/Resources';
import { setStringItem } from '../../android/Strings';
import { escapeAndroidString, format, unescapeAndroidString, writeXMLAsync } from '../XML';

jest.mock('fs');

export const sampleStringsXML = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<resources>
  <string name="app_name">exp\\'o &amp;bo&lt;y&gt;&apos;</string>
</resources>`;

describe(readResourcesXMLAsync, () => {
  beforeAll(async () => {
    const directoryJSON = {
      './android/app/src/main/res/values/strings.xml': sampleStringsXML,
    };
    vol.fromJSON(directoryJSON, '/app');
  });

  afterAll(async () => {
    vol.reset();
  });

  it(`can write the escaped name and then read it back in unescaped format`, async () => {
    const stringsPath = '/app/android/app/src/main/res/values/strings.xml';
    let stringsJSON = await readResourcesXMLAsync({ path: stringsPath });
    expect(stringsJSON.resources.string!.filter((e) => e.$.name === 'app_name')[0]!._).toBe(
      `exp'o &bo<y>'`
    );
    stringsJSON = setStringItem(
      [buildResourceItem({ name: 'app_name', value: `'E&x<p>o"@\n` })],
      stringsJSON
    );

    // Test that it's written in escaped form
    // expect(format(stringsJSON)).toBe(true);
    expect(format(stringsJSON).includes(`\\'E&amp;x&lt;p&gt;o\\"\\@\\n`)).toBe(true);

    // And parsed in unescaped form
    expect(stringsJSON.resources.string!.filter((e) => e.$.name === 'app_name')[0]!._).toBe(
      `\\'E&x<p>o\\"\\@\\n`
    );
  });
});

describe('read and write', () => {
  // reading removes
  // <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  const example = `<resources>
  <string name="app_name">exp\\'o</string>
</resources>`;
  beforeAll(async () => {
    const directoryJSON = {
      './android/app/src/main/res/values/strings.xml': example,
    };
    vol.fromJSON(directoryJSON, '/app');
  });

  afterAll(async () => {
    vol.reset();
  });

  it(`can write the escaped name and then read it back in unescaped format`, async () => {
    const stringsPath = '/app/android/app/src/main/res/values/strings.xml';
    const stringsJSON = await readResourcesXMLAsync({ path: stringsPath });
    await writeXMLAsync({ path: stringsPath, xml: stringsJSON });
    expect(await fs.promises.readFile(stringsPath, 'utf-8')).toBe(example);
  });
});

describe('read and write strings with escape sequences', () => {
  const example = `<resources>
  <string name="app_name">Expo</string>
  <string name="multiline">Line one\\nLine two</string>
  <string name="tabbed">Name:\\tValue</string>
  <string name="unicode">caf\\u00e9</string>
  <string name="padded">"  padded  "</string>
  <string name="spaced">"a  b"</string>
</resources>`;
  const stringsPath = '/app/android/app/src/main/res/values/strings.xml';

  beforeAll(async () => {
    vol.fromJSON({ './android/app/src/main/res/values/strings.xml': example }, '/app');
  });

  afterAll(async () => {
    vol.reset();
  });

  it(`reads escape sequences and quotes as the characters they stand for`, async () => {
    const stringsJSON = await readResourcesXMLAsync({ path: stringsPath });
    const values = Object.fromEntries(stringsJSON.resources.string!.map((e) => [e.$.name, e._]));
    expect(values).toEqual({
      app_name: 'Expo',
      multiline: 'Line one\nLine two',
      tabbed: 'Name:\tValue',
      unicode: 'caf\u00e9',
      padded: '  padded  ',
      spaced: 'a  b',
    });
  });

  it(`writes back strings it did not change unchanged`, async () => {
    let stringsJSON = await readResourcesXMLAsync({ path: stringsPath });
    stringsJSON = setStringItem(
      [buildResourceItem({ name: 'app_name', value: 'Expo' })],
      stringsJSON
    );
    await writeXMLAsync({ path: stringsPath, xml: stringsJSON });
    const written = await fs.promises.readFile(stringsPath, 'utf-8');
    expect(written).toContain('<string name="multiline">Line one\\nLine two</string>');
    expect(written).toContain('<string name="tabbed">Name:\\tValue</string>');
    expect(written).toContain('<string name="padded">"  padded  "</string>');
    expect(written).toContain('<string name="spaced">"a  b"</string>');
    // Reading the written file again gives the same values.
    const reread = await readResourcesXMLAsync({ path: stringsPath });
    expect(reread.resources.string!.find((e) => e.$.name === 'unicode')!._).toBe('caf\u00e9');
  });
});

describe('throws when invalid due to empty tags', () => {
  // reading removes
  // <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  const example = `<resources>
  <string name="app_name">exp\\'o</string>
  <string name="empty1" />
  <string name="empty2"></string>
</resources>`;
  beforeAll(async () => {
    const directoryJSON = {
      './android/app/src/main/res/values/strings.xml': example,
    };
    vol.fromJSON(directoryJSON, '/app');
  });

  afterAll(async () => {
    vol.reset();
  });

  it(`throws correct error`, async () => {
    const stringsPath = '/app/android/app/src/main/res/values/strings.xml';
    await expect(readResourcesXMLAsync({ path: stringsPath })).rejects.toThrow(
      'Empty string resource not supported'
    );
  });
});

describe(escapeAndroidString, () => {
  it(`can escape Android strings`, () => {
    expect(escapeAndroidString(`@`)).toBe(`\\@`);
    expect(escapeAndroidString(`'''`)).toBe(`\\'\\'\\'`);
    expect(escapeAndroidString('"E&x<p>o"@\n\r\t')).toBe(`\\"E&x<p>o\\"\\@\\n\\r\\t`);
    expect(escapeAndroidString('?attr/foo')).toBe('\\?attr/foo');
    expect(escapeAndroidString('C:\\Temp')).toBe('C:\\\\Temp');
    expect(escapeAndroidString(' padded')).toBe('" padded"');
    expect(escapeAndroidString('a  b')).toBe('"a  b"');
  });
});

describe(unescapeAndroidString, () => {
  it(`can remove escape sequences from Android strings`, () => {
    expect(unescapeAndroidString(`test\\test`)).toBe('test\test');
    expect(unescapeAndroidString(`a\\nb\\rc`)).toBe('a\nb\rc');
    expect(unescapeAndroidString(`\\u00e9\\u2026`)).toBe('\u00e9\u2026');
    expect(unescapeAndroidString(`"  quoted  "`)).toBe('  quoted  ');
    expect(unescapeAndroidString(`say \\"hi\\"`)).toBe('say "hi"');
    expect(unescapeAndroidString(`test\\'test`)).toBe("test'test");
    expect(unescapeAndroidString(`test\\\\'test`)).toBe("test\\'test");
  });
});
