#import <Foundation/Foundation.h>

#ifndef RNTextProperties_h
#define RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGAlignmentBaseline) {
  ABI47_0_0RNSVGAlignmentBaselineBaseline,
  ABI47_0_0RNSVGAlignmentBaselineTextBottom,
  ABI47_0_0RNSVGAlignmentBaselineAlphabetic,
  ABI47_0_0RNSVGAlignmentBaselineIdeographic,
  ABI47_0_0RNSVGAlignmentBaselineMiddle,
  ABI47_0_0RNSVGAlignmentBaselineCentral,
  ABI47_0_0RNSVGAlignmentBaselineMathematical,
  ABI47_0_0RNSVGAlignmentBaselineTextTop,
  ABI47_0_0RNSVGAlignmentBaselineBottom,
  ABI47_0_0RNSVGAlignmentBaselineCenter,
  ABI47_0_0RNSVGAlignmentBaselineTop,
  /*
   SVG implementations may support the following aliases in order to support legacy content:

   text-before-edge = text-top
   text-after-edge = text-bottom
   */
  ABI47_0_0RNSVGAlignmentBaselineTextBeforeEdge,
  ABI47_0_0RNSVGAlignmentBaselineTextAfterEdge,
  // SVG 1.1
  ABI47_0_0RNSVGAlignmentBaselineBeforeEdge,
  ABI47_0_0RNSVGAlignmentBaselineAfterEdge,
  ABI47_0_0RNSVGAlignmentBaselineHanging,
  ABI47_0_0RNSVGAlignmentBaselineDEFAULT = ABI47_0_0RNSVGAlignmentBaselineBaseline
};

static NSString *const ABI47_0_0RNSVGAlignmentBaselineStrings[] = {
    @"baseline",        @"text-bottom", @"alphabetic", @"ideographic", @"middle",  @"central",
    @"mathematical",    @"text-top",    @"bottom",     @"center",      @"top",     @"text-before-edge",
    @"text-after-edge", @"before-edge", @"after-edge", @"hanging",     @"central", @"mathematical",
    @"text-top",        @"bottom",      @"center",     @"top",         nil};

NSString *ABI47_0_0RNSVGAlignmentBaselineToString(enum ABI47_0_0RNSVGAlignmentBaseline fw);

enum ABI47_0_0RNSVGAlignmentBaseline ABI47_0_0RNSVGAlignmentBaselineFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGFontStyle) {
  ABI47_0_0RNSVGFontStyleNormal,
  ABI47_0_0RNSVGFontStyleItalic,
  ABI47_0_0RNSVGFontStyleOblique,
  ABI47_0_0RNSVGFontStyleDEFAULT = ABI47_0_0RNSVGFontStyleNormal,
};

static NSString *const ABI47_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString *ABI47_0_0RNSVGFontStyleToString(enum ABI47_0_0RNSVGFontStyle fw);

enum ABI47_0_0RNSVGFontStyle ABI47_0_0RNSVGFontStyleFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGFontVariantLigatures) {
  ABI47_0_0RNSVGFontVariantLigaturesNormal,
  ABI47_0_0RNSVGFontVariantLigaturesNone,
  ABI47_0_0RNSVGFontVariantLigaturesDEFAULT = ABI47_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString *const ABI47_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString *ABI47_0_0RNSVGFontVariantLigaturesToString(enum ABI47_0_0RNSVGFontVariantLigatures fw);

enum ABI47_0_0RNSVGFontVariantLigatures ABI47_0_0RNSVGFontVariantLigaturesFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGFontWeight) {
  // Absolute
  ABI47_0_0RNSVGFontWeightNormal,
  ABI47_0_0RNSVGFontWeightBold,
  ABI47_0_0RNSVGFontWeight100,
  ABI47_0_0RNSVGFontWeight200,
  ABI47_0_0RNSVGFontWeight300,
  ABI47_0_0RNSVGFontWeight400,
  ABI47_0_0RNSVGFontWeight500,
  ABI47_0_0RNSVGFontWeight600,
  ABI47_0_0RNSVGFontWeight700,
  ABI47_0_0RNSVGFontWeight800,
  ABI47_0_0RNSVGFontWeight900,
  // Relative
  ABI47_0_0RNSVGFontWeightBolder,
  ABI47_0_0RNSVGFontWeightLighter,
  ABI47_0_0RNSVGFontWeightDEFAULT = ABI47_0_0RNSVGFontWeightNormal,
};

static NSString *const ABI47_0_0RNSVGFontWeightStrings[] = {
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

static int const ABI47_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI47_0_0RNSVGFontWeight const ABI47_0_0RNSVGFontWeights[] = {
    ABI47_0_0RNSVGFontWeight100,
    ABI47_0_0RNSVGFontWeight100,
    ABI47_0_0RNSVGFontWeight200,
    ABI47_0_0RNSVGFontWeight300,
    ABI47_0_0RNSVGFontWeightNormal,
    ABI47_0_0RNSVGFontWeight500,
    ABI47_0_0RNSVGFontWeight600,
    ABI47_0_0RNSVGFontWeightBold,
    ABI47_0_0RNSVGFontWeight800,
    ABI47_0_0RNSVGFontWeight900,
    ABI47_0_0RNSVGFontWeight900};

NSString *ABI47_0_0RNSVGFontWeightToString(enum ABI47_0_0RNSVGFontWeight fw);

NSInteger ABI47_0_0RNSVGFontWeightFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGTextAnchor) {
  ABI47_0_0RNSVGTextAnchorStart,
  ABI47_0_0RNSVGTextAnchorMiddle,
  ABI47_0_0RNSVGTextAnchorEnd,
  ABI47_0_0RNSVGTextAnchorDEFAULT = ABI47_0_0RNSVGTextAnchorStart,
};

static NSString *const ABI47_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString *ABI47_0_0RNSVGTextAnchorToString(enum ABI47_0_0RNSVGTextAnchor fw);

enum ABI47_0_0RNSVGTextAnchor ABI47_0_0RNSVGTextAnchorFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGTextDecoration) {
  ABI47_0_0RNSVGTextDecorationNone,
  ABI47_0_0RNSVGTextDecorationUnderline,
  ABI47_0_0RNSVGTextDecorationOverline,
  ABI47_0_0RNSVGTextDecorationLineThrough,
  ABI47_0_0RNSVGTextDecorationBlink,
  ABI47_0_0RNSVGTextDecorationDEFAULT = ABI47_0_0RNSVGTextDecorationNone,
};

static NSString *const ABI47_0_0RNSVGTextDecorationStrings[] =
    {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString *ABI47_0_0RNSVGTextDecorationToString(enum ABI47_0_0RNSVGTextDecoration fw);

enum ABI47_0_0RNSVGTextDecoration ABI47_0_0RNSVGTextDecorationFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGTextLengthAdjust) {
  ABI47_0_0RNSVGTextLengthAdjustSpacing,
  ABI47_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
  ABI47_0_0RNSVGTextLengthAdjustDEFAULT = ABI47_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString *const ABI47_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString *ABI47_0_0RNSVGTextLengthAdjustToString(enum ABI47_0_0RNSVGTextLengthAdjust fw);

enum ABI47_0_0RNSVGTextLengthAdjust ABI47_0_0RNSVGTextLengthAdjustFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGTextPathMethod) {
  ABI47_0_0RNSVGTextPathMethodAlign,
  ABI47_0_0RNSVGTextPathMethodStretch,
  ABI47_0_0RNSVGTextPathMethodDEFAULT = ABI47_0_0RNSVGTextPathMethodAlign,
};

static NSString *const ABI47_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString *ABI47_0_0RNSVGTextPathMethodToString(enum ABI47_0_0RNSVGTextPathMethod fw);

enum ABI47_0_0RNSVGTextPathMethod ABI47_0_0RNSVGTextPathMethodFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGTextPathMidLine) {
  ABI47_0_0RNSVGTextPathMidLineSharp,
  ABI47_0_0RNSVGTextPathMidLineSmooth,
  ABI47_0_0RNSVGTextPathMidLineDEFAULT = ABI47_0_0RNSVGTextPathMidLineSharp,
};

static NSString *const ABI47_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString *ABI47_0_0RNSVGTextPathMidLineToString(enum ABI47_0_0RNSVGTextPathMidLine fw);

enum ABI47_0_0RNSVGTextPathMidLine ABI47_0_0RNSVGTextPathMidLineFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGTextPathSide) {
  ABI47_0_0RNSVGTextPathSideLeft,
  ABI47_0_0RNSVGTextPathSideRight,
  ABI47_0_0RNSVGTextPathSideDEFAULT = ABI47_0_0RNSVGTextPathSideLeft,
};

static NSString *const ABI47_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString *ABI47_0_0RNSVGTextPathSideToString(enum ABI47_0_0RNSVGTextPathSide fw);

enum ABI47_0_0RNSVGTextPathSide ABI47_0_0RNSVGTextPathSideFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI47_0_0RNSVGTextPathSpacing) {
  ABI47_0_0RNSVGTextPathSpacingAutoSpacing,
  ABI47_0_0RNSVGTextPathSpacingExact,
  ABI47_0_0RNSVGTextPathSpacingDEFAULT = ABI47_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString *const ABI47_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString *ABI47_0_0RNSVGTextPathSpacingToString(enum ABI47_0_0RNSVGTextPathSpacing fw);

enum ABI47_0_0RNSVGTextPathSpacing ABI47_0_0RNSVGTextPathSpacingFromString(NSString *s);

#endif
