#import <Foundation/Foundation.h>

#ifndef ABI42_0_0RNTextProperties_h
#define ABI42_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGAlignmentBaseline) {
    ABI42_0_0RNSVGAlignmentBaselineBaseline,
    ABI42_0_0RNSVGAlignmentBaselineTextBottom,
    ABI42_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI42_0_0RNSVGAlignmentBaselineIdeographic,
    ABI42_0_0RNSVGAlignmentBaselineMiddle,
    ABI42_0_0RNSVGAlignmentBaselineCentral,
    ABI42_0_0RNSVGAlignmentBaselineMathematical,
    ABI42_0_0RNSVGAlignmentBaselineTextTop,
    ABI42_0_0RNSVGAlignmentBaselineBottom,
    ABI42_0_0RNSVGAlignmentBaselineCenter,
    ABI42_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI42_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI42_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI42_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI42_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI42_0_0RNSVGAlignmentBaselineHanging,
    ABI42_0_0RNSVGAlignmentBaselineDEFAULT = ABI42_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI42_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI42_0_0RNSVGAlignmentBaselineToString( enum ABI42_0_0RNSVGAlignmentBaseline fw );

enum ABI42_0_0RNSVGAlignmentBaseline ABI42_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGFontStyle) {
    ABI42_0_0RNSVGFontStyleNormal,
    ABI42_0_0RNSVGFontStyleItalic,
    ABI42_0_0RNSVGFontStyleOblique,
    ABI42_0_0RNSVGFontStyleDEFAULT = ABI42_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI42_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI42_0_0RNSVGFontStyleToString( enum ABI42_0_0RNSVGFontStyle fw );

enum ABI42_0_0RNSVGFontStyle ABI42_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGFontVariantLigatures) {
    ABI42_0_0RNSVGFontVariantLigaturesNormal,
    ABI42_0_0RNSVGFontVariantLigaturesNone,
    ABI42_0_0RNSVGFontVariantLigaturesDEFAULT = ABI42_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI42_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI42_0_0RNSVGFontVariantLigaturesToString( enum ABI42_0_0RNSVGFontVariantLigatures fw );

enum ABI42_0_0RNSVGFontVariantLigatures ABI42_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGFontWeight) {
    // Absolute
    ABI42_0_0RNSVGFontWeightNormal,
    ABI42_0_0RNSVGFontWeightBold,
    ABI42_0_0RNSVGFontWeight100,
    ABI42_0_0RNSVGFontWeight200,
    ABI42_0_0RNSVGFontWeight300,
    ABI42_0_0RNSVGFontWeight400,
    ABI42_0_0RNSVGFontWeight500,
    ABI42_0_0RNSVGFontWeight600,
    ABI42_0_0RNSVGFontWeight700,
    ABI42_0_0RNSVGFontWeight800,
    ABI42_0_0RNSVGFontWeight900,
    // Relative
    ABI42_0_0RNSVGFontWeightBolder,
    ABI42_0_0RNSVGFontWeightLighter,
    ABI42_0_0RNSVGFontWeightDEFAULT = ABI42_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI42_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI42_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI42_0_0RNSVGFontWeight const ABI42_0_0RNSVGFontWeights[] = {
    ABI42_0_0RNSVGFontWeight100,
    ABI42_0_0RNSVGFontWeight100,
    ABI42_0_0RNSVGFontWeight200,
    ABI42_0_0RNSVGFontWeight300,
    ABI42_0_0RNSVGFontWeightNormal,
    ABI42_0_0RNSVGFontWeight500,
    ABI42_0_0RNSVGFontWeight600,
    ABI42_0_0RNSVGFontWeightBold,
    ABI42_0_0RNSVGFontWeight800,
    ABI42_0_0RNSVGFontWeight900,
    ABI42_0_0RNSVGFontWeight900
};

NSString* ABI42_0_0RNSVGFontWeightToString( enum ABI42_0_0RNSVGFontWeight fw );

enum ABI42_0_0RNSVGFontWeight ABI42_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGTextAnchor) {
    ABI42_0_0RNSVGTextAnchorStart,
    ABI42_0_0RNSVGTextAnchorMiddle,
    ABI42_0_0RNSVGTextAnchorEnd,
    ABI42_0_0RNSVGTextAnchorDEFAULT = ABI42_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI42_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI42_0_0RNSVGTextAnchorToString( enum ABI42_0_0RNSVGTextAnchor fw );

enum ABI42_0_0RNSVGTextAnchor ABI42_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGTextDecoration) {
    ABI42_0_0RNSVGTextDecorationNone,
    ABI42_0_0RNSVGTextDecorationUnderline,
    ABI42_0_0RNSVGTextDecorationOverline,
    ABI42_0_0RNSVGTextDecorationLineThrough,
    ABI42_0_0RNSVGTextDecorationBlink,
    ABI42_0_0RNSVGTextDecorationDEFAULT = ABI42_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI42_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI42_0_0RNSVGTextDecorationToString( enum ABI42_0_0RNSVGTextDecoration fw );

enum ABI42_0_0RNSVGTextDecoration ABI42_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGTextLengthAdjust) {
    ABI42_0_0RNSVGTextLengthAdjustSpacing,
    ABI42_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI42_0_0RNSVGTextLengthAdjustDEFAULT = ABI42_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI42_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI42_0_0RNSVGTextLengthAdjustToString( enum ABI42_0_0RNSVGTextLengthAdjust fw );

enum ABI42_0_0RNSVGTextLengthAdjust ABI42_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGTextPathMethod) {
    ABI42_0_0RNSVGTextPathMethodAlign,
    ABI42_0_0RNSVGTextPathMethodStretch,
    ABI42_0_0RNSVGTextPathMethodDEFAULT = ABI42_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI42_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI42_0_0RNSVGTextPathMethodToString( enum ABI42_0_0RNSVGTextPathMethod fw );

enum ABI42_0_0RNSVGTextPathMethod ABI42_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGTextPathMidLine) {
    ABI42_0_0RNSVGTextPathMidLineSharp,
    ABI42_0_0RNSVGTextPathMidLineSmooth,
    ABI42_0_0RNSVGTextPathMidLineDEFAULT = ABI42_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI42_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI42_0_0RNSVGTextPathMidLineToString( enum ABI42_0_0RNSVGTextPathMidLine fw );

enum ABI42_0_0RNSVGTextPathMidLine ABI42_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGTextPathSide) {
    ABI42_0_0RNSVGTextPathSideLeft,
    ABI42_0_0RNSVGTextPathSideRight,
    ABI42_0_0RNSVGTextPathSideDEFAULT = ABI42_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI42_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI42_0_0RNSVGTextPathSideToString( enum ABI42_0_0RNSVGTextPathSide fw );

enum ABI42_0_0RNSVGTextPathSide ABI42_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI42_0_0RNSVGTextPathSpacing) {
    ABI42_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI42_0_0RNSVGTextPathSpacingExact,
    ABI42_0_0RNSVGTextPathSpacingDEFAULT = ABI42_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI42_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI42_0_0RNSVGTextPathSpacingToString( enum ABI42_0_0RNSVGTextPathSpacing fw );

enum ABI42_0_0RNSVGTextPathSpacing ABI42_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
