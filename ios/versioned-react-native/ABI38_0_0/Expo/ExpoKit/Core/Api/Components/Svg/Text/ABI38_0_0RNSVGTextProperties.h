#import <Foundation/Foundation.h>

#ifndef ABI38_0_0RNTextProperties_h
#define ABI38_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGAlignmentBaseline) {
    ABI38_0_0RNSVGAlignmentBaselineBaseline,
    ABI38_0_0RNSVGAlignmentBaselineTextBottom,
    ABI38_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI38_0_0RNSVGAlignmentBaselineIdeographic,
    ABI38_0_0RNSVGAlignmentBaselineMiddle,
    ABI38_0_0RNSVGAlignmentBaselineCentral,
    ABI38_0_0RNSVGAlignmentBaselineMathematical,
    ABI38_0_0RNSVGAlignmentBaselineTextTop,
    ABI38_0_0RNSVGAlignmentBaselineBottom,
    ABI38_0_0RNSVGAlignmentBaselineCenter,
    ABI38_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI38_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI38_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI38_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI38_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI38_0_0RNSVGAlignmentBaselineHanging,
    ABI38_0_0RNSVGAlignmentBaselineDEFAULT = ABI38_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI38_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI38_0_0RNSVGAlignmentBaselineToString( enum ABI38_0_0RNSVGAlignmentBaseline fw );

enum ABI38_0_0RNSVGAlignmentBaseline ABI38_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGFontStyle) {
    ABI38_0_0RNSVGFontStyleNormal,
    ABI38_0_0RNSVGFontStyleItalic,
    ABI38_0_0RNSVGFontStyleOblique,
    ABI38_0_0RNSVGFontStyleDEFAULT = ABI38_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI38_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI38_0_0RNSVGFontStyleToString( enum ABI38_0_0RNSVGFontStyle fw );

enum ABI38_0_0RNSVGFontStyle ABI38_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGFontVariantLigatures) {
    ABI38_0_0RNSVGFontVariantLigaturesNormal,
    ABI38_0_0RNSVGFontVariantLigaturesNone,
    ABI38_0_0RNSVGFontVariantLigaturesDEFAULT = ABI38_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI38_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI38_0_0RNSVGFontVariantLigaturesToString( enum ABI38_0_0RNSVGFontVariantLigatures fw );

enum ABI38_0_0RNSVGFontVariantLigatures ABI38_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGFontWeight) {
    // Absolute
    ABI38_0_0RNSVGFontWeightNormal,
    ABI38_0_0RNSVGFontWeightBold,
    ABI38_0_0RNSVGFontWeight100,
    ABI38_0_0RNSVGFontWeight200,
    ABI38_0_0RNSVGFontWeight300,
    ABI38_0_0RNSVGFontWeight400,
    ABI38_0_0RNSVGFontWeight500,
    ABI38_0_0RNSVGFontWeight600,
    ABI38_0_0RNSVGFontWeight700,
    ABI38_0_0RNSVGFontWeight800,
    ABI38_0_0RNSVGFontWeight900,
    // Relative
    ABI38_0_0RNSVGFontWeightBolder,
    ABI38_0_0RNSVGFontWeightLighter,
    ABI38_0_0RNSVGFontWeightDEFAULT = ABI38_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI38_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI38_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI38_0_0RNSVGFontWeight const ABI38_0_0RNSVGFontWeights[] = {
    ABI38_0_0RNSVGFontWeight100,
    ABI38_0_0RNSVGFontWeight100,
    ABI38_0_0RNSVGFontWeight200,
    ABI38_0_0RNSVGFontWeight300,
    ABI38_0_0RNSVGFontWeightNormal,
    ABI38_0_0RNSVGFontWeight500,
    ABI38_0_0RNSVGFontWeight600,
    ABI38_0_0RNSVGFontWeightBold,
    ABI38_0_0RNSVGFontWeight800,
    ABI38_0_0RNSVGFontWeight900,
    ABI38_0_0RNSVGFontWeight900
};

NSString* ABI38_0_0RNSVGFontWeightToString( enum ABI38_0_0RNSVGFontWeight fw );

enum ABI38_0_0RNSVGFontWeight ABI38_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGTextAnchor) {
    ABI38_0_0RNSVGTextAnchorStart,
    ABI38_0_0RNSVGTextAnchorMiddle,
    ABI38_0_0RNSVGTextAnchorEnd,
    ABI38_0_0RNSVGTextAnchorDEFAULT = ABI38_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI38_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI38_0_0RNSVGTextAnchorToString( enum ABI38_0_0RNSVGTextAnchor fw );

enum ABI38_0_0RNSVGTextAnchor ABI38_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGTextDecoration) {
    ABI38_0_0RNSVGTextDecorationNone,
    ABI38_0_0RNSVGTextDecorationUnderline,
    ABI38_0_0RNSVGTextDecorationOverline,
    ABI38_0_0RNSVGTextDecorationLineThrough,
    ABI38_0_0RNSVGTextDecorationBlink,
    ABI38_0_0RNSVGTextDecorationDEFAULT = ABI38_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI38_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI38_0_0RNSVGTextDecorationToString( enum ABI38_0_0RNSVGTextDecoration fw );

enum ABI38_0_0RNSVGTextDecoration ABI38_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGTextLengthAdjust) {
    ABI38_0_0RNSVGTextLengthAdjustSpacing,
    ABI38_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI38_0_0RNSVGTextLengthAdjustDEFAULT = ABI38_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI38_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI38_0_0RNSVGTextLengthAdjustToString( enum ABI38_0_0RNSVGTextLengthAdjust fw );

enum ABI38_0_0RNSVGTextLengthAdjust ABI38_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGTextPathMethod) {
    ABI38_0_0RNSVGTextPathMethodAlign,
    ABI38_0_0RNSVGTextPathMethodStretch,
    ABI38_0_0RNSVGTextPathMethodDEFAULT = ABI38_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI38_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI38_0_0RNSVGTextPathMethodToString( enum ABI38_0_0RNSVGTextPathMethod fw );

enum ABI38_0_0RNSVGTextPathMethod ABI38_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGTextPathMidLine) {
    ABI38_0_0RNSVGTextPathMidLineSharp,
    ABI38_0_0RNSVGTextPathMidLineSmooth,
    ABI38_0_0RNSVGTextPathMidLineDEFAULT = ABI38_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI38_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI38_0_0RNSVGTextPathMidLineToString( enum ABI38_0_0RNSVGTextPathMidLine fw );

enum ABI38_0_0RNSVGTextPathMidLine ABI38_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGTextPathSide) {
    ABI38_0_0RNSVGTextPathSideLeft,
    ABI38_0_0RNSVGTextPathSideRight,
    ABI38_0_0RNSVGTextPathSideDEFAULT = ABI38_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI38_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI38_0_0RNSVGTextPathSideToString( enum ABI38_0_0RNSVGTextPathSide fw );

enum ABI38_0_0RNSVGTextPathSide ABI38_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI38_0_0RNSVGTextPathSpacing) {
    ABI38_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI38_0_0RNSVGTextPathSpacingExact,
    ABI38_0_0RNSVGTextPathSpacingDEFAULT = ABI38_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI38_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI38_0_0RNSVGTextPathSpacingToString( enum ABI38_0_0RNSVGTextPathSpacing fw );

enum ABI38_0_0RNSVGTextPathSpacing ABI38_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
