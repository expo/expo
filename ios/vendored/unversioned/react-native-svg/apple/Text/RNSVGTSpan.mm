/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGTSpan.h"
#import "RNSVGFontData.h"
#import "RNSVGPathMeasure.h"
#import "RNSVGText.h"
#import "RNSVGTextPath.h"
#import "RNSVGTextProperties.h"
#import "RNSVGTopAlignedLabel.h"
#import "RNSVGUIKit.h"

static NSCharacterSet *RNSVGTSpan_separators = nil;
static CGFloat RNSVGTSpan_radToDeg = 180 / (CGFloat)M_PI;

#ifdef RN_FABRIC_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation RNSVGTSpan {
  CGFloat startOffset;
  RNSVGTextPath *textPath;
  NSMutableArray *emoji;
  NSMutableArray *emojiTransform;
  CGFloat cachedAdvance;
  CTFontRef fontRef;
  CGFloat firstX;
  CGFloat firstY;
  RNSVGPathMeasure *measure;
}

#ifdef RN_FABRIC_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGTSpanProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGTSpanComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const RNSVGTSpanProps>(props);

  self.content = RCTNSStringFromStringNilIfEmpty(newProps.content);

  setCommonTextProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGTSpanProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  _content = nil;

  startOffset = 0;
  textPath = nil;
  cachedAdvance = 0;
  // these crash, hopefully it is always released by here
  //    if (fontRef != nil) {
  //        CFRelease(fontRef);
  //    }
  fontRef = nil;
  firstX = 0;
  firstY = 0;

  emoji = [NSMutableArray arrayWithCapacity:0];
  emojiTransform = [NSMutableArray arrayWithCapacity:0];
  measure = [[RNSVGPathMeasure alloc] init];
  RNSVGTSpan_separators = [NSCharacterSet whitespaceCharacterSet];
}
#endif // RN_FABRIC_ENABLED

- (id)init
{
  self = [super init];

  if (RNSVGTSpan_separators == nil) {
    RNSVGTSpan_separators = [NSCharacterSet whitespaceCharacterSet];
  }

  emoji = [NSMutableArray arrayWithCapacity:0];
  emojiTransform = [NSMutableArray arrayWithCapacity:0];
  measure = [[RNSVGPathMeasure alloc] init];

  return self;
}

- (void)clearPath
{
  [super clearPath];
  cachedAdvance = NAN;
}

- (void)setContent:(NSString *)content
{
  if ([content isEqualToString:_content]) {
    return;
  }
  [self invalidate];
  _content = content;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
  if (self.content) {
    RNSVGGlyphContext *gc = [self.textRoot getGlyphContext];
    if (self.inlineSize != nil && self.inlineSize.value != 0) {
      if (self.fill) {
        if (self.fill.class == RNSVGBrush.class) {
          CGColorRef color = [self.tintColor CGColor];
          [self drawWrappedText:context gc:gc rect:rect color:color];
        } else {
          CGColorRef color = [self.fill getColorWithOpacity:self.fillOpacity];
          [self drawWrappedText:context gc:gc rect:rect color:color];
          CGColorRelease(color);
        }
      }
      if (self.stroke) {
        if (self.stroke.class == RNSVGBrush.class) {
          CGColorRef color = [self.tintColor CGColor];
          [self drawWrappedText:context gc:gc rect:rect color:color];
        } else {
          CGColorRef color = [self.stroke getColorWithOpacity:self.strokeOpacity];
          [self drawWrappedText:context gc:gc rect:rect color:color];
          CGColorRelease(color);
        }
      }
    } else {
      if (self.path) {
        NSUInteger count = [emoji count];
        CGFloat fontSize = [gc getFontSize];
        for (NSUInteger i = 0; i < count; i++) {
          RNSVGPlatformView *label = [emoji objectAtIndex:i];
          NSValue *transformValue = [emojiTransform objectAtIndex:i];
          CGAffineTransform transform = [transformValue CGAffineTransformValue];
          CGContextConcatCTM(context, transform);
          CGContextTranslateCTM(context, 0, -fontSize);
          [label.layer renderInContext:context];
          CGContextTranslateCTM(context, 0, fontSize);
          CGContextConcatCTM(context, CGAffineTransformInvert(transform));
        }
      }
      [self renderPathTo:context rect:rect];
    }
  } else {
    [self clip:context];
    [self renderGroupTo:context rect:rect];
  }
}

- (NSMutableDictionary *)getAttributes:(RNSVGFontData *)fontdata
{
  NSMutableDictionary *attrs = [[NSMutableDictionary alloc] init];

  if (fontRef != nil) {
    attrs[NSFontAttributeName] = (__bridge id)fontRef;
  }

  CGFloat letterSpacing = fontdata->letterSpacing;
  bool allowOptionalLigatures = letterSpacing == 0 && fontdata->fontVariantLigatures == RNSVGFontVariantLigaturesNormal;
  NSNumber *lig = [NSNumber numberWithInt:allowOptionalLigatures ? 2 : 1];
  attrs[NSLigatureAttributeName] = lig;

  CGFloat kerning = fontdata->kerning;
  float kern = (float)(letterSpacing + kerning);
  NSNumber *kernAttr = [NSNumber numberWithFloat:kern];
#if DTCORETEXT_SUPPORT_NS_ATTRIBUTES
  if (___useiOS6Attributes) {
    [attrs setObject:kernAttr forKey:NSKernAttributeName];
  } else
#endif // DTCORETEXT_SUPPORT_NS_ATTRIBUTES
  {
    [attrs setObject:kernAttr forKey:(id)kCTKernAttributeName];
  }

  return attrs;
}

RNSVGTopAlignedLabel *label;
- (void)drawWrappedText:(CGContextRef)context gc:(RNSVGGlyphContext *)gc rect:(CGRect)rect color:(CGColorRef)color
{
  [self pushGlyphContext];
  if (fontRef != nil) {
    CFRelease(fontRef);
  }
  fontRef = [self getFontFromContext];
  RNSVGFontData *fontdata = [gc getFont];
  CFStringRef string = (__bridge CFStringRef)self.content;
  NSMutableDictionary *attrs = [self getAttributes:fontdata];
  CFMutableDictionaryRef attributes = (__bridge CFMutableDictionaryRef)attrs;
  CFAttributedStringRef attrString = CFAttributedStringCreate(kCFAllocatorDefault, string, attributes);

  enum RNSVGTextAnchor textAnchor = fontdata->textAnchor;
  NSTextAlignment align;
  switch (textAnchor) {
    case RNSVGTextAnchorStart:
      align = NSTextAlignmentLeft;
      break;

    case RNSVGTextAnchorMiddle:
      align = NSTextAlignmentCenter;
      break;

    case RNSVGTextAnchorEnd:
      align = NSTextAlignmentRight;
      break;

    default:
      align = NSTextAlignmentLeft;
      break;
  }

  UIFont *font = (__bridge UIFont *)(fontRef);
  if (!label) {
    label = [[RNSVGTopAlignedLabel alloc] init];
  }
  label.attributedText = (__bridge NSAttributedString *_Nullable)(attrString);
  label.lineBreakMode = NSLineBreakByWordWrapping;
  label.backgroundColor = RNSVGColor.clearColor;
  label.textAlignment = align;
  label.numberOfLines = 0;
#if !TARGET_OS_OSX // On macOS, views are transparent by default
  label.opaque = NO;
#endif // TARGET_OS_OSX
  label.font = font;
  label.textColor = [RNSVGColor colorWithCGColor:color];

  CGFloat fontSize = [gc getFontSize];
  CGFloat height = CGRectGetHeight(rect);
  CGFloat width = [RNSVGPropHelper fromRelative:self.inlineSize relative:[gc getWidth] fontSize:fontSize];
  CGRect constrain = CGRectMake(0, 0, width, height);
  CGRect s = [self.content boundingRectWithSize:constrain.size
                                        options:NSStringDrawingUsesLineFragmentOrigin
                                     attributes:attrs
                                        context:nil];

  CGRect bounds = CGRectMake(0, 0, width, s.size.height);
  label.frame = bounds;
  label.bounds = bounds;

  firstX = [gc nextXWithDouble:0];
  firstY = [gc nextY] - font.ascender;
  CGFloat dx = firstX;
  CGFloat dy = firstY;
  CGContextTranslateCTM(context, dx, dy);
  [label.layer renderInContext:context];
  CGContextTranslateCTM(context, -dx, -dy);
  [self popGlyphContext];
  [self renderPathTo:context rect:rect];
}

- (CGPathRef)getPath:(CGContextRef)context
{
  CGPathRef path = self.path;
  if (path) {
    return path;
  }

  NSString *text = self.content;
  if (!text) {
    return [self getGroupPath:context];
  }

  if (self.inlineSize != nil && self.inlineSize.value != 0) {
    CGAffineTransform transform = CGAffineTransformMakeTranslation(firstX, firstY);
    path = CGPathCreateWithRect(label.bounds, &transform);
    self.path = CGPathRetain(path);
    self.skip = true;
    return path;
  }

  [self setupTextPath:context];

  [self pushGlyphContext];

  path = [self getLinePath:text context:context];

  self.path = CGPathRetain(path);

  [self popGlyphContext];

  return path;
}

- (CGFloat)getSubtreeTextChunksTotalAdvance
{
  if (!isnan(cachedAdvance)) {
    return cachedAdvance;
  }
  CGFloat advance = 0;

  NSString *str = self.content;
  if (!str) {
    for (RNSVGView *node in self.subviews) {
      if ([node isKindOfClass:[RNSVGText class]]) {
        RNSVGText *text = (RNSVGText *)node;
        advance += [text getSubtreeTextChunksTotalAdvance];
      }
    }
    cachedAdvance = advance;
    return advance;
  }

  // Create a dictionary for this font
  fontRef = [self getFontFromContext];
  RNSVGGlyphContext *gc = [self.textRoot getGlyphContext];
  RNSVGFontData *fontdata = [gc getFont];
  NSMutableDictionary *attrs = [self getAttributes:fontdata];

  CFStringRef string = (__bridge CFStringRef)str;
  CFMutableDictionaryRef attributes = (__bridge CFMutableDictionaryRef)attrs;
  CFAttributedStringRef attrString = CFAttributedStringCreate(kCFAllocatorDefault, string, attributes);
  CTLineRef line = CTLineCreateWithAttributedString(attrString);

  CGRect textBounds = CTLineGetBoundsWithOptions(line, 0);
  CGFloat textMeasure = CGRectGetWidth(textBounds);
  cachedAdvance = textMeasure;

  CFRelease(attrString);
  CFRelease(line);

  return textMeasure;
}

- (CGPathRef)getLinePath:(NSString *)str context:(CGContextRef)context
{
  // Create a dictionary for this font
  fontRef = [self getFontFromContext];
  CGMutablePathRef path = CGPathCreateMutable();
  RNSVGGlyphContext *gc = [self.textRoot getGlyphContext];
  RNSVGFontData *font = [gc getFont];
  NSUInteger n = str.length;
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
  CGFloat kerning = font->kerning;
  CGFloat wordSpacing = font->wordSpacing;
  CGFloat letterSpacing = font->letterSpacing;
  bool autoKerning = !font->manualKerning;

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

   When the effective letter-spacing between two characters is not zero
   (due to either justification or non-zero computed ‘letter-spacing’),
   user agents should not apply optional ligatures.
   https://www.w3.org/TR/css-text-3/#letter-spacing-property
   */
  bool allowOptionalLigatures = letterSpacing == 0 && font->fontVariantLigatures == RNSVGFontVariantLigaturesNormal;

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
  // OpenType.js font data
  NSDictionary *fontData = font->fontData;
  NSMutableDictionary *attrs = [[NSMutableDictionary alloc] init];
  CFMutableDictionaryRef attributes = (__bridge CFMutableDictionaryRef)attrs;

  NSNumber *lig = [NSNumber numberWithInt:allowOptionalLigatures ? 2 : 1];
  attrs[NSLigatureAttributeName] = lig;
  if (fontRef != nil) {
    attrs[NSFontAttributeName] = (__bridge id)fontRef;
  }
  if (!autoKerning) {
    NSNumber *noAutoKern = [NSNumber numberWithFloat:0.0f];

#if DTCORETEXT_SUPPORT_NS_ATTRIBUTES
    if (___useiOS6Attributes) {
      [attrs setObject:noAutoKern forKey:NSKernAttributeName];
    } else
#endif // DTCORETEXT_SUPPORT_NS_ATTRIBUTES
    {
      [attrs setObject:noAutoKern forKey:(id)kCTKernAttributeName];
    }
  }

  CFStringRef string = (__bridge CFStringRef)str;
  CFAttributedStringRef attrString = CFAttributedStringCreate(kCFAllocatorDefault, string, attributes);
  CTLineRef line = CTLineCreateWithAttributedString(attrString);

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
  enum RNSVGTextAnchor textAnchor = font->textAnchor;
  RNSVGText *anchorRoot = [self getTextAnchorRoot];
  CGFloat textMeasure = [anchorRoot getSubtreeTextChunksTotalAdvance];
  CGFloat offset = [RNSVGTSpan getTextAnchorOffset:textAnchor width:textMeasure];

  bool hasTextPath = textPath != nil;

  int side = 1;
  CGFloat startOfRendering = 0;
  CGFloat endOfRendering = measure.pathLength;
  CGFloat fontSize = [gc getFontSize];
  // bool sharpMidLine = false;
  if (hasTextPath) {
    // sharpMidLine = RNSVGTextPathMidLineFromString([textPath midLine]) == RNSVGTextPathMidLineSharp;
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
    side = RNSVGTextPathSideFromString([textPath side]) == RNSVGTextPathSideRight ? -1 : 1;
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
    CGFloat absoluteStartOffset = [RNSVGPropHelper fromRelative:textPath.startOffset
                                                       relative:measure.pathLength
                                                       fontSize:fontSize];
    offset += absoluteStartOffset;
    if (measure.isClosed) {
      CGFloat halfPathDistance = measure.pathLength / 2;
      startOfRendering = absoluteStartOffset + (textAnchor == RNSVGTextAnchorMiddle ? -halfPathDistance : 0);
      endOfRendering = startOfRendering + measure.pathLength;
    }
    /*
     RNSVGTextPathSpacing spacing = textPath.getSpacing();
     if (spacing == RNSVGTextPathSpacing.auto) {
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
   Name    Value    Initial value    Animatable
   textLength    <length> | <percentage> | <number>    See below    yes

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
  CGFloat scaleSpacingAndGlyphs = 1;
  RNSVGLength *mTextLength = [self textLength];
  enum RNSVGTextLengthAdjust mLengthAdjust = RNSVGTextLengthAdjustFromString([self lengthAdjust]);
  if (mTextLength != nil) {
    CGFloat author = [RNSVGPropHelper fromRelative:mTextLength relative:[gc getWidth] fontSize:fontSize];
    if (author < 0) {
      NSException *e = [NSException exceptionWithName:@"NegativeTextLength"
                                               reason:@"Negative textLength value"
                                             userInfo:nil];
      @throw e;
    }
    switch (mLengthAdjust) {
      default:
      case RNSVGTextLengthAdjustSpacing:
        // TODO account for ligatures
        letterSpacing += (author - textMeasure) / (n - 1);
        break;
      case RNSVGTextLengthAdjustSpacingAndGlyphs:
        scaleSpacingAndGlyphs = author / textMeasure;
        break;
    }
  }
  CGFloat scaledDirection = scaleSpacingAndGlyphs * side;

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
  /*
  CGRect fontBounds = CTFontGetBoundingBox(fontRef);
  CGFloat textHeight = CGRectGetHeight(textBounds);
  CGFloat fontWidth = CGRectGetWidth(textBounds);
  CGPoint fontOrigin = fontBounds.origin;

  CGFloat fontMinX = fontOrigin.x;
  CGFloat fontMinY = fontOrigin.y;
  CGFloat fontMaxX = fontMinX + fontWidth;
  CGFloat fontMaxY = fontMinY + textHeight;
  */
  // TODO
  CGFloat descenderDepth = CTFontGetDescent(fontRef);
  CGFloat bottom = descenderDepth + CTFontGetLeading(fontRef);
  CGFloat ascenderHeight = CTFontGetAscent(fontRef);
  CGFloat top = ascenderHeight;
  CGFloat totalHeight = top + bottom;
  CGFloat baselineShift = 0;
  NSString *baselineShiftString = self.baselineShift;
  enum RNSVGAlignmentBaseline baseline = RNSVGAlignmentBaselineFromString(self.alignmentBaseline);
  if (baseline != RNSVGAlignmentBaselineBaseline) {
    // TODO alignment-baseline, test / verify behavior
    // TODO get per glyph baselines from font baseline table, for high-precision alignment
    CGFloat xHeight = CTFontGetXHeight(fontRef);
    switch (baseline) {
        // https://wiki.apache.org/xmlgraphics-fop/LineLayout/AlignmentHandling
      default:
      case RNSVGAlignmentBaselineBaseline:
        // Use the dominant baseline choice of the parent.
        // Match the box’s corresponding baseline to that of its parent.
        baselineShift = 0;
        break;

      case RNSVGAlignmentBaselineTextBottom:
      case RNSVGAlignmentBaselineAfterEdge:
      case RNSVGAlignmentBaselineTextAfterEdge:
        // Match the bottom of the box to the bottom of the parent’s content area.
        // text-after-edge = text-bottom
        // text-after-edge = descender depth
        baselineShift = -descenderDepth;
        break;

      case RNSVGAlignmentBaselineAlphabetic:
        // Match the box’s alphabetic baseline to that of its parent.
        // alphabetic = 0
        baselineShift = 0;
        break;

      case RNSVGAlignmentBaselineIdeographic:
        // Match the box’s ideographic character face under-side baseline to that of its parent.
        // ideographic = descender depth
        baselineShift = -descenderDepth;
        break;

      case RNSVGAlignmentBaselineMiddle:
        // Align the vertical midpoint of the box with the baseline of the parent box plus half the x-height of the
        // parent. TODO middle = x height / 2
        baselineShift = xHeight / 2;
        break;

      case RNSVGAlignmentBaselineCentral:
        // Match the box’s central baseline to the central baseline of its parent.
        // central = (ascender height - descender depth) / 2
        baselineShift = (ascenderHeight - descenderDepth) / 2;
        break;

      case RNSVGAlignmentBaselineMathematical:
        // Match the box’s mathematical baseline to that of its parent.
        // Hanging and mathematical baselines
        // There are no obvious formulas to calculate the position of these baselines.
        // At the time of writing FOP puts the hanging baseline at 80% of the ascender
        // height and the mathematical baseline at 50%.
        baselineShift = (CGFloat)0.5 * ascenderHeight;
        break;

      case RNSVGAlignmentBaselineHanging:
        baselineShift = (CGFloat)0.8 * ascenderHeight;
        break;

      case RNSVGAlignmentBaselineTextTop:
      case RNSVGAlignmentBaselineBeforeEdge:
      case RNSVGAlignmentBaselineTextBeforeEdge:
        // Match the top of the box to the top of the parent’s content area.
        // text-before-edge = text-top
        // text-before-edge = ascender height
        baselineShift = ascenderHeight;
        break;

      case RNSVGAlignmentBaselineBottom:
        // Align the top of the aligned subtree with the top of the line box.
        baselineShift = bottom;
        break;

      case RNSVGAlignmentBaselineCenter:
        // Align the center of the aligned subtree with the center of the line box.
        baselineShift = totalHeight / 2;
        break;

      case RNSVGAlignmentBaselineTop:
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
  if (baselineShiftString != nil && ![baselineShiftString isEqualToString:@""]) {
    switch (baseline) {
      case RNSVGAlignmentBaselineTop:
      case RNSVGAlignmentBaselineBottom:
        break;

      default:
        if (fontData != nil && [baselineShiftString isEqualToString:@"sub"]) {
          // TODO
          NSDictionary *tables = [fontData objectForKey:@"tables"];
          NSNumber *unitsPerEm = [fontData objectForKey:@"unitsPerEm"];
          NSDictionary *os2 = [tables objectForKey:@"os2"];
          NSNumber *ySubscriptYOffset = [os2 objectForKey:@"ySubscriptYOffset"];
          if (ySubscriptYOffset) {
            CGFloat subOffset = (CGFloat)[ySubscriptYOffset doubleValue];
            baselineShift += fontSize * subOffset / [unitsPerEm doubleValue];
          }
        } else if (fontData != nil && [baselineShiftString isEqualToString:@"super"]) {
          // TODO
          NSDictionary *tables = [fontData objectForKey:@"tables"];
          NSNumber *unitsPerEm = [fontData objectForKey:@"unitsPerEm"];
          NSDictionary *os2 = [tables objectForKey:@"os2"];
          NSNumber *ySuperscriptYOffset = [os2 objectForKey:@"ySuperscriptYOffset"];
          if (ySuperscriptYOffset) {
            CGFloat superOffset = (CGFloat)[ySuperscriptYOffset doubleValue];
            baselineShift -= fontSize * superOffset / [unitsPerEm doubleValue];
          }
        } else if ([baselineShiftString isEqualToString:@"baseline"]) {
        } else {
          baselineShift -= [RNSVGPropHelper fromRelativeWithNSString:baselineShiftString
                                                            relative:fontSize
                                                            fontSize:fontSize];
        }
        break;
    }
  }

  [emoji removeAllObjects];
  [emojiTransform removeAllObjects];

  CFArrayRef runs = CTLineGetGlyphRuns(line);
  CFIndex runEnd = CFArrayGetCount(runs);
  for (CFIndex ri = 0; ri < runEnd; ri++) {
    CTRunRef run = (CTRunRef)CFArrayGetValueAtIndex(runs, ri);
    CFIndex runGlyphCount = CTRunGetGlyphCount(run);
    CFIndex indices[runGlyphCount];
    CGSize advances[runGlyphCount];
    CGGlyph glyphs[runGlyphCount];

    // Grab the glyphs and font
    CTRunGetGlyphs(run, CFRangeMake(0, 0), glyphs);
    CTRunGetStringIndices(run, CFRangeMake(0, 0), indices);
    CTFontRef runFont = (CTFontRef)CFDictionaryGetValue(CTRunGetAttributes(run), kCTFontAttributeName);
    CTFontGetAdvancesForGlyphs(runFont, kCTFontOrientationHorizontal, glyphs, advances, runGlyphCount);
    CFIndex nextOrEndRunIndex = n;
    if (ri + 1 < runEnd) {
      CTRunRef nextRun = (CTRunRef)CFArrayGetValueAtIndex(runs, ri + 1);
      CFIndex nextRunGlyphCount = CTRunGetGlyphCount(nextRun);
      CFIndex nextIndices[nextRunGlyphCount];
      CTRunGetStringIndices(nextRun, CFRangeMake(0, 0), nextIndices);
      nextOrEndRunIndex = nextIndices[0];
    }

    for (CFIndex g = 0; g < runGlyphCount; g++) {
      CGGlyph glyph = glyphs[g];

      /*
       Determine the glyph's charwidth (i.e., the amount which the current text position
       advances horizontally when the glyph is drawn using horizontal text layout).

       For each subsequent glyph, set a new startpoint-on-the-path as the previous
       endpoint-on-the-path, but with appropriate adjustments taking into account
       horizontal kerning tables in the font and current values of various attributes
       and properties, including spacing properties (e.g. letter-spacing and word-spacing)
       and ‘tspan’ elements with values provided for attributes ‘dx’ and ‘dy’. All
       adjustments are calculated as distance adjustments along the path, calculated
       using the user agent's distance along the path algorithm.
       */
      CGFloat charWidth = advances[g].width * scaleSpacingAndGlyphs;

      CFIndex currIndex = indices[g];
      unichar currentChar = [str characterAtIndex:currIndex];
      bool isWordSeparator = [RNSVGTSpan_separators characterIsMember:currentChar];
      CGFloat wordSpace = isWordSeparator ? wordSpacing : 0;
      CGFloat spacing = wordSpace + letterSpacing;
      CGFloat advance = charWidth + spacing;

      CGFloat x = [gc nextXWithDouble:kerning + advance];
      CGFloat y = [gc nextY];
      CGFloat dx = [gc nextDeltaX];
      CGFloat dy = [gc nextDeltaY];
      CGFloat r = [gc nextRotation] / RNSVGTSpan_radToDeg;

      if (isWordSeparator) {
        continue;
      }

      CFIndex endIndex = g + 1 == runGlyphCount ? nextOrEndRunIndex : indices[g + 1];
      while (++currIndex < endIndex) {
        // Skip rendering other grapheme clusters of ligatures (already rendered),
        // And, make sure to increment index positions by making gc.next() calls.
        [gc nextXWithDouble:0];
        [gc nextY];
        [gc nextDeltaX];
        [gc nextDeltaY];
        [gc nextRotation];
      }
      CGPathRef glyphPath = CTFontCreatePathForGlyph(runFont, glyph, nil);

      advance *= side;
      charWidth *= side;
      CGFloat cursor = offset + (x + dx) * side;
      CGFloat startPoint = cursor - advance;

      CGAffineTransform transform = CGAffineTransformIdentity;
      if (hasTextPath) {
        /*
         Determine the point on the curve which is charwidth distance along the path from
         the startpoint-on-the-path for this glyph, calculated using the user agent's
         distance along the path algorithm. This point is the endpoint-on-the-path for
         the glyph.
         */
        // TODO CGFloat endPoint = startPoint + charWidth;

        /*
         Determine the midpoint-on-the-path, which is the point on the path which is
         "halfway" (user agents can choose either a distance calculation or a parametric
         calculation) between the startpoint-on-the-path and the endpoint-on-the-path.
         */
        CGFloat halfWay = charWidth / 2;
        CGFloat midPoint = startPoint + halfWay;

        //  Glyphs whose midpoint-on-the-path are off the path are not rendered.
        if (midPoint > endOfRendering) {
          CGPathRelease(glyphPath);
          continue;
        } else if (midPoint < startOfRendering) {
          CGPathRelease(glyphPath);
          continue;
        }

        CGFloat angle;
        CGFloat px;
        CGFloat py;
        [measure getPosAndTan:&angle midPoint:midPoint x:&px y:&py];

        transform = CGAffineTransformConcat(CGAffineTransformMakeTranslation(px, py), transform);
        transform = CGAffineTransformConcat(CGAffineTransformMakeRotation(angle + r), transform);
        transform = CGAffineTransformScale(transform, scaledDirection, side);
        transform =
            CGAffineTransformConcat(CGAffineTransformMakeTranslation(-halfWay, y + dy + baselineShift), transform);
      } else {
        transform = CGAffineTransformMakeTranslation(startPoint, y + dy + baselineShift);
        transform = CGAffineTransformConcat(CGAffineTransformMakeRotation(r), transform);
      }

      CGRect box = CGPathGetBoundingBox(glyphPath);
      CGFloat width = box.size.width;

      if (width == 0) { // Render unicode emoji
        RNSVGTextView *label = [[RNSVGTextView alloc] init];
        CFIndex startIndex = indices[g];
        long len = MAX(1, endIndex - startIndex);
        NSRange range = NSMakeRange(startIndex, len);
        NSString *currChars = [str substringWithRange:range];
#if TARGET_OS_OSX
        label.string = currChars;
#else
        label.text = currChars;
        label.opaque = NO;
#endif // TARGET_OS_OSX
        label.backgroundColor = RNSVGColor.clearColor;
        UIFont *customFont = [UIFont systemFontOfSize:fontSize];

        CGSize measuredSize = [currChars sizeWithAttributes:@{NSFontAttributeName : customFont}];
        label.font = customFont;
        CGFloat width = ceil(measuredSize.width);
        CGFloat height = ceil(measuredSize.height);
        CGRect bounds = CGRectMake(0, 0, width, height);
        label.frame = bounds;

        CGContextConcatCTM(context, transform);
        CGContextTranslateCTM(context, 0, -fontSize);
        [label.layer renderInContext:context];
        CGContextTranslateCTM(context, 0, fontSize);
        CGContextConcatCTM(context, CGAffineTransformInvert(transform));

        [emoji addObject:label];
        [emojiTransform addObject:[NSValue valueWithCGAffineTransform:transform]];
      } else {
        transform = CGAffineTransformScale(transform, 1.0, -1.0);
        CGPathAddPath(path, &transform, glyphPath);
      }
      CGPathRelease(glyphPath);
    }
  }

  CFRelease(attrString);
  CFRelease(line);

  return (CGPathRef)CFAutorelease(path);
}

+ (CGFloat)getTextAnchorOffset:(RNSVGTextAnchor)textAnchor width:(CGFloat)width
{
  switch (textAnchor) {
    case RNSVGTextAnchorStart:
      return 0;
    case RNSVGTextAnchorMiddle:
      return -width / 2;
    case RNSVGTextAnchorEnd:
      return -width;
  }

  return 0;
}

- (void)setupTextPath:(CGContextRef)context
{
  textPath = nil;
  RNSVGText *parent = (RNSVGText *)[self superview];
  CGPathRef path = nil;
  while (parent) {
    if ([parent class] == [RNSVGTextPath class]) {
      textPath = (RNSVGTextPath *)parent;
      RNSVGNode *definedTemplate = [self.svgView getDefinedTemplate:textPath.href];
      path = [definedTemplate getPath:context];
      [measure extractPathData:path];
      break;
    } else if (![parent isKindOfClass:[RNSVGText class]]) {
      break;
    }
    parent = (RNSVGText *)[parent superview];
  }
  if (!path) {
    [measure reset];
  }
}

@end

#ifdef RN_FABRIC_ENABLED
Class<RCTComponentViewProtocol> RNSVGTSpanCls(void)
{
  return RNSVGTSpan.class;
}
#endif // RN_FABRIC_ENABLED
