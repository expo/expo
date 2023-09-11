#import <Foundation/Foundation.h>

#ifndef RNTextProperties_h
#define RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGAlignmentBaseline) {
  ABI48_0_0RNSVGAlignmentBaselineBaseline,
  ABI48_0_0RNSVGAlignmentBaselineTextBottom,
  ABI48_0_0RNSVGAlignmentBaselineAlphabetic,
  ABI48_0_0RNSVGAlignmentBaselineIdeographic,
  ABI48_0_0RNSVGAlignmentBaselineMiddle,
  ABI48_0_0RNSVGAlignmentBaselineCentral,
  ABI48_0_0RNSVGAlignmentBaselineMathematical,
  ABI48_0_0RNSVGAlignmentBaselineTextTop,
  ABI48_0_0RNSVGAlignmentBaselineBottom,
  ABI48_0_0RNSVGAlignmentBaselineCenter,
  ABI48_0_0RNSVGAlignmentBaselineTop,
  /*
   SVG implementations may support the following aliases in order to support legacy content:

   text-before-edge = text-top
   text-after-edge = text-bottom
   */
  ABI48_0_0RNSVGAlignmentBaselineTextBeforeEdge,
  ABI48_0_0RNSVGAlignmentBaselineTextAfterEdge,
  // SVG 1.1
  ABI48_0_0RNSVGAlignmentBaselineBeforeEdge,
  ABI48_0_0RNSVGAlignmentBaselineAfterEdge,
  ABI48_0_0RNSVGAlignmentBaselineHanging,
  ABI48_0_0RNSVGAlignmentBaselineDEFAULT = ABI48_0_0RNSVGAlignmentBaselineBaseline
};

static NSString *const ABI48_0_0RNSVGAlignmentBaselineStrings[] = {
    @"baseline",        @"text-bottom", @"alphabetic", @"ideographic", @"middle",  @"central",
    @"mathematical",    @"text-top",    @"bottom",     @"center",      @"top",     @"text-before-edge",
    @"text-after-edge", @"before-edge", @"after-edge", @"hanging",     @"central", @"mathematical",
    @"text-top",        @"bottom",      @"center",     @"top",         nil};

NSString *ABI48_0_0RNSVGAlignmentBaselineToString(enum ABI48_0_0RNSVGAlignmentBaseline fw);

enum ABI48_0_0RNSVGAlignmentBaseline ABI48_0_0RNSVGAlignmentBaselineFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGFontStyle) {
  ABI48_0_0RNSVGFontStyleNormal,
  ABI48_0_0RNSVGFontStyleItalic,
  ABI48_0_0RNSVGFontStyleOblique,
  ABI48_0_0RNSVGFontStyleDEFAULT = ABI48_0_0RNSVGFontStyleNormal,
};

static NSString *const ABI48_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString *ABI48_0_0RNSVGFontStyleToString(enum ABI48_0_0RNSVGFontStyle fw);

enum ABI48_0_0RNSVGFontStyle ABI48_0_0RNSVGFontStyleFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGFontVariantLigatures) {
  ABI48_0_0RNSVGFontVariantLigaturesNormal,
  ABI48_0_0RNSVGFontVariantLigaturesNone,
  ABI48_0_0RNSVGFontVariantLigaturesDEFAULT = ABI48_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString *const ABI48_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString *ABI48_0_0RNSVGFontVariantLigaturesToString(enum ABI48_0_0RNSVGFontVariantLigatures fw);

enum ABI48_0_0RNSVGFontVariantLigatures ABI48_0_0RNSVGFontVariantLigaturesFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGFontWeight) {
  // Absolute
  ABI48_0_0RNSVGFontWeightNormal,
  ABI48_0_0RNSVGFontWeightBold,
  ABI48_0_0RNSVGFontWeight100,
  ABI48_0_0RNSVGFontWeight200,
  ABI48_0_0RNSVGFontWeight300,
  ABI48_0_0RNSVGFontWeight400,
  ABI48_0_0RNSVGFontWeight500,
  ABI48_0_0RNSVGFontWeight600,
  ABI48_0_0RNSVGFontWeight700,
  ABI48_0_0RNSVGFontWeight800,
  ABI48_0_0RNSVGFontWeight900,
  // Relative
  ABI48_0_0RNSVGFontWeightBolder,
  ABI48_0_0RNSVGFontWeightLighter,
  ABI48_0_0RNSVGFontWeightDEFAULT = ABI48_0_0RNSVGFontWeightNormal,
};

static NSString *const ABI48_0_0RNSVGFontWeightStrings[] = {
    @"normal",
    @"bold",
    @"100",
    @"200",
    @"300",
    @"400",
    @"500",
    @"600",
    @"700",
    @"800",
    @"900",
    @"bolder",
    @"lighter",
    nil};

static int const ABI48_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI48_0_0RNSVGFontWeight const ABI48_0_0RNSVGFontWeights[] = {
    ABI48_0_0RNSVGFontWeight100,
    ABI48_0_0RNSVGFontWeight100,
    ABI48_0_0RNSVGFontWeight200,
    ABI48_0_0RNSVGFontWeight300,
    ABI48_0_0RNSVGFontWeightNormal,
    ABI48_0_0RNSVGFontWeight500,
    ABI48_0_0RNSVGFontWeight600,
    ABI48_0_0RNSVGFontWeightBold,
    ABI48_0_0RNSVGFontWeight800,
    ABI48_0_0RNSVGFontWeight900,
    ABI48_0_0RNSVGFontWeight900};

NSString *ABI48_0_0RNSVGFontWeightToString(enum ABI48_0_0RNSVGFontWeight fw);

NSInteger ABI48_0_0RNSVGFontWeightFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGTextAnchor) {
  ABI48_0_0RNSVGTextAnchorStart,
  ABI48_0_0RNSVGTextAnchorMiddle,
  ABI48_0_0RNSVGTextAnchorEnd,
  ABI48_0_0RNSVGTextAnchorDEFAULT = ABI48_0_0RNSVGTextAnchorStart,
};

static NSString *const ABI48_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString *ABI48_0_0RNSVGTextAnchorToString(enum ABI48_0_0RNSVGTextAnchor fw);

enum ABI48_0_0RNSVGTextAnchor ABI48_0_0RNSVGTextAnchorFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGTextDecoration) {
  ABI48_0_0RNSVGTextDecorationNone,
  ABI48_0_0RNSVGTextDecorationUnderline,
  ABI48_0_0RNSVGTextDecorationOverline,
  ABI48_0_0RNSVGTextDecorationLineThrough,
  ABI48_0_0RNSVGTextDecorationBlink,
  ABI48_0_0RNSVGTextDecorationDEFAULT = ABI48_0_0RNSVGTextDecorationNone,
};

static NSString *const ABI48_0_0RNSVGTextDecorationStrings[] =
    {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString *ABI48_0_0RNSVGTextDecorationToString(enum ABI48_0_0RNSVGTextDecoration fw);

enum ABI48_0_0RNSVGTextDecoration ABI48_0_0RNSVGTextDecorationFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGTextLengthAdjust) {
  ABI48_0_0RNSVGTextLengthAdjustSpacing,
  ABI48_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
  ABI48_0_0RNSVGTextLengthAdjustDEFAULT = ABI48_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString *const ABI48_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString *ABI48_0_0RNSVGTextLengthAdjustToString(enum ABI48_0_0RNSVGTextLengthAdjust fw);

enum ABI48_0_0RNSVGTextLengthAdjust ABI48_0_0RNSVGTextLengthAdjustFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGTextPathMethod) {
  ABI48_0_0RNSVGTextPathMethodAlign,
  ABI48_0_0RNSVGTextPathMethodStretch,
  ABI48_0_0RNSVGTextPathMethodDEFAULT = ABI48_0_0RNSVGTextPathMethodAlign,
};

static NSString *const ABI48_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString *ABI48_0_0RNSVGTextPathMethodToString(enum ABI48_0_0RNSVGTextPathMethod fw);

enum ABI48_0_0RNSVGTextPathMethod ABI48_0_0RNSVGTextPathMethodFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGTextPathMidLine) {
  ABI48_0_0RNSVGTextPathMidLineSharp,
  ABI48_0_0RNSVGTextPathMidLineSmooth,
  ABI48_0_0RNSVGTextPathMidLineDEFAULT = ABI48_0_0RNSVGTextPathMidLineSharp,
};

static NSString *const ABI48_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString *ABI48_0_0RNSVGTextPathMidLineToString(enum ABI48_0_0RNSVGTextPathMidLine fw);

enum ABI48_0_0RNSVGTextPathMidLine ABI48_0_0RNSVGTextPathMidLineFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGTextPathSide) {
  ABI48_0_0RNSVGTextPathSideLeft,
  ABI48_0_0RNSVGTextPathSideRight,
  ABI48_0_0RNSVGTextPathSideDEFAULT = ABI48_0_0RNSVGTextPathSideLeft,
};

static NSString *const ABI48_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString *ABI48_0_0RNSVGTextPathSideToString(enum ABI48_0_0RNSVGTextPathSide fw);

enum ABI48_0_0RNSVGTextPathSide ABI48_0_0RNSVGTextPathSideFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI48_0_0RNSVGTextPathSpacing) {
  ABI48_0_0RNSVGTextPathSpacingAutoSpacing,
  ABI48_0_0RNSVGTextPathSpacingExact,
  ABI48_0_0RNSVGTextPathSpacingDEFAULT = ABI48_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString *const ABI48_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString *ABI48_0_0RNSVGTextPathSpacingToString(enum ABI48_0_0RNSVGTextPathSpacing fw);

enum ABI48_0_0RNSVGTextPathSpacing ABI48_0_0RNSVGTextPathSpacingFromString(NSString *s);

#endif
