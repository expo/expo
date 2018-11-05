package abi30_0_0.host.exp.exponent.modules.api.components.svg;

import abi30_0_0.com.facebook.react.bridge.ReadableMap;

import static abi30_0_0.com.facebook.react.uimanager.ViewProps.FONT_FAMILY;
import static abi30_0_0.com.facebook.react.uimanager.ViewProps.FONT_SIZE;
import static abi30_0_0.com.facebook.react.uimanager.ViewProps.FONT_STYLE;
import static abi30_0_0.com.facebook.react.uimanager.ViewProps.FONT_WEIGHT;

class FontData {
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
    private static final String FONT_VARIANT_LIGATURES = "fontVariantLigatures";

    final double fontSize;
    final String fontFamily;
    final FontStyle fontStyle;
    final ReadableMap fontData;
    final FontWeight fontWeight;
    final String fontFeatureSettings;
    final FontVariantLigatures fontVariantLigatures;

    final TextAnchor textAnchor;
    final TextDecoration textDecoration;

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
        fontFeatureSettings = "";
        fontVariantLigatures = FontVariantLigatures.normal;

        textAnchor = TextAnchor.start;
        textDecoration = TextDecoration.None;

        manualKerning = false;
        kerning = DEFAULT_KERNING;
        fontSize = DEFAULT_FONT_SIZE;
        wordSpacing = DEFAULT_WORD_SPACING;
        letterSpacing = DEFAULT_LETTER_SPACING;
    }

    private double toAbsolute(String string, double scale, double fontSize) {
        return PropHelper.fromRelative(
            string,
            0,
            0,
            scale,
            fontSize
        );
    }

    FontData(ReadableMap font, FontData parent, double scale) {
        double parentFontSize = parent.fontSize;

        if (font.hasKey(FONT_SIZE)) {
            String string = font.getString(FONT_SIZE);
            fontSize = PropHelper.fromRelative(
                string,
                parentFontSize,
                0,
                1,
                parentFontSize
            );
        } else {
            fontSize = parentFontSize;
        }

        fontData = font.hasKey(FONT_DATA) ? font.getMap(FONT_DATA) : parent.fontData;

        fontFamily = font.hasKey(FONT_FAMILY) ? font.getString(FONT_FAMILY) : parent.fontFamily;
        fontStyle = font.hasKey(FONT_STYLE) ? FontStyle.valueOf(font.getString(FONT_STYLE)) : parent.fontStyle;
        fontWeight = font.hasKey(FONT_WEIGHT) ? FontWeight.getEnum(font.getString(FONT_WEIGHT)) : parent.fontWeight;
        fontFeatureSettings = font.hasKey(FONT_FEATURE_SETTINGS) ? font.getString(FONT_FEATURE_SETTINGS) : parent.fontFeatureSettings;
        fontVariantLigatures = font.hasKey(FONT_VARIANT_LIGATURES) ? FontVariantLigatures.valueOf(font.getString(FONT_VARIANT_LIGATURES)) : parent.fontVariantLigatures;

        textAnchor = font.hasKey(TEXT_ANCHOR) ? TextAnchor.valueOf(font.getString(TEXT_ANCHOR)) : parent.textAnchor;
        textDecoration = font.hasKey(TEXT_DECORATION) ? TextDecoration.getEnum(font.getString(TEXT_DECORATION)) : parent.textDecoration;

        final boolean hasKerning = font.hasKey(KERNING);
        manualKerning = hasKerning || parent.manualKerning;

        // https://www.w3.org/TR/SVG11/text.html#SpacingProperties
        // https://drafts.csswg.org/css-text-3/#spacing
        // calculated values for units in: kerning, word-spacing, and, letter-spacing.
        kerning = hasKerning ? toAbsolute(font.getString(KERNING), scale, fontSize) : parent.kerning;
        wordSpacing = font.hasKey(WORD_SPACING) ? toAbsolute(font.getString(WORD_SPACING), scale, fontSize) : parent.wordSpacing;
        letterSpacing = font.hasKey(LETTER_SPACING) ? toAbsolute(font.getString(LETTER_SPACING), scale, fontSize) : parent.letterSpacing;
    }
}
