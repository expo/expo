package com.horcrux.svg;

import static com.facebook.react.uimanager.ViewProps.FONT_FAMILY;
import static com.facebook.react.uimanager.ViewProps.FONT_SIZE;
import static com.facebook.react.uimanager.ViewProps.FONT_STYLE;
import static com.facebook.react.uimanager.ViewProps.FONT_WEIGHT;
import static com.horcrux.svg.TextProperties.*;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

class FontData {

  static class AbsoluteFontWeight {

    static final int normal = 400;

    private static final FontWeight[] WEIGHTS =
        new FontWeight[] {
          FontWeight.w100,
          FontWeight.w100,
          FontWeight.w200,
          FontWeight.w300,
          FontWeight.Normal,
          FontWeight.w500,
          FontWeight.w600,
          FontWeight.Bold,
          FontWeight.w800,
          FontWeight.w900,
          FontWeight.w900,
        };

    static FontWeight nearestFontWeight(int absoluteFontWeight) {
      return WEIGHTS[Math.round(absoluteFontWeight / 100f)];
    }

    private static final int[] absoluteFontWeights =
        new int[] {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

    // https://drafts.csswg.org/css-fonts-4/#relative-weights
    static int from(FontWeight fontWeight, FontData parent) {
      if (fontWeight == FontWeight.Bolder) {
        return bolder(parent.absoluteFontWeight);
      } else if (fontWeight == FontWeight.Lighter) {
        return lighter(parent.absoluteFontWeight);
      } else {
        return absoluteFontWeights[fontWeight.ordinal()];
      }
    }

    private static int bolder(int inherited) {
      if (inherited < 350) {
        return 400;
      } else if (inherited < 550) {
        return 700;
      } else if (inherited < 900) {
        return 900;
      } else {
        return inherited;
      }
    }

    private static int lighter(int inherited) {
      if (inherited < 100) {
        return inherited;
      } else if (inherited < 550) {
        return 100;
      } else if (inherited < 750) {
        return 400;
      } else {
        return 700;
      }
    }
  }

  static final double DEFAULT_FONT_SIZE = 12d;

  private static final double DEFAULT_KERNING = 0d;
  private static final double DEFAULT_WORD_SPACING = 0d;
  private static final double DEFAULT_LETTER_SPACING = 0d;

  private static final String KERNING = "kerning";
  private static final String FONT_DATA = "fontData";
  private static final String TEXT_ANCHOR = "textAnchor";
  private static final String WORD_SPACING = "wordSpacing";
  private static final String LETTER_SPACING = "letterSpacing";
  private static final String TEXT_DECORATION = "textDecoration";
  private static final String FONT_FEATURE_SETTINGS = "fontFeatureSettings";
  private static final String FONT_VARIATION_SETTINGS = "fontVariationSettings";
  private static final String FONT_VARIANT_LIGATURES = "fontVariantLigatures";

  final double fontSize;
  final String fontFamily;
  final FontStyle fontStyle;
  final ReadableMap fontData;

  FontWeight fontWeight;
  int absoluteFontWeight;

  final String fontFeatureSettings;
  final String fontVariationSettings;
  final FontVariantLigatures fontVariantLigatures;

  final TextAnchor textAnchor;
  private final TextDecoration textDecoration;

  final double kerning;
  final double wordSpacing;
  final double letterSpacing;

  final boolean manualKerning;

  static final FontData Defaults = new FontData();

  private FontData() {
    fontData = null;
    fontFamily = "";
    fontStyle = FontStyle.normal;
    fontWeight = FontWeight.Normal;
    absoluteFontWeight = AbsoluteFontWeight.normal;
    fontFeatureSettings = "";
    fontVariationSettings = "";
    fontVariantLigatures = FontVariantLigatures.normal;

    textAnchor = TextAnchor.start;
    textDecoration = TextDecoration.None;

    manualKerning = false;
    kerning = DEFAULT_KERNING;
    fontSize = DEFAULT_FONT_SIZE;
    wordSpacing = DEFAULT_WORD_SPACING;
    letterSpacing = DEFAULT_LETTER_SPACING;
  }

  private double toAbsolute(
      ReadableMap font, String prop, double scale, double fontSize, double relative) {
    ReadableType propType = font.getType(prop);
    if (propType == ReadableType.Number) {
      return font.getDouble(prop);
    } else {
      String string = font.getString(prop);
      return PropHelper.fromRelative(string, relative, scale, fontSize);
    }
  }

  private void setInheritedWeight(FontData parent) {
    absoluteFontWeight = parent.absoluteFontWeight;
    fontWeight = parent.fontWeight;
  }

  private void handleNumericWeight(FontData parent, double number) {
    long weight = Math.round(number);
    if (weight >= 1 && weight <= 1000) {
      absoluteFontWeight = (int) weight;
      fontWeight = AbsoluteFontWeight.nearestFontWeight(absoluteFontWeight);
    } else {
      setInheritedWeight(parent);
    }
  }

  FontData(ReadableMap font, FontData parent, double scale) {
    double parentFontSize = parent.fontSize;

    if (font.hasKey(FONT_SIZE)) {
      fontSize = toAbsolute(font, FONT_SIZE, 1, parentFontSize, parentFontSize);
    } else {
      fontSize = parentFontSize;
    }

    if (font.hasKey(FONT_WEIGHT)) {
      ReadableType fontWeightType = font.getType(FONT_WEIGHT);
      if (fontWeightType == ReadableType.Number) {
        handleNumericWeight(parent, font.getDouble(FONT_WEIGHT));
      } else {
        String string = font.getString(FONT_WEIGHT);
        if (FontWeight.hasEnum(string)) {
          absoluteFontWeight = AbsoluteFontWeight.from(FontWeight.get(string), parent);
          fontWeight = AbsoluteFontWeight.nearestFontWeight(absoluteFontWeight);
        } else if (string != null) {
          handleNumericWeight(parent, Double.parseDouble(string));
        } else {
          setInheritedWeight(parent);
        }
      }
    } else {
      setInheritedWeight(parent);
    }

    fontData = font.hasKey(FONT_DATA) ? font.getMap(FONT_DATA) : parent.fontData;

    fontFamily = font.hasKey(FONT_FAMILY) ? font.getString(FONT_FAMILY) : parent.fontFamily;
    fontStyle =
        font.hasKey(FONT_STYLE) ? FontStyle.valueOf(font.getString(FONT_STYLE)) : parent.fontStyle;
    fontFeatureSettings =
        font.hasKey(FONT_FEATURE_SETTINGS)
            ? font.getString(FONT_FEATURE_SETTINGS)
            : parent.fontFeatureSettings;
    fontVariationSettings =
        font.hasKey(FONT_VARIATION_SETTINGS)
            ? font.getString(FONT_VARIATION_SETTINGS)
            : parent.fontVariationSettings;
    fontVariantLigatures =
        font.hasKey(FONT_VARIANT_LIGATURES)
            ? FontVariantLigatures.valueOf(font.getString(FONT_VARIANT_LIGATURES))
            : parent.fontVariantLigatures;

    textAnchor =
        font.hasKey(TEXT_ANCHOR)
            ? TextAnchor.valueOf(font.getString(TEXT_ANCHOR))
            : parent.textAnchor;
    textDecoration =
        font.hasKey(TEXT_DECORATION)
            ? TextDecoration.getEnum(font.getString(TEXT_DECORATION))
            : parent.textDecoration;

    final boolean hasKerning = font.hasKey(KERNING);
    manualKerning = hasKerning || parent.manualKerning;

    // https://www.w3.org/TR/SVG11/text.html#SpacingProperties
    // https://drafts.csswg.org/css-text-3/#spacing
    // calculated values for units in: kerning, word-spacing, and, letter-spacing.
    kerning = hasKerning ? toAbsolute(font, KERNING, scale, fontSize, 0) : parent.kerning;
    wordSpacing =
        font.hasKey(WORD_SPACING)
            ? toAbsolute(font, WORD_SPACING, scale, fontSize, 0)
            : parent.wordSpacing;
    letterSpacing =
        font.hasKey(LETTER_SPACING)
            ? toAbsolute(font, LETTER_SPACING, scale, fontSize, 0)
            : parent.letterSpacing;
  }
}
