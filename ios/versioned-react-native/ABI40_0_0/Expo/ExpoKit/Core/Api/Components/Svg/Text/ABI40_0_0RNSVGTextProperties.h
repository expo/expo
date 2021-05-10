#import <Foundation/Foundation.h>

#ifndef ABI40_0_0RNTextProperties_h
#define ABI40_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGAlignmentBaseline) {
    ABI40_0_0RNSVGAlignmentBaselineBaseline,
    ABI40_0_0RNSVGAlignmentBaselineTextBottom,
    ABI40_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI40_0_0RNSVGAlignmentBaselineIdeographic,
    ABI40_0_0RNSVGAlignmentBaselineMiddle,
    ABI40_0_0RNSVGAlignmentBaselineCentral,
    ABI40_0_0RNSVGAlignmentBaselineMathematical,
    ABI40_0_0RNSVGAlignmentBaselineTextTop,
    ABI40_0_0RNSVGAlignmentBaselineBottom,
    ABI40_0_0RNSVGAlignmentBaselineCenter,
    ABI40_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI40_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI40_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI40_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI40_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI40_0_0RNSVGAlignmentBaselineHanging,
    ABI40_0_0RNSVGAlignmentBaselineDEFAULT = ABI40_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI40_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI40_0_0RNSVGAlignmentBaselineToString( enum ABI40_0_0RNSVGAlignmentBaseline fw );

enum ABI40_0_0RNSVGAlignmentBaseline ABI40_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGFontStyle) {
    ABI40_0_0RNSVGFontStyleNormal,
    ABI40_0_0RNSVGFontStyleItalic,
    ABI40_0_0RNSVGFontStyleOblique,
    ABI40_0_0RNSVGFontStyleDEFAULT = ABI40_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI40_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI40_0_0RNSVGFontStyleToString( enum ABI40_0_0RNSVGFontStyle fw );

enum ABI40_0_0RNSVGFontStyle ABI40_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGFontVariantLigatures) {
    ABI40_0_0RNSVGFontVariantLigaturesNormal,
    ABI40_0_0RNSVGFontVariantLigaturesNone,
    ABI40_0_0RNSVGFontVariantLigaturesDEFAULT = ABI40_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI40_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI40_0_0RNSVGFontVariantLigaturesToString( enum ABI40_0_0RNSVGFontVariantLigatures fw );

enum ABI40_0_0RNSVGFontVariantLigatures ABI40_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGFontWeight) {
    // Absolute
    ABI40_0_0RNSVGFontWeightNormal,
    ABI40_0_0RNSVGFontWeightBold,
    ABI40_0_0RNSVGFontWeight100,
    ABI40_0_0RNSVGFontWeight200,
    ABI40_0_0RNSVGFontWeight300,
    ABI40_0_0RNSVGFontWeight400,
    ABI40_0_0RNSVGFontWeight500,
    ABI40_0_0RNSVGFontWeight600,
    ABI40_0_0RNSVGFontWeight700,
    ABI40_0_0RNSVGFontWeight800,
    ABI40_0_0RNSVGFontWeight900,
    // Relative
    ABI40_0_0RNSVGFontWeightBolder,
    ABI40_0_0RNSVGFontWeightLighter,
    ABI40_0_0RNSVGFontWeightDEFAULT = ABI40_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI40_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI40_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI40_0_0RNSVGFontWeight const ABI40_0_0RNSVGFontWeights[] = {
    ABI40_0_0RNSVGFontWeight100,
    ABI40_0_0RNSVGFontWeight100,
    ABI40_0_0RNSVGFontWeight200,
    ABI40_0_0RNSVGFontWeight300,
    ABI40_0_0RNSVGFontWeightNormal,
    ABI40_0_0RNSVGFontWeight500,
    ABI40_0_0RNSVGFontWeight600,
    ABI40_0_0RNSVGFontWeightBold,
    ABI40_0_0RNSVGFontWeight800,
    ABI40_0_0RNSVGFontWeight900,
    ABI40_0_0RNSVGFontWeight900
};

NSString* ABI40_0_0RNSVGFontWeightToString( enum ABI40_0_0RNSVGFontWeight fw );

enum ABI40_0_0RNSVGFontWeight ABI40_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGTextAnchor) {
    ABI40_0_0RNSVGTextAnchorStart,
    ABI40_0_0RNSVGTextAnchorMiddle,
    ABI40_0_0RNSVGTextAnchorEnd,
    ABI40_0_0RNSVGTextAnchorDEFAULT = ABI40_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI40_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI40_0_0RNSVGTextAnchorToString( enum ABI40_0_0RNSVGTextAnchor fw );

enum ABI40_0_0RNSVGTextAnchor ABI40_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGTextDecoration) {
    ABI40_0_0RNSVGTextDecorationNone,
    ABI40_0_0RNSVGTextDecorationUnderline,
    ABI40_0_0RNSVGTextDecorationOverline,
    ABI40_0_0RNSVGTextDecorationLineThrough,
    ABI40_0_0RNSVGTextDecorationBlink,
    ABI40_0_0RNSVGTextDecorationDEFAULT = ABI40_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI40_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI40_0_0RNSVGTextDecorationToString( enum ABI40_0_0RNSVGTextDecoration fw );

enum ABI40_0_0RNSVGTextDecoration ABI40_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGTextLengthAdjust) {
    ABI40_0_0RNSVGTextLengthAdjustSpacing,
    ABI40_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI40_0_0RNSVGTextLengthAdjustDEFAULT = ABI40_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI40_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI40_0_0RNSVGTextLengthAdjustToString( enum ABI40_0_0RNSVGTextLengthAdjust fw );

enum ABI40_0_0RNSVGTextLengthAdjust ABI40_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGTextPathMethod) {
    ABI40_0_0RNSVGTextPathMethodAlign,
    ABI40_0_0RNSVGTextPathMethodStretch,
    ABI40_0_0RNSVGTextPathMethodDEFAULT = ABI40_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI40_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI40_0_0RNSVGTextPathMethodToString( enum ABI40_0_0RNSVGTextPathMethod fw );

enum ABI40_0_0RNSVGTextPathMethod ABI40_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGTextPathMidLine) {
    ABI40_0_0RNSVGTextPathMidLineSharp,
    ABI40_0_0RNSVGTextPathMidLineSmooth,
    ABI40_0_0RNSVGTextPathMidLineDEFAULT = ABI40_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI40_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI40_0_0RNSVGTextPathMidLineToString( enum ABI40_0_0RNSVGTextPathMidLine fw );

enum ABI40_0_0RNSVGTextPathMidLine ABI40_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGTextPathSide) {
    ABI40_0_0RNSVGTextPathSideLeft,
    ABI40_0_0RNSVGTextPathSideRight,
    ABI40_0_0RNSVGTextPathSideDEFAULT = ABI40_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI40_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI40_0_0RNSVGTextPathSideToString( enum ABI40_0_0RNSVGTextPathSide fw );

enum ABI40_0_0RNSVGTextPathSide ABI40_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI40_0_0RNSVGTextPathSpacing) {
    ABI40_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI40_0_0RNSVGTextPathSpacingExact,
    ABI40_0_0RNSVGTextPathSpacingDEFAULT = ABI40_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI40_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI40_0_0RNSVGTextPathSpacingToString( enum ABI40_0_0RNSVGTextPathSpacing fw );

enum ABI40_0_0RNSVGTextPathSpacing ABI40_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
