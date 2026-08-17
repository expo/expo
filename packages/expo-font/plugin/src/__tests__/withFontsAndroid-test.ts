import * as path from 'path';

import { toValidAndroidResourceName } from '../utils';
import type { FontObject } from '../withFonts';
import {
  groupByFamily,
  planFontCopies,
  getXmlSpecs,
  generateFontManagerCalls,
  assertNoConflictingDefinitions,
  assertAndroidCanLoadFonts,
} from '../withFontsAndroid';

const input = [
  {
    fontFamily: 'Source Serif 4',
    fontDefinitions: [
      { path: './assets/fonts/SourceSerif4-Regular.ttf', weight: 400, style: 'normal' },
      { path: './assets/fonts/SourceSerif4-Medium.ttf', weight: 500, style: 'normal' },
    ],
  },
  {
    fontFamily: 'SpaceMono',
    fontDefinitions: [
      { path: './assets/fonts/SpaceMono-Regular.ttf', weight: 400, style: 'normal' },
    ],
  },
  {
    fontFamily: 'Source Serif 4',
    fontDefinitions: [
      { path: './assets/fonts/SourceSerif4-SemiBold.ttf', weight: 600 },
      { path: './assets/fonts/SourceSerif4-Bold.ttf', weight: 700 },
    ],
  },
  {
    fontFamily: 'Inter',
    fontDefinitions: [
      { path: './assets/fonts/Inter[wght].ttf', weight: 400 },
      { path: './assets/fonts/Inter[wght].ttf', weight: 700 },
    ],
  },
] as const satisfies FontObject[];

describe('groupByFamily', () => {
  it('should group font definitions by font family', () => {
    const expected = {
      'Source Serif 4': [
        { path: './assets/fonts/SourceSerif4-Regular.ttf', weight: 400, style: 'normal' },
        { path: './assets/fonts/SourceSerif4-Medium.ttf', weight: 500, style: 'normal' },
        { path: './assets/fonts/SourceSerif4-SemiBold.ttf', weight: 600 },
        { path: './assets/fonts/SourceSerif4-Bold.ttf', weight: 700 },
      ],
      SpaceMono: [{ path: './assets/fonts/SpaceMono-Regular.ttf', weight: 400, style: 'normal' }],
      Inter: [
        { path: './assets/fonts/Inter[wght].ttf', weight: 400 },
        { path: './assets/fonts/Inter[wght].ttf', weight: 700 },
      ],
    };

    const result = groupByFamily(input);
    expect(result).toEqual(expected);
  });

  it('should handle empty input', () => {
    const result = groupByFamily([]);
    expect(result).toEqual({});
  });
});

describe('planFontCopies', () => {
  const dir = '/res/font';
  const asResourceName = (filenameWithExt: string) =>
    `${toValidAndroidResourceName(filenameWithExt)}${path.extname(filenameWithExt)}`;

  it('should copy each destination once', () => {
    // One variable font file backing several weights resolves to the same path several times.
    const copies = planFontCopies(
      ['/p/Inter[wght].ttf', '/p/Inter[wght].ttf', '/p/Other.ttf'],
      dir,
      (it) => it
    );

    expect([...copies]).toEqual([
      [path.join(dir, 'Inter[wght].ttf'), '/p/Inter[wght].ttf'],
      [path.join(dir, 'Other.ttf'), '/p/Other.ttf'],
    ]);
  });

  it('should reject two different files landing on one destination', () => {
    // `toValidAndroidResourceName` drops the directory, so these collide. Copying both would leave
    // whichever won the race, with no sign the other was dropped.
    expect(() => planFontCopies(['/a/Inter.ttf', '/b/Inter.ttf'], dir, asResourceName)).toThrow(
      /Inter\.ttf.+Inter\.ttf.+inter\.ttf/s
    );
  });

  it('should apply the filename processor to the destination', () => {
    const copies = planFontCopies(['/p/SpaceMono-Regular.ttf'], dir, asResourceName);

    expect([...copies.keys()]).toEqual([path.join(dir, 'space_mono_regular.ttf')]);
  });

  it('should skip files that are not fonts', () => {
    const copies = planFontCopies(['/p/a.ttf', '/p/b.woff2', '/p/c.otf'], dir, (it) => it);

    expect([...copies.keys()]).toEqual([path.join(dir, 'a.ttf'), path.join(dir, 'c.otf')]);
  });
});

describe('assertAndroidCanLoadFonts', () => {
  const declaring = (...paths: string[]) =>
    groupByFamily([
      {
        fontFamily: 'Inter',
        fontDefinitions: paths.map((path, index) => ({ path, weight: (index + 1) * 100 })),
      },
    ]);

  it('should accept TrueType and OpenType files', () => {
    expect(() =>
      assertAndroidCanLoadFonts(declaring('./Inter[wght].ttf', './Inter-Bold.otf'))
    ).not.toThrow();
    expect(() => assertAndroidCanLoadFonts(groupByFamily(input))).not.toThrow();
  });

  it('should reject a web font format', () => {
    // Android reads SFNT files only, and `planFontCopies` copies nothing else, so the XML would
    // reference a `res/font` entry that prebuild never wrote.
    expect(() => assertAndroidCanLoadFonts(declaring('./Inter[wght].woff2'))).toThrow(
      /"Inter".+Inter\[wght\]\.woff2.+\.ttf.+\.otf/s
    );
    expect(() => assertAndroidCanLoadFonts(declaring('./Inter[wght].woff'))).toThrow(/\.woff/);
  });
});

describe('assertNoConflictingDefinitions', () => {
  it('should accept one variable font file backing several weights', () => {
    // The shape the docs recommend for variable fonts, so it has to stay legal.
    expect(() => assertNoConflictingDefinitions(groupByFamily(input))).not.toThrow();
  });

  it('should accept the same weight at different styles', () => {
    const italicAndUpright = groupByFamily([
      {
        fontFamily: 'Inter',
        fontDefinitions: [
          { path: './Inter[wght].ttf', weight: 400, style: 'normal' },
          { path: './Inter-Italic[wght].ttf', weight: 400, style: 'italic' },
        ],
      },
    ]);

    expect(() => assertNoConflictingDefinitions(italicAndUpright)).not.toThrow();
  });

  it('should accept the same weight in different families', () => {
    const twoFamilies = groupByFamily([
      { fontFamily: 'Inter', fontDefinitions: [{ path: './Inter[wght].ttf', weight: 400 }] },
      { fontFamily: 'Inter Tight', fontDefinitions: [{ path: './Inter[wght].ttf', weight: 400 }] },
    ]);

    expect(() => assertNoConflictingDefinitions(twoFamilies)).not.toThrow();
  });

  it('should reject a repeated weight and style within a family', () => {
    // Android resolves a family by (weight, style), so `FontFamily.Builder.addFont` throws on the
    // second entry and the app dies in `MainApplication.onCreate`. Catch it during prebuild.
    // Different files on purpose: it is the pair that has to be unique, not the file.
    const conflicting = groupByFamily([
      {
        fontFamily: 'Inter',
        fontDefinitions: [
          { path: './Inter-Regular.ttf', weight: 400 },
          { path: './Inter-Book.ttf', weight: 400, style: 'normal' },
        ],
      },
    ]);

    expect(() => assertNoConflictingDefinitions(conflicting)).toThrow(
      /"Inter".+weight 400.+style "normal".+Inter-Regular\.ttf.+Inter-Book\.ttf/s
    );
  });
});

describe('getXmlSpecs', () => {
  it('should generate XML specs for font families', () => {
    const fontsDir = '/path/to/fonts';
    const expected = [
      {
        path: path.join(fontsDir, `xml_source_serif_4.xml`),
        xml: {
          'font-family': {
            $: { 'xmlns:app': 'http://schemas.android.com/apk/res-auto' },
            font: [
              {
                $: {
                  'app:font': '@font/source_serif4_regular',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '400',
                  'app:fontVariationSettings': `'wght' 400`,
                },
              },
              {
                $: {
                  'app:font': '@font/source_serif4_medium',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '500',
                  'app:fontVariationSettings': `'wght' 500`,
                },
              },
              {
                $: {
                  'app:font': '@font/source_serif4_semi_bold',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '600',
                  'app:fontVariationSettings': `'wght' 600`,
                },
              },
              {
                $: {
                  'app:font': '@font/source_serif4_bold',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '700',
                  'app:fontVariationSettings': `'wght' 700`,
                },
              },
            ],
          },
        },
      },
      {
        path: path.join(fontsDir, `xml_space_mono.xml`),
        xml: {
          'font-family': {
            $: { 'xmlns:app': 'http://schemas.android.com/apk/res-auto' },
            font: [
              {
                $: {
                  'app:font': '@font/space_mono_regular',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '400',
                  'app:fontVariationSettings': `'wght' 400`,
                },
              },
            ],
          },
        },
      },
      {
        // one variable font file backing two weights
        path: path.join(fontsDir, `xml_inter.xml`),
        xml: {
          'font-family': {
            $: { 'xmlns:app': 'http://schemas.android.com/apk/res-auto' },
            font: [
              {
                $: {
                  'app:font': '@font/inter_wght_',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '400',
                  'app:fontVariationSettings': `'wght' 400`,
                },
              },
              {
                $: {
                  'app:font': '@font/inter_wght_',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '700',
                  'app:fontVariationSettings': `'wght' 700`,
                },
              },
            ],
          },
        },
      },
    ];

    expect(getXmlSpecs(fontsDir, groupByFamily(input))).toEqual(expected);
  });

  it('should handle empty input', () => {
    const fontsDir = '/path/to/fonts';
    const result = getXmlSpecs(fontsDir, {});
    expect(result).toHaveLength(0);
  });
});

describe('generateFontManagerCalls', () => {
  it('supports kotlin and java', () => {
    const resultKt = generateFontManagerCalls(groupByFamily(input), 'kt');

    expect(resultKt).toMatchInlineSnapshot(`
      [
        "    ReactFontManager.getInstance().addCustomFont(this, "Source Serif 4", R.font.xml_source_serif_4)",
        "    ReactFontManager.getInstance().addCustomFont(this, "SpaceMono", R.font.xml_space_mono)",
        "    ReactFontManager.getInstance().addCustomFont(this, "Inter", R.font.xml_inter)",
      ]
    `);

    const result = generateFontManagerCalls(groupByFamily(input), 'java');

    expect(result).toMatchInlineSnapshot(`
      [
        "    ReactFontManager.getInstance().addCustomFont(this, "Source Serif 4", R.font.xml_source_serif_4);",
        "    ReactFontManager.getInstance().addCustomFont(this, "SpaceMono", R.font.xml_space_mono);",
        "    ReactFontManager.getInstance().addCustomFont(this, "Inter", R.font.xml_inter);",
      ]
    `);
  });
});
