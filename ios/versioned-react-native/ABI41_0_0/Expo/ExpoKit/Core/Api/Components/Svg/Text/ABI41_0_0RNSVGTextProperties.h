#import <Foundation/Foundation.h>

#ifndef ABI41_0_0RNTextProperties_h
#define ABI41_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGAlignmentBaseline) {
    ABI41_0_0RNSVGAlignmentBaselineBaseline,
    ABI41_0_0RNSVGAlignmentBaselineTextBottom,
    ABI41_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI41_0_0RNSVGAlignmentBaselineIdeographic,
    ABI41_0_0RNSVGAlignmentBaselineMiddle,
    ABI41_0_0RNSVGAlignmentBaselineCentral,
    ABI41_0_0RNSVGAlignmentBaselineMathematical,
    ABI41_0_0RNSVGAlignmentBaselineTextTop,
    ABI41_0_0RNSVGAlignmentBaselineBottom,
    ABI41_0_0RNSVGAlignmentBaselineCenter,
    ABI41_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI41_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI41_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI41_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI41_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI41_0_0RNSVGAlignmentBaselineHanging,
    ABI41_0_0RNSVGAlignmentBaselineDEFAULT = ABI41_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI41_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI41_0_0RNSVGAlignmentBaselineToString( enum ABI41_0_0RNSVGAlignmentBaseline fw );

enum ABI41_0_0RNSVGAlignmentBaseline ABI41_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGFontStyle) {
    ABI41_0_0RNSVGFontStyleNormal,
    ABI41_0_0RNSVGFontStyleItalic,
    ABI41_0_0RNSVGFontStyleOblique,
    ABI41_0_0RNSVGFontStyleDEFAULT = ABI41_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI41_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI41_0_0RNSVGFontStyleToString( enum ABI41_0_0RNSVGFontStyle fw );

enum ABI41_0_0RNSVGFontStyle ABI41_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGFontVariantLigatures) {
    ABI41_0_0RNSVGFontVariantLigaturesNormal,
    ABI41_0_0RNSVGFontVariantLigaturesNone,
    ABI41_0_0RNSVGFontVariantLigaturesDEFAULT = ABI41_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI41_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI41_0_0RNSVGFontVariantLigaturesToString( enum ABI41_0_0RNSVGFontVariantLigatures fw );

enum ABI41_0_0RNSVGFontVariantLigatures ABI41_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGFontWeight) {
    // Absolute
    ABI41_0_0RNSVGFontWeightNormal,
    ABI41_0_0RNSVGFontWeightBold,
    ABI41_0_0RNSVGFontWeight100,
    ABI41_0_0RNSVGFontWeight200,
    ABI41_0_0RNSVGFontWeight300,
    ABI41_0_0RNSVGFontWeight400,
    ABI41_0_0RNSVGFontWeight500,
    ABI41_0_0RNSVGFontWeight600,
    ABI41_0_0RNSVGFontWeight700,
    ABI41_0_0RNSVGFontWeight800,
    ABI41_0_0RNSVGFontWeight900,
    // Relative
    ABI41_0_0RNSVGFontWeightBolder,
    ABI41_0_0RNSVGFontWeightLighter,
    ABI41_0_0RNSVGFontWeightDEFAULT = ABI41_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI41_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI41_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI41_0_0RNSVGFontWeight const ABI41_0_0RNSVGFontWeights[] = {
    ABI41_0_0RNSVGFontWeight100,
    ABI41_0_0RNSVGFontWeight100,
    ABI41_0_0RNSVGFontWeight200,
    ABI41_0_0RNSVGFontWeight300,
    ABI41_0_0RNSVGFontWeightNormal,
    ABI41_0_0RNSVGFontWeight500,
    ABI41_0_0RNSVGFontWeight600,
    ABI41_0_0RNSVGFontWeightBold,
    ABI41_0_0RNSVGFontWeight800,
    ABI41_0_0RNSVGFontWeight900,
    ABI41_0_0RNSVGFontWeight900
};

NSString* ABI41_0_0RNSVGFontWeightToString( enum ABI41_0_0RNSVGFontWeight fw );

enum ABI41_0_0RNSVGFontWeight ABI41_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGTextAnchor) {
    ABI41_0_0RNSVGTextAnchorStart,
    ABI41_0_0RNSVGTextAnchorMiddle,
    ABI41_0_0RNSVGTextAnchorEnd,
    ABI41_0_0RNSVGTextAnchorDEFAULT = ABI41_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI41_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI41_0_0RNSVGTextAnchorToString( enum ABI41_0_0RNSVGTextAnchor fw );

enum ABI41_0_0RNSVGTextAnchor ABI41_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGTextDecoration) {
    ABI41_0_0RNSVGTextDecorationNone,
    ABI41_0_0RNSVGTextDecorationUnderline,
    ABI41_0_0RNSVGTextDecorationOverline,
    ABI41_0_0RNSVGTextDecorationLineThrough,
    ABI41_0_0RNSVGTextDecorationBlink,
    ABI41_0_0RNSVGTextDecorationDEFAULT = ABI41_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI41_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI41_0_0RNSVGTextDecorationToString( enum ABI41_0_0RNSVGTextDecoration fw );

enum ABI41_0_0RNSVGTextDecoration ABI41_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGTextLengthAdjust) {
    ABI41_0_0RNSVGTextLengthAdjustSpacing,
    ABI41_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI41_0_0RNSVGTextLengthAdjustDEFAULT = ABI41_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI41_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI41_0_0RNSVGTextLengthAdjustToString( enum ABI41_0_0RNSVGTextLengthAdjust fw );

enum ABI41_0_0RNSVGTextLengthAdjust ABI41_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGTextPathMethod) {
    ABI41_0_0RNSVGTextPathMethodAlign,
    ABI41_0_0RNSVGTextPathMethodStretch,
    ABI41_0_0RNSVGTextPathMethodDEFAULT = ABI41_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI41_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI41_0_0RNSVGTextPathMethodToString( enum ABI41_0_0RNSVGTextPathMethod fw );

enum ABI41_0_0RNSVGTextPathMethod ABI41_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGTextPathMidLine) {
    ABI41_0_0RNSVGTextPathMidLineSharp,
    ABI41_0_0RNSVGTextPathMidLineSmooth,
    ABI41_0_0RNSVGTextPathMidLineDEFAULT = ABI41_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI41_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI41_0_0RNSVGTextPathMidLineToString( enum ABI41_0_0RNSVGTextPathMidLine fw );

enum ABI41_0_0RNSVGTextPathMidLine ABI41_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGTextPathSide) {
    ABI41_0_0RNSVGTextPathSideLeft,
    ABI41_0_0RNSVGTextPathSideRight,
    ABI41_0_0RNSVGTextPathSideDEFAULT = ABI41_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI41_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI41_0_0RNSVGTextPathSideToString( enum ABI41_0_0RNSVGTextPathSide fw );

enum ABI41_0_0RNSVGTextPathSide ABI41_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI41_0_0RNSVGTextPathSpacing) {
    ABI41_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI41_0_0RNSVGTextPathSpacingExact,
    ABI41_0_0RNSVGTextPathSpacingDEFAULT = ABI41_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI41_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI41_0_0RNSVGTextPathSpacingToString( enum ABI41_0_0RNSVGTextPathSpacing fw );

enum ABI41_0_0RNSVGTextPathSpacing ABI41_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
