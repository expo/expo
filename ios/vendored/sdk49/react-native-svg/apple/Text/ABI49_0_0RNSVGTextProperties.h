#import <Foundation/Foundation.h>

#ifndef RNTextProperties_h
#define RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGAlignmentBaseline) {
  ABI49_0_0RNSVGAlignmentBaselineBaseline,
  ABI49_0_0RNSVGAlignmentBaselineTextBottom,
  ABI49_0_0RNSVGAlignmentBaselineAlphabetic,
  ABI49_0_0RNSVGAlignmentBaselineIdeographic,
  ABI49_0_0RNSVGAlignmentBaselineMiddle,
  ABI49_0_0RNSVGAlignmentBaselineCentral,
  ABI49_0_0RNSVGAlignmentBaselineMathematical,
  ABI49_0_0RNSVGAlignmentBaselineTextTop,
  ABI49_0_0RNSVGAlignmentBaselineBottom,
  ABI49_0_0RNSVGAlignmentBaselineCenter,
  ABI49_0_0RNSVGAlignmentBaselineTop,
  /*
   SVG implementations may support the following aliases in order to support legacy content:

   text-before-edge = text-top
   text-after-edge = text-bottom
   */
  ABI49_0_0RNSVGAlignmentBaselineTextBeforeEdge,
  ABI49_0_0RNSVGAlignmentBaselineTextAfterEdge,
  // SVG 1.1
  ABI49_0_0RNSVGAlignmentBaselineBeforeEdge,
  ABI49_0_0RNSVGAlignmentBaselineAfterEdge,
  ABI49_0_0RNSVGAlignmentBaselineHanging,
  ABI49_0_0RNSVGAlignmentBaselineDEFAULT = ABI49_0_0RNSVGAlignmentBaselineBaseline
};

static NSString *const ABI49_0_0RNSVGAlignmentBaselineStrings[] = {
    @"baseline",        @"text-bottom", @"alphabetic", @"ideographic", @"middle",  @"central",
    @"mathematical",    @"text-top",    @"bottom",     @"center",      @"top",     @"text-before-edge",
    @"text-after-edge", @"before-edge", @"after-edge", @"hanging",     @"central", @"mathematical",
    @"text-top",        @"bottom",      @"center",     @"top",         nil};

NSString *ABI49_0_0RNSVGAlignmentBaselineToString(enum ABI49_0_0RNSVGAlignmentBaseline fw);

enum ABI49_0_0RNSVGAlignmentBaseline ABI49_0_0RNSVGAlignmentBaselineFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGFontStyle) {
  ABI49_0_0RNSVGFontStyleNormal,
  ABI49_0_0RNSVGFontStyleItalic,
  ABI49_0_0RNSVGFontStyleOblique,
  ABI49_0_0RNSVGFontStyleDEFAULT = ABI49_0_0RNSVGFontStyleNormal,
};

static NSString *const ABI49_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString *ABI49_0_0RNSVGFontStyleToString(enum ABI49_0_0RNSVGFontStyle fw);

enum ABI49_0_0RNSVGFontStyle ABI49_0_0RNSVGFontStyleFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGFontVariantLigatures) {
  ABI49_0_0RNSVGFontVariantLigaturesNormal,
  ABI49_0_0RNSVGFontVariantLigaturesNone,
  ABI49_0_0RNSVGFontVariantLigaturesDEFAULT = ABI49_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString *const ABI49_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString *ABI49_0_0RNSVGFontVariantLigaturesToString(enum ABI49_0_0RNSVGFontVariantLigatures fw);

enum ABI49_0_0RNSVGFontVariantLigatures ABI49_0_0RNSVGFontVariantLigaturesFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGFontWeight) {
  // Absolute
  ABI49_0_0RNSVGFontWeightNormal,
  ABI49_0_0RNSVGFontWeightBold,
  ABI49_0_0RNSVGFontWeight100,
  ABI49_0_0RNSVGFontWeight200,
  ABI49_0_0RNSVGFontWeight300,
  ABI49_0_0RNSVGFontWeight400,
  ABI49_0_0RNSVGFontWeight500,
  ABI49_0_0RNSVGFontWeight600,
  ABI49_0_0RNSVGFontWeight700,
  ABI49_0_0RNSVGFontWeight800,
  ABI49_0_0RNSVGFontWeight900,
  // Relative
  ABI49_0_0RNSVGFontWeightBolder,
  ABI49_0_0RNSVGFontWeightLighter,
  ABI49_0_0RNSVGFontWeightDEFAULT = ABI49_0_0RNSVGFontWeightNormal,
};

static NSString *const ABI49_0_0RNSVGFontWeightStrings[] = {
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

static int const ABI49_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI49_0_0RNSVGFontWeight const ABI49_0_0RNSVGFontWeights[] = {
    ABI49_0_0RNSVGFontWeight100,
    ABI49_0_0RNSVGFontWeight100,
    ABI49_0_0RNSVGFontWeight200,
    ABI49_0_0RNSVGFontWeight300,
    ABI49_0_0RNSVGFontWeightNormal,
    ABI49_0_0RNSVGFontWeight500,
    ABI49_0_0RNSVGFontWeight600,
    ABI49_0_0RNSVGFontWeightBold,
    ABI49_0_0RNSVGFontWeight800,
    ABI49_0_0RNSVGFontWeight900,
    ABI49_0_0RNSVGFontWeight900};

NSString *ABI49_0_0RNSVGFontWeightToString(enum ABI49_0_0RNSVGFontWeight fw);

NSInteger ABI49_0_0RNSVGFontWeightFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGTextAnchor) {
  ABI49_0_0RNSVGTextAnchorStart,
  ABI49_0_0RNSVGTextAnchorMiddle,
  ABI49_0_0RNSVGTextAnchorEnd,
  ABI49_0_0RNSVGTextAnchorDEFAULT = ABI49_0_0RNSVGTextAnchorStart,
};

static NSString *const ABI49_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString *ABI49_0_0RNSVGTextAnchorToString(enum ABI49_0_0RNSVGTextAnchor fw);

enum ABI49_0_0RNSVGTextAnchor ABI49_0_0RNSVGTextAnchorFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGTextDecoration) {
  ABI49_0_0RNSVGTextDecorationNone,
  ABI49_0_0RNSVGTextDecorationUnderline,
  ABI49_0_0RNSVGTextDecorationOverline,
  ABI49_0_0RNSVGTextDecorationLineThrough,
  ABI49_0_0RNSVGTextDecorationBlink,
  ABI49_0_0RNSVGTextDecorationDEFAULT = ABI49_0_0RNSVGTextDecorationNone,
};

static NSString *const ABI49_0_0RNSVGTextDecorationStrings[] =
    {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString *ABI49_0_0RNSVGTextDecorationToString(enum ABI49_0_0RNSVGTextDecoration fw);

enum ABI49_0_0RNSVGTextDecoration ABI49_0_0RNSVGTextDecorationFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGTextLengthAdjust) {
  ABI49_0_0RNSVGTextLengthAdjustSpacing,
  ABI49_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
  ABI49_0_0RNSVGTextLengthAdjustDEFAULT = ABI49_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString *const ABI49_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString *ABI49_0_0RNSVGTextLengthAdjustToString(enum ABI49_0_0RNSVGTextLengthAdjust fw);

enum ABI49_0_0RNSVGTextLengthAdjust ABI49_0_0RNSVGTextLengthAdjustFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGTextPathMethod) {
  ABI49_0_0RNSVGTextPathMethodAlign,
  ABI49_0_0RNSVGTextPathMethodStretch,
  ABI49_0_0RNSVGTextPathMethodDEFAULT = ABI49_0_0RNSVGTextPathMethodAlign,
};

static NSString *const ABI49_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString *ABI49_0_0RNSVGTextPathMethodToString(enum ABI49_0_0RNSVGTextPathMethod fw);

enum ABI49_0_0RNSVGTextPathMethod ABI49_0_0RNSVGTextPathMethodFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGTextPathMidLine) {
  ABI49_0_0RNSVGTextPathMidLineSharp,
  ABI49_0_0RNSVGTextPathMidLineSmooth,
  ABI49_0_0RNSVGTextPathMidLineDEFAULT = ABI49_0_0RNSVGTextPathMidLineSharp,
};

static NSString *const ABI49_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString *ABI49_0_0RNSVGTextPathMidLineToString(enum ABI49_0_0RNSVGTextPathMidLine fw);

enum ABI49_0_0RNSVGTextPathMidLine ABI49_0_0RNSVGTextPathMidLineFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGTextPathSide) {
  ABI49_0_0RNSVGTextPathSideLeft,
  ABI49_0_0RNSVGTextPathSideRight,
  ABI49_0_0RNSVGTextPathSideDEFAULT = ABI49_0_0RNSVGTextPathSideLeft,
};

static NSString *const ABI49_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString *ABI49_0_0RNSVGTextPathSideToString(enum ABI49_0_0RNSVGTextPathSide fw);

enum ABI49_0_0RNSVGTextPathSide ABI49_0_0RNSVGTextPathSideFromString(NSString *s);

typedef NS_ENUM(NSInteger, ABI49_0_0RNSVGTextPathSpacing) {
  ABI49_0_0RNSVGTextPathSpacingAutoSpacing,
  ABI49_0_0RNSVGTextPathSpacingExact,
  ABI49_0_0RNSVGTextPathSpacingDEFAULT = ABI49_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString *const ABI49_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString *ABI49_0_0RNSVGTextPathSpacingToString(enum ABI49_0_0RNSVGTextPathSpacing fw);

enum ABI49_0_0RNSVGTextPathSpacing ABI49_0_0RNSVGTextPathSpacingFromString(NSString *s);

#endif
