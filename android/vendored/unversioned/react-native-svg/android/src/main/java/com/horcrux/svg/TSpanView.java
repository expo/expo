/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.horcrux.svg;

import static android.graphics.Matrix.MTRANS_X;
import static android.graphics.Matrix.MTRANS_Y;
import static android.graphics.PathMeasure.POSITION_MATRIX_FLAG;
import static android.graphics.PathMeasure.TANGENT_MATRIX_FLAG;
import static com.horcrux.svg.TextProperties.AlignmentBaseline;
import static com.horcrux.svg.TextProperties.FontStyle;
import static com.horcrux.svg.TextProperties.FontVariantLigatures;
import static com.horcrux.svg.TextProperties.FontWeight;
import static com.horcrux.svg.TextProperties.TextAnchor;
import static com.horcrux.svg.TextProperties.TextPathMidLine;
import static com.horcrux.svg.TextProperties.TextPathSide;

import android.annotation.SuppressLint;
import android.content.res.AssetManager;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathMeasure;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Build;
import android.text.Layout;
import android.text.SpannableString;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.view.View;
import android.view.ViewParent;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.views.text.ReactFontManager;
import java.text.Bidi;
import java.util.ArrayList;
import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class TSpanView extends TextView {
  private static final double tau = 2 * Math.PI;
  private static final double radToDeg = 360 / tau;

  private static final String FONTS = "fonts/";
  private static final String OTF = ".otf";
  private static final String TTF = ".ttf";

  private Path mCachedPath;
  @Nullable String mContent;
  private TextPathView textPath;
  private final ArrayList<String> emoji = new ArrayList<>();
  private final ArrayList<Matrix> emojiTransforms = new ArrayList<>();
  private final AssetManager assets;

  public TSpanView(ReactContext reactContext) {
    super(reactContext);
    assets = mContext.getResources().getAssets();
  }

  public void setContent(@Nullable String content) {
    mContent = content;
    invalidate();
  }

  @Override
  public void invalidate() {
    mCachedPath = null;
    super.invalidate();
  }

  void clearCache() {
    mCachedPath = null;
    super.clearCache();
  }

  @Override
  void draw(Canvas canvas, Paint paint, float opacity) {
    if (mContent != null) {
      if (mInlineSize != null && mInlineSize.value != 0) {
        if (setupFillPaint(paint, opacity * fillOpacity)) {
          drawWrappedText(canvas, paint);
        }
        if (setupStrokePaint(paint, opacity * strokeOpacity)) {
          drawWrappedText(canvas, paint);
        }
      } else {
        int numEmoji = emoji.size();
        if (numEmoji > 0) {
          GlyphContext gc = getTextRootGlyphContext();
          FontData font = gc.getFont();
          applyTextPropertiesToPaint(paint, font);
          for (int i = 0; i < numEmoji; i++) {
            String current = emoji.get(i);
            Matrix mid = emojiTransforms.get(i);
            canvas.save();
            canvas.concat(mid);
            canvas.drawText(current, 0, 0, paint);
            canvas.restore();
          }
        }
        drawPath(canvas, paint, opacity);
      }
    } else {
      clip(canvas, paint);
      drawGroup(canvas, paint, opacity);
    }
  }

  private void drawWrappedText(Canvas canvas, Paint paint) {
    GlyphContext gc = getTextRootGlyphContext();
    pushGlyphContext();
    FontData font = gc.getFont();
    TextPaint tp = new TextPaint(paint);
    applyTextPropertiesToPaint(tp, font);
    applySpacingAndFeatures(tp, font);
    double fontSize = gc.getFontSize();

    Layout.Alignment align;
    switch (font.textAnchor) {
      default:
      case start:
        align = Layout.Alignment.ALIGN_NORMAL;
        break;

      case middle:
        align = Layout.Alignment.ALIGN_CENTER;
        break;

      case end:
        align = Layout.Alignment.ALIGN_OPPOSITE;
        break;
    }

    boolean includeFontPadding = true;
    SpannableString text = new SpannableString(mContent);
    final double width =
        PropHelper.fromRelative(mInlineSize, canvas.getWidth(), 0, mScale, fontSize);
    StaticLayout layout = getStaticLayout(tp, align, includeFontPadding, text, (int) width);

    int lineAscent = layout.getLineAscent(0);

    float dx = (float) gc.nextX(0);
    float dy = (float) (gc.nextY() + lineAscent);
    popGlyphContext();

    canvas.save();
    canvas.translate(dx, dy);
    layout.draw(canvas);
    canvas.restore();
  }

  @SuppressWarnings("deprecation")
  private StaticLayout getStaticLayout(
      TextPaint tp,
      Layout.Alignment align,
      boolean includeFontPadding,
      SpannableString text,
      int width) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return new StaticLayout(text, tp, width, align, 1.f, 0.f, includeFontPadding);
    } else {
      return StaticLayout.Builder.obtain(text, 0, text.length(), tp, width)
          .setAlignment(align)
          .setLineSpacing(0.f, 1.f)
          .setIncludePad(includeFontPadding)
          .setBreakStrategy(Layout.BREAK_STRATEGY_HIGH_QUALITY)
          .setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NORMAL)
          .build();
    }
  }

  /**
   * Implements visual to logical order converter.
   *
   * @author <a href="http://www.nesterovsky-bros.com">Nesterovsky bros</a>
   * @param text an input text in visual order to convert.
   * @return a String value in logical order.
   */
  public static String visualToLogical(String text) {
    if ((text == null) || (text.length() == 0)) {
      return text;
    }

    Bidi bidi = new Bidi(text, Bidi.DIRECTION_DEFAULT_LEFT_TO_RIGHT);

    if (bidi.isLeftToRight()) {
      return text;
    }

    int count = bidi.getRunCount();
    byte[] levels = new byte[count];
    Integer[] runs = new Integer[count];

    for (int i = 0; i < count; i++) {
      levels[i] = (byte) bidi.getRunLevel(i);
      runs[i] = i;
    }

    Bidi.reorderVisually(levels, 0, runs, 0, count);

    StringBuilder result = new StringBuilder();

    for (int i = 0; i < count; i++) {
      int index = runs[i];
      int start = bidi.getRunStart(index);
      int end = bidi.getRunLimit(index);
      int level = levels[index];

      if ((level & 1) != 0) {
        for (; --end >= start; ) {
          result.append(text.charAt(end));
        }
      } else {
        result.append(text, start, end);
      }
    }

    return result.toString();
  }

  @Override
  Path getPath(Canvas canvas, Paint paint) {
    if (mCachedPath != null) {
      return mCachedPath;
    }

    if (mContent == null) {
      mCachedPath = getGroupPath(canvas, paint);
      return mCachedPath;
    }

    setupTextPath();

    pushGlyphContext();
    mCachedPath = getLinePath(visualToLogical(mContent), paint, canvas);
    popGlyphContext();

    return mCachedPath;
  }

  double getSubtreeTextChunksTotalAdvance(Paint paint) {
    if (!Double.isNaN(cachedAdvance)) {
      return cachedAdvance;
    }
    double advance = 0;

    if (mContent == null) {
      for (int i = 0; i < getChildCount(); i++) {
        View child = getChildAt(i);
        if (child instanceof TextView) {
          TextView text = (TextView) child;
          advance += text.getSubtreeTextChunksTotalAdvance(paint);
        }
      }
      cachedAdvance = advance;
      return advance;
    }

    String line = mContent;
    final int length = line.length();

    if (length == 0) {
      cachedAdvance = 0;
      return advance;
    }

    GlyphContext gc = getTextRootGlyphContext();
    FontData font = gc.getFont();
    applyTextPropertiesToPaint(paint, font);

    applySpacingAndFeatures(paint, font);

    cachedAdvance = paint.measureText(line);
    return cachedAdvance;
  }

  static final String requiredFontFeatures =
      "'rlig', 'liga', 'clig', 'calt', 'locl', 'ccmp', 'mark', 'mkmk',";
  static final String disableDiscretionaryLigatures =
      "'liga' 0, 'clig' 0, 'dlig' 0, 'hlig' 0, 'cala' 0, ";
  static final String defaultFeatures = requiredFontFeatures + "'kern', ";
  static final String additionalLigatures = "'hlig', 'cala', ";
  static final String fontWeightTag = "'wght' ";

  private void applySpacingAndFeatures(Paint paint, FontData font) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      double letterSpacing = font.letterSpacing;
      paint.setLetterSpacing((float) (letterSpacing / (font.fontSize * mScale)));

      final boolean allowOptionalLigatures =
          letterSpacing == 0 && font.fontVariantLigatures == FontVariantLigatures.normal;

      if (allowOptionalLigatures) {
        paint.setFontFeatureSettings(
            defaultFeatures + additionalLigatures + font.fontFeatureSettings);
      } else {
        paint.setFontFeatureSettings(
            defaultFeatures + disableDiscretionaryLigatures + font.fontFeatureSettings);
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        paint.setFontVariationSettings(
            fontWeightTag + font.absoluteFontWeight + font.fontVariationSettings);
      }
    }
  }

  @SuppressWarnings("ConstantConditions")
  private Path getLinePath(String line, Paint paint, Canvas canvas) {
    final int length = line.length();
    final Path path = new Path();

    emoji.clear();
    emojiTransforms.clear();

    if (length == 0) {
      return path;
    }

    double pathLength = 0;
    PathMeasure pm = null;
    boolean isClosed = false;
    final boolean hasTextPath = textPath != null;
    if (hasTextPath) {
      pm = new PathMeasure(textPath.getTextPath(canvas, paint), false);
      pathLength = pm.getLength();
      isClosed = pm.isClosed();
      if (pathLength == 0) {
        return path;
      }
    }

    GlyphContext gc = getTextRootGlyphContext();
    FontData font = gc.getFont();
    applyTextPropertiesToPaint(paint, font);
    GlyphPathBag bag = new GlyphPathBag(paint);
    boolean[] ligature = new boolean[length];
    final char[] chars = line.toCharArray();

    /*
     *
     * Three properties affect the space between characters and words:
     *
     * ‘kerning’ indicates whether the user agent should adjust inter-glyph spacing
     * based on kerning tables that are included in the relevant font
     * (i.e., enable auto-kerning) or instead disable auto-kerning
     * and instead set inter-character spacing to a specific length (typically, zero).
     *
     * ‘letter-spacing’ indicates an amount of space that is to be added between text
     * characters supplemental to any spacing due to the ‘kerning’ property.
     *
     * ‘word-spacing’ indicates the spacing behavior between words.
     *
     *  Letter-spacing is applied after bidi reordering and is in addition to any word-spacing.
     *  Depending on the justification rules in effect, user agents may further increase
     *  or decrease the space between typographic character units in order to justify text.
     *
     * */
    double kerning = font.kerning;
    double wordSpacing = font.wordSpacing;
    double letterSpacing = font.letterSpacing;
    final boolean autoKerning = !font.manualKerning;

    /*
    11.1.2. Fonts and glyphs

    A font consists of a collection of glyphs together with other information (collectively,
    the font tables) necessary to use those glyphs to present characters on some visual medium.

    The combination of the collection of glyphs and the font tables is called the font data.

    A font may supply substitution and positioning tables that can be used by a formatter
    (text shaper) to re-order, combine and position a sequence of glyphs to form one or more
    composite glyphs.

    The combining may be as simple as a ligature, or as complex as an indic syllable which
    combines, usually with some re-ordering, multiple consonants and vowel glyphs.

    The tables may be language dependent, allowing the use of language appropriate letter forms.

    When a glyph, simple or composite, represents an indivisible unit for typesetting purposes,
    it is know as a typographic character.

    Ligatures are an important feature of advance text layout.

    Some ligatures are discretionary while others (e.g. in Arabic) are required.

    The following explicit rules apply to ligature formation:

    Ligature formation should not be enabled when characters are in different DOM text nodes;
    thus, characters separated by markup should not use ligatures.

    Ligature formation should not be enabled when characters are in different text chunks.

    Discretionary ligatures should not be used when the spacing between two characters is not
    the same as the default space (e.g. when letter-spacing has a non-default value,
    or text-align has a value of justify and text-justify has a value of distribute).
    (See CSS Text Module Level 3, ([css-text-3]).

    SVG attributes such as ‘dx’, ‘textLength’, and ‘spacing’ (in ‘textPath’) that may reposition
    typographic characters do not break discretionary ligatures.

    If discretionary ligatures are not desired
    they can be turned off by using the font-variant-ligatures property.

    /*
        When the effective letter-spacing between two characters is not zero
        (due to either justification or non-zero computed ‘letter-spacing’),
        user agents should not apply optional ligatures.
        https://www.w3.org/TR/css-text-3/#letter-spacing-property
    */
    final boolean allowOptionalLigatures =
        letterSpacing == 0 && font.fontVariantLigatures == FontVariantLigatures.normal;

    /*
        For OpenType fonts, discretionary ligatures include those enabled by
        the liga, clig, dlig, hlig, and cala features;
        required ligatures are found in the rlig feature.
        https://svgwg.org/svg2-draft/text.html#FontsGlyphs

        http://dev.w3.org/csswg/css-fonts/#propdef-font-feature-settings

        https://www.microsoft.com/typography/otspec/featurelist.htm
        https://www.microsoft.com/typography/otspec/featuretags.htm
        https://www.microsoft.com/typography/otspec/features_pt.htm
        https://www.microsoft.com/typography/otfntdev/arabicot/features.aspx
        http://unifraktur.sourceforge.net/testcases/enable_opentype_features/
        https://en.wikipedia.org/wiki/List_of_typographic_features
        http://ilovetypography.com/OpenType/opentype-features.html
        https://www.typotheque.com/articles/opentype_features_in_css
        https://practice.typekit.com/lesson/caring-about-opentype-features/
        http://stateofwebtype.com/

        6.12. Low-level font feature settings control: the font-feature-settings property

        Name:	font-feature-settings
        Value:	normal | <feature-tag-value> #
        Initial:	normal
        Applies to:	all elements
        Inherited:	yes
        Percentages:	N/A
        Media:	visual
        Computed value:	as specified
        Animatable:	no

        https://drafts.csswg.org/css-fonts-3/#default-features

        7.1. Default features

        For OpenType fonts, user agents must enable the default features defined in the OpenType
        documentation for a given script and writing mode.

        Required ligatures, common ligatures and contextual forms must be enabled by default
        (OpenType features: rlig, liga, clig, calt),
        along with localized forms (OpenType feature: locl),
        and features required for proper display of composed characters and marks
        (OpenType features: ccmp, mark, mkmk).

        These features must always be enabled, even when the value of the ‘font-variant’ and
        ‘font-feature-settings’ properties is ‘normal’.

        Individual features are only disabled when explicitly overridden by the author,
        as when ‘font-variant-ligatures’ is set to ‘no-common-ligatures’.

        TODO For handling complex scripts such as Arabic, Mongolian or Devanagari additional features
        are required.

        TODO For upright text within vertical text runs,
        vertical alternates (OpenType feature: vert) must be enabled.
    */
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      // String arabic = "'isol', 'fina', 'medi', 'init', 'rclt', 'mset', 'curs', ";
      if (allowOptionalLigatures) {
        paint.setFontFeatureSettings(
            defaultFeatures + additionalLigatures + font.fontFeatureSettings);
      } else {
        paint.setFontFeatureSettings(
            defaultFeatures + disableDiscretionaryLigatures + font.fontFeatureSettings);
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        paint.setFontVariationSettings(
            fontWeightTag + font.absoluteFontWeight + font.fontVariationSettings);
      }
    }
    // OpenType.js font data
    ReadableMap fontData = font.fontData;

    float[] advances = new float[length];
    paint.getTextWidths(line, advances);

    /*
    This would give both advances and textMeasure in one call / looping over the text
    double textMeasure = paint.getTextRunAdvances(line, 0, length, 0, length, true, advances, 0);
    */
    /*
       Determine the startpoint-on-the-path for the first glyph using attribute ‘startOffset’
       and property text-anchor.

       For text-anchor:start, startpoint-on-the-path is the point
       on the path which represents the point on the path which is ‘startOffset’ distance
       along the path from the start of the path, calculated using the user agent's distance
       along the path algorithm.

       For text-anchor:middle, startpoint-on-the-path is the point
       on the path which represents the point on the path which is [ ‘startOffset’ minus half
       of the total advance values for all of the glyphs in the ‘textPath’ element ] distance
       along the path from the start of the path, calculated using the user agent's distance
       along the path algorithm.

       For text-anchor:end, startpoint-on-the-path is the point on
       the path which represents the point on the path which is [ ‘startOffset’ minus the
       total advance values for all of the glyphs in the ‘textPath’ element ].

       Before rendering the first glyph, the horizontal component of the startpoint-on-the-path
       is adjusted to take into account various horizontal alignment text properties and
       attributes, such as a ‘dx’ attribute value on a ‘tspan’ element.
    */
    final TextAnchor textAnchor = font.textAnchor;
    TextView anchorRoot = getTextAnchorRoot();
    final double textMeasure = anchorRoot.getSubtreeTextChunksTotalAdvance(paint);
    double offset = getTextAnchorOffset(textAnchor, textMeasure);

    int side = 1;
    double startOfRendering = 0;
    double endOfRendering = pathLength;
    double fontSize = gc.getFontSize();
    boolean sharpMidLine = false;
    if (hasTextPath) {
      sharpMidLine = textPath.getMidLine() == TextPathMidLine.sharp;
      /*
          Name
          side
          Value
          left | right
          initial value
          left
          Animatable
          yes

          Determines the side of the path the text is placed on
          (relative to the path direction).

          Specifying a value of right effectively reverses the path.

          Added in SVG 2 to allow text either inside or outside closed subpaths
          and basic shapes (e.g. rectangles, circles, and ellipses).

          Adding 'side' was resolved at the Sydney (2015) meeting.
      */
      side = textPath.getSide() == TextPathSide.right ? -1 : 1;
      /*
          Name
          startOffset
          Value
          <length> | <percentage> | <number>
          initial value
          0
          Animatable
          yes

          An offset from the start of the path for the initial current text position,
          calculated using the user agent's distance along the path algorithm,
          after converting the path to the ‘textPath’ element's coordinate system.

          If a <length> other than a percentage is given, then the ‘startOffset’
          represents a distance along the path measured in the current user coordinate
          system for the ‘textPath’ element.

          If a percentage is given, then the ‘startOffset’ represents a percentage
          distance along the entire path. Thus, startOffset="0%" indicates the start
          point of the path and startOffset="100%" indicates the end point of the path.

          Negative values and values larger than the path length (e.g. 150%) are allowed.

          Any typographic characters with mid-points that are not on the path are not rendered

          For paths consisting of a single closed subpath (including an equivalent path for a
          basic shape), typographic characters are rendered along one complete circuit of the
          path. The text is aligned as determined by the text-anchor property to a position
          along the path set by the ‘startOffset’ attribute.

          For the start (end) value, the text is rendered from the start (end) of the line
          until the initial position along the path is reached again.

          For the middle, the text is rendered from the middle point in both directions until
          a point on the path equal distance in both directions from the initial position on
          the path is reached.
      */
      final double absoluteStartOffset =
          getAbsoluteStartOffset(textPath.getStartOffset(), pathLength, fontSize);
      offset += absoluteStartOffset;
      if (isClosed) {
        final double halfPathDistance = pathLength / 2;
        startOfRendering =
            absoluteStartOffset + (textAnchor == TextAnchor.middle ? -halfPathDistance : 0);
        endOfRendering = startOfRendering + pathLength;
      }
      /*
      TextPathSpacing spacing = textPath.getSpacing();
      if (spacing == TextPathSpacing.auto) {
          // Hmm, what to do here?
          // https://svgwg.org/svg2-draft/text.html#TextPathElementSpacingAttribute
      }
      */
    }

    /*
        Name
        method
        Value
        align | stretch
        initial value
        align
        Animatable
        yes
        Indicates the method by which text should be rendered along the path.

        A value of align indicates that the typographic character should be rendered using
        simple 2×3 matrix transformations such that there is no stretching/warping of the
        typographic characters. Typically, supplemental rotation, scaling and translation
        transformations are done for each typographic characters to be rendered.

        As a result, with align, in fonts where the typographic characters are designed to be
        connected (e.g., cursive fonts), the connections may not align properly when text is
        rendered along a path.

        A value of stretch indicates that the typographic character outlines will be converted
        into paths, and then all end points and control points will be adjusted to be along the
        perpendicular vectors from the path, thereby stretching and possibly warping the glyphs.

        With this approach, connected typographic characters, such as in cursive scripts,
        will maintain their connections. (Non-vertical straight path segments should be
        converted to Bézier curves in such a way that horizontal straight paths have an
        (approximately) constant offset from the path along which the typographic characters
        are rendered.)

        TODO implement stretch
    */

    /*
        Name	Value	Initial value	Animatable
        textLength	<length> | <percentage> | <number>	See below	yes

        The author's computation of the total sum of all of the advance values that correspond
        to character data within this element, including the advance value on the glyph
        (horizontal or vertical), the effect of properties letter-spacing and word-spacing and
        adjustments due to attributes ‘dx’ and ‘dy’ on this ‘text’ or ‘tspan’ element or any
        descendants. This value is used to calibrate the user agent's own calculations with
        that of the author.

        The purpose of this attribute is to allow the author to achieve exact alignment,
        in visual rendering order after any bidirectional reordering, for the first and
        last rendered glyphs that correspond to this element; thus, for the last rendered
        character (in visual rendering order after any bidirectional reordering),
        any supplemental inter-character spacing beyond normal glyph advances are ignored
        (in most cases) when the user agent determines the appropriate amount to expand/compress
        the text string to fit within a length of ‘textLength’.

        If attribute ‘textLength’ is specified on a given element and also specified on an
        ancestor, the adjustments on all character data within this element are controlled by
        the value of ‘textLength’ on this element exclusively, with the possible side-effect
        that the adjustment ratio for the contents of this element might be different than the
        adjustment ratio used for other content that shares the same ancestor. The user agent
        must assume that the total advance values for the other content within that ancestor is
        the difference between the advance value on that ancestor and the advance value for
        this element.

        This attribute is not intended for use to obtain effects such as shrinking or
        expanding text.

        A negative value is an error (see Error processing).

        The ‘textLength’ attribute is only applied when the wrapping area is not defined by the
    TODO shape-inside or the inline-size properties. It is also not applied for any ‘text’ or
    TODO ‘tspan’ element that has forced line breaks (due to a white-space value of pre or
        pre-line).

        If the attribute is not specified anywhere within a ‘text’ element, the effect is as if
        the author's computation exactly matched the value calculated by the user agent;
        thus, no advance adjustments are made.
    */
    double scaleSpacingAndGlyphs = 1;
    if (mTextLength != null) {
      final double author =
          PropHelper.fromRelative(mTextLength, canvas.getWidth(), 0, mScale, fontSize);
      if (author < 0) {
        throw new IllegalArgumentException("Negative textLength value");
      }
      switch (mLengthAdjust) {
        default:
        case spacing:
          letterSpacing += (author - textMeasure) / (length - 1);
          break;
        case spacingAndGlyphs:
          scaleSpacingAndGlyphs = author / textMeasure;
          break;
      }
    }
    final double scaledDirection = scaleSpacingAndGlyphs * side;

    /*
        https://developer.mozilla.org/en/docs/Web/CSS/vertical-align
        https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6bsln.html
        https://www.microsoft.com/typography/otspec/base.htm
        http://apike.ca/prog_svg_text_style.html
        https://www.w3schools.com/tags/canvas_textbaseline.asp
        http://vanseodesign.com/web-design/svg-text-baseline-alignment/
        https://iamvdo.me/en/blog/css-font-metrics-line-height-and-vertical-align
        https://tympanus.net/codrops/css_reference/vertical-align/

        https://svgwg.org/svg2-draft/text.html#AlignmentBaselineProperty
        11.10.2.6. The ‘alignment-baseline’ property

        This property is defined in the CSS Line Layout Module 3 specification. See 'alignment-baseline'. [css-inline-3]
        https://drafts.csswg.org/css-inline/#propdef-alignment-baseline

        The vertical-align property shorthand should be preferred in new content.

        SVG 2 introduces some changes to the definition of this property.
        In particular: the values 'auto', 'before-edge', and 'after-edge' have been removed.
        For backwards compatibility, 'text-before-edge' should be mapped to 'text-top' and
        'text-after-edge' should be mapped to 'text-bottom'.

        Neither 'text-before-edge' nor 'text-after-edge' should be used with the vertical-align property.
    */
    final Paint.FontMetrics fm = paint.getFontMetrics();
    final double descenderDepth = fm.descent;
    final double bottom = descenderDepth + fm.leading;
    final double ascenderHeight = -fm.ascent + fm.leading;
    final double top = -fm.top;
    final double totalHeight = top + bottom;
    double baselineShift = 0;
    String baselineShiftString = getBaselineShift();
    AlignmentBaseline baseline = getAlignmentBaseline();
    if (baseline != null) {
      // TODO alignment-baseline, test / verify behavior
      // TODO get per glyph baselines from font baseline table, for high-precision alignment
      switch (baseline) {
          // https://wiki.apache.org/xmlgraphics-fop/LineLayout/AlignmentHandling
        default:
        case baseline:
          // Use the dominant baseline choice of the parent.
          // Match the box’s corresponding baseline to that of its parent.
          baselineShift = 0;
          break;

        case textBottom:
        case afterEdge:
        case textAfterEdge:
          // Match the bottom of the box to the bottom of the parent’s content area.
          // text-after-edge = text-bottom
          // text-after-edge = descender depth
          baselineShift = -descenderDepth;
          break;

        case alphabetic:
          // Match the box’s alphabetic baseline to that of its parent.
          // alphabetic = 0
          baselineShift = 0;
          break;

        case ideographic:
          // Match the box’s ideographic character face under-side baseline to that of its parent.
          // ideographic = descender depth
          baselineShift = -descenderDepth;
          break;

        case middle:
          // Align the vertical midpoint of the box with the baseline of the parent box plus half
          // the x-height of the parent.
          // middle = x height / 2
          Rect bounds = new Rect();
          // this will just retrieve the bounding rect for 'x'
          paint.getTextBounds("x", 0, 1, bounds);
          int xHeight = bounds.height();
          baselineShift = xHeight / 2.0;
          break;

        case central:
          // Match the box’s central baseline to the central baseline of its parent.
          // central = (ascender height - descender depth) / 2
          baselineShift = (ascenderHeight - descenderDepth) / 2;
          break;

        case mathematical:
          // Match the box’s mathematical baseline to that of its parent.
          // Hanging and mathematical baselines
          // There are no obvious formulas to calculate the position of these baselines.
          // At the time of writing FOP puts the hanging baseline at 80% of the ascender
          // height and the mathematical baseline at 50%.
          baselineShift = 0.5 * ascenderHeight;
          break;

        case hanging:
          baselineShift = 0.8 * ascenderHeight;
          break;

        case textTop:
        case beforeEdge:
        case textBeforeEdge:
          // Match the top of the box to the top of the parent’s content area.
          // text-before-edge = text-top
          // text-before-edge = ascender height
          baselineShift = ascenderHeight;
          break;

        case bottom:
          // Align the top of the aligned subtree with the top of the line box.
          baselineShift = bottom;
          break;

        case center:
          // Align the center of the aligned subtree with the center of the line box.
          baselineShift = totalHeight / 2;
          break;

        case top:
          // Align the bottom of the aligned subtree with the bottom of the line box.
          baselineShift = top;
          break;
      }
    }
    /*
    2.2.2. Alignment Shift: baseline-shift longhand

    This property specifies by how much the box is shifted up from its alignment point.
    It does not apply when alignment-baseline is top or bottom.

    Authors should use the vertical-align shorthand instead of this property.

    Values have the following meanings:

    <length>
    Raise (positive value) or lower (negative value) by the specified length.
    <percentage>
    Raise (positive value) or lower (negative value) by the specified percentage of the line-height.
    TODO sub
    Lower by the offset appropriate for subscripts of the parent’s box.
    (The UA should use the parent’s font data to find this offset whenever possible.)
    TODO super
    Raise by the offset appropriate for superscripts of the parent’s box.
    (The UA should use the parent’s font data to find this offset whenever possible.)

    User agents may additionally support the keyword baseline as computing to 0
    if is necessary for them to support legacy SVG content.
    Issue: We would prefer to remove this,
    and are looking for feedback from SVG user agents as to whether it’s necessary.

    https://www.w3.org/TR/css-inline-3/#propdef-baseline-shift
    */
    if (baselineShiftString != null && !baselineShiftString.isEmpty()) {
      switch (baseline) {
        case top:
        case bottom:
          break;

        default:
          switch (baselineShiftString) {
            case "sub":
              // TODO
              if (fontData != null && fontData.hasKey("tables") && fontData.hasKey("unitsPerEm")) {
                int unitsPerEm = fontData.getInt("unitsPerEm");
                ReadableMap tables = fontData.getMap("tables");
                if (tables.hasKey("os2")) {
                  ReadableMap os2 = tables.getMap("os2");
                  if (os2.hasKey("ySubscriptYOffset")) {
                    double subOffset = os2.getDouble("ySubscriptYOffset");
                    baselineShift += mScale * fontSize * subOffset / unitsPerEm;
                  }
                }
              }
              break;

            case "super":
              // TODO
              if (fontData != null && fontData.hasKey("tables") && fontData.hasKey("unitsPerEm")) {
                int unitsPerEm = fontData.getInt("unitsPerEm");
                ReadableMap tables = fontData.getMap("tables");
                if (tables.hasKey("os2")) {
                  ReadableMap os2 = tables.getMap("os2");
                  if (os2.hasKey("ySuperscriptYOffset")) {
                    double superOffset = os2.getDouble("ySuperscriptYOffset");
                    baselineShift -= mScale * fontSize * superOffset / unitsPerEm;
                  }
                }
              }
              break;

            case "baseline":
              break;

            default:
              baselineShift -=
                  PropHelper.fromRelative(baselineShiftString, mScale * fontSize, mScale, fontSize);
          }
          break;
      }
    }

    final Matrix start = new Matrix();
    final Matrix mid = new Matrix();
    final Matrix end = new Matrix();

    final float[] startPointMatrixData = new float[9];
    final float[] endPointMatrixData = new float[9];

    for (int index = 0; index < length; index++) {
      char currentChar = chars[index];
      String current = String.valueOf(currentChar);
      boolean alreadyRenderedGraphemeCluster = ligature[index];

      /*
          Determine the glyph's charwidth (i.e., the amount which the current text position
          advances horizontally when the glyph is drawn using horizontal text layout).
      */
      boolean hasLigature = false;
      if (alreadyRenderedGraphemeCluster) {
        current = "";
      } else {
        int nextIndex = index;
        while (++nextIndex < length) {
          float nextWidth = advances[nextIndex];
          if (nextWidth > 0) {
            break;
          }
          String nextLigature = current + chars[nextIndex];
          ligature[nextIndex] = true;
          current = nextLigature;
          hasLigature = true;
        }
      }
      double charWidth = paint.measureText(current) * scaleSpacingAndGlyphs;

      /*
          For each subsequent glyph, set a new startpoint-on-the-path as the previous
          endpoint-on-the-path, but with appropriate adjustments taking into account
          horizontal kerning tables in the font and current values of various attributes
          and properties, including spacing properties (e.g. letter-spacing and word-spacing)
          and ‘tspan’ elements with values provided for attributes ‘dx’ and ‘dy’. All
          adjustments are calculated as distance adjustments along the path, calculated
          using the user agent's distance along the path algorithm.
      */
      if (autoKerning) {
        double kerned = advances[index] * scaleSpacingAndGlyphs;
        kerning = kerned - charWidth;
      }

      boolean isWordSeparator = currentChar == ' ';
      double wordSpace = isWordSeparator ? wordSpacing : 0;
      double spacing = wordSpace + letterSpacing;
      double advance = charWidth + spacing;

      double x = gc.nextX(alreadyRenderedGraphemeCluster ? 0 : kerning + advance);
      double y = gc.nextY();
      double dx = gc.nextDeltaX();
      double dy = gc.nextDeltaY();
      double r = gc.nextRotation();

      if (alreadyRenderedGraphemeCluster || isWordSeparator) {
        // Skip rendering other grapheme clusters of ligatures (already rendered),
        // But, make sure to increment index positions by making gc.next() calls.
        continue;
      }

      advance *= side;
      charWidth *= side;
      double cursor = offset + (x + dx) * side;
      double startPoint = cursor - advance;

      if (hasTextPath) {
        /*
           Determine the point on the curve which is charwidth distance along the path from
           the startpoint-on-the-path for this glyph, calculated using the user agent's
           distance along the path algorithm. This point is the endpoint-on-the-path for
           the glyph.
        */
        double endPoint = startPoint + charWidth;

        /*
            Determine the midpoint-on-the-path, which is the point on the path which is
            "halfway" (user agents can choose either a distance calculation or a parametric
            calculation) between the startpoint-on-the-path and the endpoint-on-the-path.
        */
        double halfWay = charWidth / 2;
        double midPoint = startPoint + halfWay;

        //  Glyphs whose midpoint-on-the-path are off the path are not rendered.
        if (midPoint > endOfRendering) {
          continue;
        } else if (midPoint < startOfRendering) {
          continue;
        }

        /*
            Determine the glyph-midline, which is the vertical line in the glyph's
            coordinate system that goes through the glyph's x-axis midpoint.

            Position the glyph such that the glyph-midline passes through
            the midpoint-on-the-path and is perpendicular to the line
            through the startpoint-on-the-path and the endpoint-on-the-path.

            TODO suggest adding a compatibility mid-line rendering attribute to textPath,
            for a chrome/firefox/opera/safari compatible sharp text path rendering,
            which doesn't bend text smoothly along a right angle curve, (like Edge does)
            but keeps the mid-line orthogonal to the mid-point tangent at all times instead.
            https://github.com/w3c/svgwg/issues/337
        */
        final int posAndTanFlags = POSITION_MATRIX_FLAG | TANGENT_MATRIX_FLAG;
        if (sharpMidLine) {
          pm.getMatrix((float) midPoint, mid, posAndTanFlags);
        } else {
          /*
              In the calculation above, if either the startpoint-on-the-path
              or the endpoint-on-the-path is off the end of the path,
              then extend the path beyond its end points with a straight line
              that is parallel to the tangent at the path at its end point
              so that the midpoint-on-the-path can still be calculated.

              TODO suggest change in wording of svg spec:
              so that the midpoint-on-the-path can still be calculated.
              to
              so that the angle of the glyph-midline to the x-axis can still be calculated.
              or
              so that the line through the startpoint-on-the-path and the
              endpoint-on-the-path can still be calculated.
              https://github.com/w3c/svgwg/issues/337#issuecomment-318056199
          */
          if (startPoint < 0) {
            pm.getMatrix(0, start, posAndTanFlags);
            start.preTranslate((float) startPoint, 0);
          } else {
            pm.getMatrix((float) startPoint, start, POSITION_MATRIX_FLAG);
          }

          pm.getMatrix((float) midPoint, mid, POSITION_MATRIX_FLAG);

          if (endPoint > pathLength) {
            pm.getMatrix((float) pathLength, end, posAndTanFlags);
            end.preTranslate((float) (endPoint - pathLength), 0);
          } else {
            pm.getMatrix((float) endPoint, end, POSITION_MATRIX_FLAG);
          }

          start.getValues(startPointMatrixData);
          end.getValues(endPointMatrixData);

          double startX = startPointMatrixData[MTRANS_X];
          double startY = startPointMatrixData[MTRANS_Y];
          double endX = endPointMatrixData[MTRANS_X];
          double endY = endPointMatrixData[MTRANS_Y];

          // line through the startpoint-on-the-path and the endpoint-on-the-path
          double lineX = endX - startX;
          double lineY = endY - startY;

          double glyphMidlineAngle = Math.atan2(lineY, lineX);

          mid.preRotate((float) (glyphMidlineAngle * radToDeg * side));
        }

        /*
            Align the glyph vertically relative to the midpoint-on-the-path based on property
            alignment-baseline and any specified values for attribute ‘dy’ on a ‘tspan’ element.
        */
        mid.preTranslate((float) -halfWay, (float) (dy + baselineShift));
        mid.preScale((float) scaledDirection, (float) side);
        mid.postTranslate(0, (float) y);
      } else {
        mid.setTranslate((float) startPoint, (float) (y + dy + baselineShift));
      }

      mid.preRotate((float) r);

      Path glyph;
      if (hasLigature) {
        glyph = new Path();
        paint.getTextPath(current, 0, current.length(), 0, 0, glyph);
      } else {
        glyph = bag.getOrCreateAndCache(currentChar, current);
      }
      RectF bounds = new RectF();
      glyph.computeBounds(bounds, true);
      float width = bounds.width();
      if (width == 0) { // Render unicode emoji
        canvas.save();
        canvas.concat(mid);
        emoji.add(current);
        emojiTransforms.add(new Matrix(mid));
        canvas.drawText(current, 0, 0, paint);
        canvas.restore();
      } else {
        glyph.transform(mid);
        path.addPath(glyph);
      }
    }

    return path;
  }

  private double getAbsoluteStartOffset(SVGLength startOffset, double distance, double fontSize) {
    return PropHelper.fromRelative(startOffset, distance, 0, mScale, fontSize);
  }

  private double getTextAnchorOffset(TextAnchor textAnchor, double textMeasure) {
    switch (textAnchor) {
      default:
      case start:
        return 0;

      case middle:
        return -textMeasure / 2;

      case end:
        return -textMeasure;
    }
  }

  private void applyTextPropertiesToPaint(Paint paint, FontData font) {
    boolean isBold = font.fontWeight == FontWeight.Bold || font.absoluteFontWeight >= 550;
    boolean isItalic = font.fontStyle == FontStyle.italic;

    int style;
    if (isBold && isItalic) {
      style = Typeface.BOLD_ITALIC;
    } else if (isBold) {
      style = Typeface.BOLD;
    } else if (isItalic) {
      style = Typeface.ITALIC;
    } else {
      style = Typeface.NORMAL;
    }

    Typeface typeface = null;
    int weight = font.absoluteFontWeight;
    final String fontFamily = font.fontFamily;
    if (fontFamily != null && fontFamily.length() > 0) {
      String otfpath = FONTS + fontFamily + OTF;
      String ttfpath = FONTS + fontFamily + TTF;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Typeface.Builder builder = new Typeface.Builder(assets, otfpath);
        builder.setFontVariationSettings("'wght' " + weight + font.fontVariationSettings);
        builder.setWeight(weight);
        builder.setItalic(isItalic);
        typeface = builder.build();
        if (typeface == null) {
          builder = new Typeface.Builder(assets, ttfpath);
          builder.setFontVariationSettings("'wght' " + weight + font.fontVariationSettings);
          builder.setWeight(weight);
          builder.setItalic(isItalic);
          typeface = builder.build();
        }
      } else {
        try {
          typeface = Typeface.createFromAsset(assets, otfpath);
          typeface = Typeface.create(typeface, style);
        } catch (Exception ignored) {
          try {
            typeface = Typeface.createFromAsset(assets, ttfpath);
            typeface = Typeface.create(typeface, style);
          } catch (Exception ignored2) {
          }
        }
      }
    }

    if (typeface == null) {
      try {
        typeface = ReactFontManager.getInstance().getTypeface(fontFamily, style, assets);
      } catch (Exception ignored) {
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      typeface = Typeface.create(typeface, weight, isItalic);
    }

    paint.setLinearText(true);
    paint.setSubpixelText(true);
    paint.setTypeface(typeface);
    paint.setTextSize((float) (font.fontSize * mScale));
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      paint.setLetterSpacing(0);
    }
  }

  private void setupTextPath() {
    ViewParent parent = getParent();

    while (parent != null) {
      if (parent.getClass() == TextPathView.class) {
        textPath = (TextPathView) parent;
        break;
      } else if (!(parent instanceof TextView)) {
        break;
      }

      parent = parent.getParent();
    }
  }

  @Override
  int hitTest(final float[] src) {
    if (mContent == null) {
      return super.hitTest(src);
    }
    if (mPath == null || !mInvertible || !mTransformInvertible) {
      return -1;
    }

    float[] dst = new float[2];
    mInvMatrix.mapPoints(dst, src);
    mInvTransform.mapPoints(dst);
    int x = Math.round(dst[0]);
    int y = Math.round(dst[1]);

    initBounds();

    if ((mRegion == null || !mRegion.contains(x, y))
        && (mStrokeRegion == null || !mStrokeRegion.contains(x, y))) {
      return -1;
    }

    Path clipPath = getClipPath();
    if (clipPath != null) {
      if (!mClipRegion.contains(x, y)) {
        return -1;
      }
    }

    return getId();
  }
}
