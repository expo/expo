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
      `'E&x<p>o"@\n`
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

  it('writes the same resource object twice without adding extra escapes', async () => {
    const stringsPath = '/app/android/app/src/main/res/values/strings.xml';
    const stringsJSON = await readResourcesXMLAsync({ path: stringsPath });
    await writeXMLAsync({ path: stringsPath, xml: stringsJSON });
    const firstWrite = await fs.promises.readFile(stringsPath, 'utf-8');

    await writeXMLAsync({ path: stringsPath, xml: stringsJSON });
    expect(await fs.promises.readFile(stringsPath, 'utf-8')).toBe(firstWrite);
  });
});

describe(format, () => {
  it('leaves the resource object unchanged when escaping strings', () => {
    const xml = {
      resources: {
        string: [
          buildResourceItem({ name: 'app_name', value: `Expo's "test" C:\\Temp\n` }),
          buildResourceItem({ name: 'reference', value: '@string/app_name', translatable: false }),
        ],
      },
    };
    const original = structuredClone(xml);

    format(xml);

    expect(xml).toEqual(original);
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
    expect(escapeAndroidString('"E&x<p>o"@\n\r\t')).toBe(`\\"E&x<p>o\\"\\@\\n\\u000d\\t`);
    expect(escapeAndroidString('?attr/foo')).toBe('\\?attr/foo');
    expect(escapeAndroidString('C:\\Temp')).toBe('C:\\\\Temp');
  });
});

describe(unescapeAndroidString, () => {
  it(`can remove escape sequences from Android strings`, () => {
    expect(unescapeAndroidString(`test\\test`)).toBe('test\test');
    expect(unescapeAndroidString(`test\\'test`)).toBe("test'test");
    expect(unescapeAndroidString(`test\\\\'test`)).toBe("test\\'test");
  });
});

describe('Android whitespace decoding', () => {
  const cases = [
    ['escaped newline and tab', 'one\\ntwo\\tthree', 'one\ntwo\tthree'],
    ['Unicode escapes', 'caf\\u00e9\\u2026', 'café…'],
    ['quoted padding', '"  padded  "', '  padded  '],
    ['quoted repeated spaces', '"a  b"', 'a  b'],
    ['quoted tabs and newlines', '"a\t\nb"', 'a\t\nb'],
    ['Unicode carriage return', 'a\\u000db', 'a\rb'],
    ['Unicode form feed', 'a\\u000cb', 'a\fb'],
    ['Unicode null', 'a\\u0000b', 'a\0b'],
    ['unquoted spaces', 'a  b', 'a b'],
    ['unquoted padding', '  a  ', 'a'],
    ['only whitespace', ' \t\n ', ''],
    ['literal tabs and newlines', 'a\t\nb', 'a b'],
    ['mixed quoted regions', 'a  "b  c"  d', 'a b  c d'],
    ['padding outside quotes', '  " a "  ', ' a '],
    ['empty quoted region', 'a  ""  b', 'a  b'],
    ['escaped quote does not open a region', 'a\\"  b', 'a" b'],
    ['escaped backslash before whitespace', 'a\\\\  b', 'a\\ b'],
    ['escaped space next to literal spaces', 'a  \\u0020  b', 'a   b'],
    ['escaped newline next to literal spaces', 'a  \\n  b', 'a \n b'],
    ['escaped literal newline', 'a\\\nb', 'a\nb'],
    ['trailing backslash', 'a\\', 'a'],
  ];

  it.each(cases)('decodes %s', (_name, source, expected) => {
    expect(unescapeAndroidString(source)).toBe(expected);
  });

  it.each(cases.filter(([, , expected]) => expected !== ''))(
    'preserves %s through XML read/write cycles',
    async (_name, source, expected) => {
      const stringsPath = '/app/android/app/src/main/res/values/strings.xml';
      vol.fromJSON({
        [stringsPath]: `<resources><string name="example">${source}</string></resources>`,
      });
      try {
        for (let cycle = 0; cycle < 3; cycle++) {
          const xml = await readResourcesXMLAsync({ path: stringsPath });
          expect(xml.resources.string![0]!._).toBe(expected);
          await writeXMLAsync({ path: stringsPath, xml });
        }
      } finally {
        vol.reset();
      }
    }
  );

  it('writes carriage returns as Unicode escapes', () => {
    expect(escapeAndroidString('a\rb')).toBe('a\\u000db');
  });
});
