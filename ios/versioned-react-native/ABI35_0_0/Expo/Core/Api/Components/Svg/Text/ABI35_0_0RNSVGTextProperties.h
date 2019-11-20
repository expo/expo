#import <Foundation/Foundation.h>

#ifndef ABI35_0_0RNTextProperties_h
#define ABI35_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGAlignmentBaseline) {
    ABI35_0_0RNSVGAlignmentBaselineBaseline,
    ABI35_0_0RNSVGAlignmentBaselineTextBottom,
    ABI35_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI35_0_0RNSVGAlignmentBaselineIdeographic,
    ABI35_0_0RNSVGAlignmentBaselineMiddle,
    ABI35_0_0RNSVGAlignmentBaselineCentral,
    ABI35_0_0RNSVGAlignmentBaselineMathematical,
    ABI35_0_0RNSVGAlignmentBaselineTextTop,
    ABI35_0_0RNSVGAlignmentBaselineBottom,
    ABI35_0_0RNSVGAlignmentBaselineCenter,
    ABI35_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI35_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI35_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI35_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI35_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI35_0_0RNSVGAlignmentBaselineHanging,
    ABI35_0_0RNSVGAlignmentBaselineDEFAULT = ABI35_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI35_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI35_0_0RNSVGAlignmentBaselineToString( enum ABI35_0_0RNSVGAlignmentBaseline fw );

enum ABI35_0_0RNSVGAlignmentBaseline ABI35_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGFontStyle) {
    ABI35_0_0RNSVGFontStyleNormal,
    ABI35_0_0RNSVGFontStyleItalic,
    ABI35_0_0RNSVGFontStyleOblique,
    ABI35_0_0RNSVGFontStyleDEFAULT = ABI35_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI35_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI35_0_0RNSVGFontStyleToString( enum ABI35_0_0RNSVGFontStyle fw );

enum ABI35_0_0RNSVGFontStyle ABI35_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGFontVariantLigatures) {
    ABI35_0_0RNSVGFontVariantLigaturesNormal,
    ABI35_0_0RNSVGFontVariantLigaturesNone,
    ABI35_0_0RNSVGFontVariantLigaturesDEFAULT = ABI35_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI35_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI35_0_0RNSVGFontVariantLigaturesToString( enum ABI35_0_0RNSVGFontVariantLigatures fw );

enum ABI35_0_0RNSVGFontVariantLigatures ABI35_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGFontWeight) {
    // Absolute
    ABI35_0_0RNSVGFontWeightNormal,
    ABI35_0_0RNSVGFontWeightBold,
    ABI35_0_0RNSVGFontWeight100,
    ABI35_0_0RNSVGFontWeight200,
    ABI35_0_0RNSVGFontWeight300,
    ABI35_0_0RNSVGFontWeight400,
    ABI35_0_0RNSVGFontWeight500,
    ABI35_0_0RNSVGFontWeight600,
    ABI35_0_0RNSVGFontWeight700,
    ABI35_0_0RNSVGFontWeight800,
    ABI35_0_0RNSVGFontWeight900,
    // Relative
    ABI35_0_0RNSVGFontWeightBolder,
    ABI35_0_0RNSVGFontWeightLighter,
    ABI35_0_0RNSVGFontWeightDEFAULT = ABI35_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI35_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI35_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI35_0_0RNSVGFontWeight const ABI35_0_0RNSVGFontWeights[] = {
    ABI35_0_0RNSVGFontWeight100,
    ABI35_0_0RNSVGFontWeight100,
    ABI35_0_0RNSVGFontWeight200,
    ABI35_0_0RNSVGFontWeight300,
    ABI35_0_0RNSVGFontWeightNormal,
    ABI35_0_0RNSVGFontWeight500,
    ABI35_0_0RNSVGFontWeight600,
    ABI35_0_0RNSVGFontWeightBold,
    ABI35_0_0RNSVGFontWeight800,
    ABI35_0_0RNSVGFontWeight900,
    ABI35_0_0RNSVGFontWeight900
};

NSString* ABI35_0_0RNSVGFontWeightToString( enum ABI35_0_0RNSVGFontWeight fw );

enum ABI35_0_0RNSVGFontWeight ABI35_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGTextAnchor) {
    ABI35_0_0RNSVGTextAnchorStart,
    ABI35_0_0RNSVGTextAnchorMiddle,
    ABI35_0_0RNSVGTextAnchorEnd,
    ABI35_0_0RNSVGTextAnchorDEFAULT = ABI35_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI35_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI35_0_0RNSVGTextAnchorToString( enum ABI35_0_0RNSVGTextAnchor fw );

enum ABI35_0_0RNSVGTextAnchor ABI35_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGTextDecoration) {
    ABI35_0_0RNSVGTextDecorationNone,
    ABI35_0_0RNSVGTextDecorationUnderline,
    ABI35_0_0RNSVGTextDecorationOverline,
    ABI35_0_0RNSVGTextDecorationLineThrough,
    ABI35_0_0RNSVGTextDecorationBlink,
    ABI35_0_0RNSVGTextDecorationDEFAULT = ABI35_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI35_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI35_0_0RNSVGTextDecorationToString( enum ABI35_0_0RNSVGTextDecoration fw );

enum ABI35_0_0RNSVGTextDecoration ABI35_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGTextLengthAdjust) {
    ABI35_0_0RNSVGTextLengthAdjustSpacing,
    ABI35_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI35_0_0RNSVGTextLengthAdjustDEFAULT = ABI35_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI35_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI35_0_0RNSVGTextLengthAdjustToString( enum ABI35_0_0RNSVGTextLengthAdjust fw );

enum ABI35_0_0RNSVGTextLengthAdjust ABI35_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGTextPathMethod) {
    ABI35_0_0RNSVGTextPathMethodAlign,
    ABI35_0_0RNSVGTextPathMethodStretch,
    ABI35_0_0RNSVGTextPathMethodDEFAULT = ABI35_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI35_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI35_0_0RNSVGTextPathMethodToString( enum ABI35_0_0RNSVGTextPathMethod fw );

enum ABI35_0_0RNSVGTextPathMethod ABI35_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGTextPathMidLine) {
    ABI35_0_0RNSVGTextPathMidLineSharp,
    ABI35_0_0RNSVGTextPathMidLineSmooth,
    ABI35_0_0RNSVGTextPathMidLineDEFAULT = ABI35_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI35_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI35_0_0RNSVGTextPathMidLineToString( enum ABI35_0_0RNSVGTextPathMidLine fw );

enum ABI35_0_0RNSVGTextPathMidLine ABI35_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGTextPathSide) {
    ABI35_0_0RNSVGTextPathSideLeft,
    ABI35_0_0RNSVGTextPathSideRight,
    ABI35_0_0RNSVGTextPathSideDEFAULT = ABI35_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI35_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI35_0_0RNSVGTextPathSideToString( enum ABI35_0_0RNSVGTextPathSide fw );

enum ABI35_0_0RNSVGTextPathSide ABI35_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI35_0_0RNSVGTextPathSpacing) {
    ABI35_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI35_0_0RNSVGTextPathSpacingExact,
    ABI35_0_0RNSVGTextPathSpacingDEFAULT = ABI35_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI35_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI35_0_0RNSVGTextPathSpacingToString( enum ABI35_0_0RNSVGTextPathSpacing fw );

enum ABI35_0_0RNSVGTextPathSpacing ABI35_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
