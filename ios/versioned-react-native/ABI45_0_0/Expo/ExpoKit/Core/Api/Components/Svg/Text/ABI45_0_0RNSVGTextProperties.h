#import <Foundation/Foundation.h>

#ifndef ABI45_0_0RNTextProperties_h
#define ABI45_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGAlignmentBaseline) {
    ABI45_0_0RNSVGAlignmentBaselineBaseline,
    ABI45_0_0RNSVGAlignmentBaselineTextBottom,
    ABI45_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI45_0_0RNSVGAlignmentBaselineIdeographic,
    ABI45_0_0RNSVGAlignmentBaselineMiddle,
    ABI45_0_0RNSVGAlignmentBaselineCentral,
    ABI45_0_0RNSVGAlignmentBaselineMathematical,
    ABI45_0_0RNSVGAlignmentBaselineTextTop,
    ABI45_0_0RNSVGAlignmentBaselineBottom,
    ABI45_0_0RNSVGAlignmentBaselineCenter,
    ABI45_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI45_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI45_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI45_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI45_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI45_0_0RNSVGAlignmentBaselineHanging,
    ABI45_0_0RNSVGAlignmentBaselineDEFAULT = ABI45_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI45_0_0RNSVGAlignmentBaselineStrings[] = {
    @"baseline",
    @"text-bottom",
    @"alphabetic",
    @"ideographic",
    @"middle",
    @"central",
    @"mathematical",
    @"text-top",
    @"bottom",
    @"center",
    @"top",
    @"text-before-edge",
    @"text-after-edge",
    @"before-edge",
    @"after-edge",
    @"hanging",
    @"central",
    @"mathematical",
    @"text-top",
    @"bottom",
    @"center",
    @"top",
    nil
};

NSString* ABI45_0_0RNSVGAlignmentBaselineToString( enum ABI45_0_0RNSVGAlignmentBaseline fw );

enum ABI45_0_0RNSVGAlignmentBaseline ABI45_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGFontStyle) {
    ABI45_0_0RNSVGFontStyleNormal,
    ABI45_0_0RNSVGFontStyleItalic,
    ABI45_0_0RNSVGFontStyleOblique,
    ABI45_0_0RNSVGFontStyleDEFAULT = ABI45_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI45_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI45_0_0RNSVGFontStyleToString( enum ABI45_0_0RNSVGFontStyle fw );

enum ABI45_0_0RNSVGFontStyle ABI45_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGFontVariantLigatures) {
    ABI45_0_0RNSVGFontVariantLigaturesNormal,
    ABI45_0_0RNSVGFontVariantLigaturesNone,
    ABI45_0_0RNSVGFontVariantLigaturesDEFAULT = ABI45_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI45_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI45_0_0RNSVGFontVariantLigaturesToString( enum ABI45_0_0RNSVGFontVariantLigatures fw );

enum ABI45_0_0RNSVGFontVariantLigatures ABI45_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGFontWeight) {
    // Absolute
    ABI45_0_0RNSVGFontWeightNormal,
    ABI45_0_0RNSVGFontWeightBold,
    ABI45_0_0RNSVGFontWeight100,
    ABI45_0_0RNSVGFontWeight200,
    ABI45_0_0RNSVGFontWeight300,
    ABI45_0_0RNSVGFontWeight400,
    ABI45_0_0RNSVGFontWeight500,
    ABI45_0_0RNSVGFontWeight600,
    ABI45_0_0RNSVGFontWeight700,
    ABI45_0_0RNSVGFontWeight800,
    ABI45_0_0RNSVGFontWeight900,
    // Relative
    ABI45_0_0RNSVGFontWeightBolder,
    ABI45_0_0RNSVGFontWeightLighter,
    ABI45_0_0RNSVGFontWeightDEFAULT = ABI45_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI45_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI45_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI45_0_0RNSVGFontWeight const ABI45_0_0RNSVGFontWeights[] = {
    ABI45_0_0RNSVGFontWeight100,
    ABI45_0_0RNSVGFontWeight100,
    ABI45_0_0RNSVGFontWeight200,
    ABI45_0_0RNSVGFontWeight300,
    ABI45_0_0RNSVGFontWeightNormal,
    ABI45_0_0RNSVGFontWeight500,
    ABI45_0_0RNSVGFontWeight600,
    ABI45_0_0RNSVGFontWeightBold,
    ABI45_0_0RNSVGFontWeight800,
    ABI45_0_0RNSVGFontWeight900,
    ABI45_0_0RNSVGFontWeight900
};

NSString* ABI45_0_0RNSVGFontWeightToString( enum ABI45_0_0RNSVGFontWeight fw );

enum ABI45_0_0RNSVGFontWeight ABI45_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGTextAnchor) {
    ABI45_0_0RNSVGTextAnchorStart,
    ABI45_0_0RNSVGTextAnchorMiddle,
    ABI45_0_0RNSVGTextAnchorEnd,
    ABI45_0_0RNSVGTextAnchorDEFAULT = ABI45_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI45_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI45_0_0RNSVGTextAnchorToString( enum ABI45_0_0RNSVGTextAnchor fw );

enum ABI45_0_0RNSVGTextAnchor ABI45_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGTextDecoration) {
    ABI45_0_0RNSVGTextDecorationNone,
    ABI45_0_0RNSVGTextDecorationUnderline,
    ABI45_0_0RNSVGTextDecorationOverline,
    ABI45_0_0RNSVGTextDecorationLineThrough,
    ABI45_0_0RNSVGTextDecorationBlink,
    ABI45_0_0RNSVGTextDecorationDEFAULT = ABI45_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI45_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI45_0_0RNSVGTextDecorationToString( enum ABI45_0_0RNSVGTextDecoration fw );

enum ABI45_0_0RNSVGTextDecoration ABI45_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGTextLengthAdjust) {
    ABI45_0_0RNSVGTextLengthAdjustSpacing,
    ABI45_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI45_0_0RNSVGTextLengthAdjustDEFAULT = ABI45_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI45_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI45_0_0RNSVGTextLengthAdjustToString( enum ABI45_0_0RNSVGTextLengthAdjust fw );

enum ABI45_0_0RNSVGTextLengthAdjust ABI45_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGTextPathMethod) {
    ABI45_0_0RNSVGTextPathMethodAlign,
    ABI45_0_0RNSVGTextPathMethodStretch,
    ABI45_0_0RNSVGTextPathMethodDEFAULT = ABI45_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI45_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI45_0_0RNSVGTextPathMethodToString( enum ABI45_0_0RNSVGTextPathMethod fw );

enum ABI45_0_0RNSVGTextPathMethod ABI45_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGTextPathMidLine) {
    ABI45_0_0RNSVGTextPathMidLineSharp,
    ABI45_0_0RNSVGTextPathMidLineSmooth,
    ABI45_0_0RNSVGTextPathMidLineDEFAULT = ABI45_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI45_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI45_0_0RNSVGTextPathMidLineToString( enum ABI45_0_0RNSVGTextPathMidLine fw );

enum ABI45_0_0RNSVGTextPathMidLine ABI45_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGTextPathSide) {
    ABI45_0_0RNSVGTextPathSideLeft,
    ABI45_0_0RNSVGTextPathSideRight,
    ABI45_0_0RNSVGTextPathSideDEFAULT = ABI45_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI45_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI45_0_0RNSVGTextPathSideToString( enum ABI45_0_0RNSVGTextPathSide fw );

enum ABI45_0_0RNSVGTextPathSide ABI45_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI45_0_0RNSVGTextPathSpacing) {
    ABI45_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI45_0_0RNSVGTextPathSpacingExact,
    ABI45_0_0RNSVGTextPathSpacingDEFAULT = ABI45_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI45_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI45_0_0RNSVGTextPathSpacingToString( enum ABI45_0_0RNSVGTextPathSpacing fw );

enum ABI45_0_0RNSVGTextPathSpacing ABI45_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
