import * as path from 'path';

import { toValidAndroidResourceName } from '../utils';
import type { FontObject, FontVariationAxes } from '../withFonts';
import {
  groupByFamily,
  planFontCopies,
  getXmlSpecs,
  generateFontManagerCalls,
  assertNoConflictingDefinitions,
  assertAndroidCanLoadFonts,
  assertValidWeights,
  assertValidAxes,
  warnAboutUnknownAxisTags,
  warnAboutUnslantedItalics,
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
      // The same file slanted by its `slnt` axis, so one variable font also backs the oblique.
      { path: './assets/fonts/Inter[wght].ttf', weight: 400, style: 'italic', axes: { slnt: -10 } },
    ],
  },
  {
    fontFamily: 'Roboto Flex',
    // One variable file backs every definition, so the family names it once instead of each
    // definition repeating it.
    path: './assets/fonts/RobotoFlex.ttf',
    fontDefinitions: [
      { weight: 400 },
      // A registered axis and one the font declares for itself. `slnt` is left undefined, the
      // shape a conditional in app.config.ts writes for the axis it omits.
      { weight: 700, axes: { wght: 650, slnt: undefined, wdth: 75, GRAD: -50 } },
      // A definition may still name a file of its own.
      { path: './assets/fonts/RobotoSerif_italic.ttf', weight: 400, style: 'italic' },
    ],
  },
] as const satisfies FontObject[];

const declaring = (axes: FontVariationAxes) =>
  groupByFamily([
    {
      fontFamily: 'Roboto Flex',
      fontDefinitions: [{ path: './RobotoFlex.ttf', weight: 400, axes }],
    },
  ]);

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
        {
          path: './assets/fonts/Inter[wght].ttf',
          weight: 400,
          style: 'italic',
          axes: { slnt: -10 },
        },
      ],
      // The family's `path` fills in every definition that declares none of its own.
      'Roboto Flex': [
        { path: './assets/fonts/RobotoFlex.ttf', weight: 400 },
        {
          path: './assets/fonts/RobotoFlex.ttf',
          weight: 700,
          axes: { slnt: undefined, wght: 650, wdth: 75, GRAD: -50 },
        },
        { path: './assets/fonts/RobotoSerif_italic.ttf', weight: 400, style: 'italic' },
      ],
    };

    const result = groupByFamily(input);
    expect(result).toEqual(expected);
  });

  it('should handle empty input', () => {
    const result = groupByFamily([]);
    expect(result).toEqual({});
  });

  it('should name the missing field when neither the family nor the definition holds a path', () => {
    expect(() =>
      groupByFamily([{ fontFamily: 'Roboto Flex', fontDefinitions: [{ weight: 700 }] }])
    ).toThrow(/declares no "path"/);
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

describe('assertValidWeights', () => {
  const declaring = (weight: unknown) =>
    groupByFamily([
      {
        fontFamily: 'Inter',
        fontDefinitions: [{ path: './Inter[wght].ttf', weight: weight as number }],
      },
    ]);

  it('should accept the weights Android resolves a family by', () => {
    expect(() => assertValidWeights(groupByFamily(input))).not.toThrow();
    expect(() => assertValidWeights(declaring(1))).not.toThrow();
    expect(() => assertValidWeights(declaring(1000))).not.toThrow();
  });

  it('should reject a weight outside the range Android reads', () => {
    expect(() => assertValidWeights(declaring(0))).toThrow(/1 to 1000/);
    expect(() => assertValidWeights(declaring(1001))).toThrow(/1 to 1000/);
    expect(() => assertValidWeights(declaring(400.5))).toThrow(/1 to 1000/);
    expect(() => assertValidWeights(declaring('400'))).toThrow(/1 to 1000/);
  });

  it('should name the missing field when a definition carries no weight', () => {
    expect(() => assertValidWeights(declaring(undefined))).toThrow(/declares no weight/);
    expect(() => assertValidWeights(declaring(null))).toThrow(/declares no weight/);
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
              {
                $: {
                  'app:font': '@font/inter_wght_',
                  'app:fontStyle': 'italic',
                  'app:fontWeight': '400',
                  'app:fontVariationSettings': `'wght' 400, 'slnt' -10`,
                },
              },
            ],
          },
        },
      },
      {
        // the family's `path` backing two weights, and one definition naming a file of its own
        path: path.join(fontsDir, `xml_roboto_flex.xml`),
        xml: {
          'font-family': {
            $: { 'xmlns:app': 'http://schemas.android.com/apk/res-auto' },
            font: [
              {
                $: {
                  'app:font': '@font/roboto_flex',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '400',
                  'app:fontVariationSettings': `'wght' 400`,
                },
              },
              {
                $: {
                  'app:font': '@font/roboto_flex',
                  'app:fontStyle': 'normal',
                  'app:fontWeight': '700',
                  // `slnt` is undefined, so it is left out entirely.
                  'app:fontVariationSettings': `'wght' 650, 'wdth' 75, 'GRAD' -50`,
                },
              },
              {
                $: {
                  'app:font': '@font/roboto_serif_italic',
                  'app:fontStyle': 'italic',
                  'app:fontWeight': '400',
                  'app:fontVariationSettings': `'wght' 400`,
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

describe('assertValidAxes', () => {
  it('should accept registered and custom axis tags', () => {
    // `input` holds `slnt` left undefined, the registered `wdth`, and the font's own `GRAD`.
    expect(() => assertValidAxes(groupByFamily(input))).not.toThrow();
  });

  it('should accept a tag padded to four characters', () => {
    // The registry pads a tag holding fewer than four letters or digits with trailing spaces.
    expect(() => assertValidAxes(declaring({ 'AB  ': 1 }))).not.toThrow();
  });

  it('should reject an axis it cannot emit', () => {
    expect(() => assertValidAxes(declaring({ slant: -10 }))).toThrow(/"slant".+four/s);
    expect(() => assertValidAxes(declaring({ "a'b'": -10 }))).toThrow(/begins with a letter/);
    expect(() => assertValidAxes(declaring({ '    ': -10 }))).toThrow(/begins with a letter/);
    // A tag begins with a letter, so this one names no axis however the font is built.
    expect(() => assertValidAxes(declaring({ '1abc': -10 }))).toThrow(/begins with a letter/);
    // @ts-expect-error an axis takes a number
    expect(() => assertValidAxes(declaring({ slnt: 'left' }))).toThrow();
  });

  it('should accept a registered tag spelled in the foundry namespace', () => {
    // Uppercase names an axis a font declares for itself, so `SLNT` is not a misspelt `slnt`.
    expect(() => assertValidAxes(declaring({ SLNT: -10, WDTH: 75 }))).not.toThrow();
    expect(() => assertValidAxes(declaring({ WGHT: 650 }))).not.toThrow();
  });

  it('should reject a registered axis tag in a case that names no axis', () => {
    expect(() => assertValidAxes(declaring({ Slnt: -10 }))).toThrow(/"Slnt".+"slnt"/s);
    expect(() => assertValidAxes(declaring({ Wdth: 75 }))).toThrow(/"Wdth".+"wdth"/s);
    expect(() => assertValidAxes(declaring({ Wght: 650 }))).toThrow(/"Wght".+"wght"/s);
  });

  it('should reject a§xes that hold no entries to read', () => {
    expect(() => assertValidAxes(declaring('slnt' as unknown as FontVariationAxes))).toThrow(
      /not an object/
    );
    expect(() => assertValidAxes(declaring([-10] as unknown as FontVariationAxes))).toThrow(
      /not an object/
    );
  });
});

describe('warnAboutUnknownAxisTags', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('should warn about a foundry tag written in lowercase', () => {
    // Roboto Flex declares `GRAD`, so `grad` names no axis and Android applies nothing.
    warnAboutUnknownAxisTags(declaring({ grad: -50 }));

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"grad".+"GRAD"/s));
  });

  it('should warn about a registered tag written in the foundry namespace', () => {
    // Legal, so `assertValidAxes` lets it through — but far more often `slnt` in the wrong case,
    // and Android then applies nothing. Without this the mistake is silent.
    warnAboutUnknownAxisTags(declaring({ SLNT: -10 }));

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"SLNT".+"slnt"/s));
  });

  it('should point at the registered tag for a foundry WGHT', () => {
    warnAboutUnknownAxisTags(declaring({ WGHT: 650 }));

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"WGHT".+"wght"/s));
  });

  it('should stay quiet about tags a font can declare', () => {
    warnAboutUnknownAxisTags(declaring({ slnt: -10, GRAD: -50, XTR2: 1, 'AB  ': 1 }));
    warnAboutUnknownAxisTags(groupByFamily(input));
    // A tag that would warn stays quiet while it holds no value, so an axis left out of an
    // app.config.ts conditional never reports.
    warnAboutUnknownAxisTags(declaring({ grad: undefined }));

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('warnAboutUnslantedItalics', () => {
  let warn: jest.SpyInstance;

  // One file backing both an upright and an italic face, the shape a variable font takes.
  const backedBy = (italic: Partial<FontObject['fontDefinitions'][number]>) =>
    groupByFamily([
      {
        fontFamily: 'Inter',
        path: './Inter[wght].ttf',
        fontDefinitions: [{ weight: 400 }, { weight: 400, style: 'italic', ...italic }],
      },
    ]);

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('should warn when the file backing an italic face also backs an upright one without declaring slnt / ital', () => {
    warnAboutUnslantedItalics(backedBy({}));

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"Inter".+will render upright/s));
  });

  it('should stay quiet when the italic definition slants the file or has own file path', () => {
    warnAboutUnslantedItalics(backedBy({ axes: { slnt: -10 } }));
    warnAboutUnslantedItalics(backedBy({ axes: { ital: 1 } }));
    // A font may declare the slant as its own axis, which slants it just the same.
    warnAboutUnslantedItalics(backedBy({ axes: { SLNT: -10 } }));
    warnAboutUnslantedItalics(backedBy({ path: './Inter-Italic.ttf' }));

    expect(warn).not.toHaveBeenCalled();
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
        "    ReactFontManager.getInstance().addCustomFont(this, "Roboto Flex", R.font.xml_roboto_flex)",
      ]
    `);

    const result = generateFontManagerCalls(groupByFamily(input), 'java');

    expect(result).toMatchInlineSnapshot(`
      [
        "    ReactFontManager.getInstance().addCustomFont(this, "Source Serif 4", R.font.xml_source_serif_4);",
        "    ReactFontManager.getInstance().addCustomFont(this, "SpaceMono", R.font.xml_space_mono);",
        "    ReactFontManager.getInstance().addCustomFont(this, "Inter", R.font.xml_inter);",
        "    ReactFontManager.getInstance().addCustomFont(this, "Roboto Flex", R.font.xml_roboto_flex);",
      ]
    `);
  });
});
