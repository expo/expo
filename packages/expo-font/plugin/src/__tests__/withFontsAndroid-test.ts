import * as path from 'path';

import type { FontObject } from '../withFonts';
import { groupByFamily, getXmlSpecs, generateFontManagerCalls } from '../withFontsAndroid';

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
    };

    const result = groupByFamily(input);
    expect(result).toEqual(expected);
  });

  it('should handle empty input', () => {
    const result = groupByFamily([]);
    expect(result).toEqual({});
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
                },
              },
              {
                $: {
                  'app:font': '@font/source_serif4_medium',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '500',
                },
              },
              {
                $: {
                  'app:font': '@font/source_serif4_semi_bold',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '600',
                },
              },
              {
                $: {
                  'app:font': '@font/source_serif4_bold',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '700',
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
      ]
    `);

    const result = generateFontManagerCalls(groupByFamily(input), 'java');

    expect(result).toMatchInlineSnapshot(`
      [
        "    ReactFontManager.getInstance().addCustomFont(this, "Source Serif 4", R.font.xml_source_serif_4);",
        "    ReactFontManager.getInstance().addCustomFont(this, "SpaceMono", R.font.xml_space_mono);",
      ]
    `);
  });
});
