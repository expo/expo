#import <Foundation/Foundation.h>

#ifndef ABI37_0_0RNTextProperties_h
#define ABI37_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGAlignmentBaseline) {
    ABI37_0_0RNSVGAlignmentBaselineBaseline,
    ABI37_0_0RNSVGAlignmentBaselineTextBottom,
    ABI37_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI37_0_0RNSVGAlignmentBaselineIdeographic,
    ABI37_0_0RNSVGAlignmentBaselineMiddle,
    ABI37_0_0RNSVGAlignmentBaselineCentral,
    ABI37_0_0RNSVGAlignmentBaselineMathematical,
    ABI37_0_0RNSVGAlignmentBaselineTextTop,
    ABI37_0_0RNSVGAlignmentBaselineBottom,
    ABI37_0_0RNSVGAlignmentBaselineCenter,
    ABI37_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI37_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI37_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI37_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI37_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI37_0_0RNSVGAlignmentBaselineHanging,
    ABI37_0_0RNSVGAlignmentBaselineDEFAULT = ABI37_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI37_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI37_0_0RNSVGAlignmentBaselineToString( enum ABI37_0_0RNSVGAlignmentBaseline fw );

enum ABI37_0_0RNSVGAlignmentBaseline ABI37_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGFontStyle) {
    ABI37_0_0RNSVGFontStyleNormal,
    ABI37_0_0RNSVGFontStyleItalic,
    ABI37_0_0RNSVGFontStyleOblique,
    ABI37_0_0RNSVGFontStyleDEFAULT = ABI37_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI37_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI37_0_0RNSVGFontStyleToString( enum ABI37_0_0RNSVGFontStyle fw );

enum ABI37_0_0RNSVGFontStyle ABI37_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGFontVariantLigatures) {
    ABI37_0_0RNSVGFontVariantLigaturesNormal,
    ABI37_0_0RNSVGFontVariantLigaturesNone,
    ABI37_0_0RNSVGFontVariantLigaturesDEFAULT = ABI37_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI37_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI37_0_0RNSVGFontVariantLigaturesToString( enum ABI37_0_0RNSVGFontVariantLigatures fw );

enum ABI37_0_0RNSVGFontVariantLigatures ABI37_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGFontWeight) {
    // Absolute
    ABI37_0_0RNSVGFontWeightNormal,
    ABI37_0_0RNSVGFontWeightBold,
    ABI37_0_0RNSVGFontWeight100,
    ABI37_0_0RNSVGFontWeight200,
    ABI37_0_0RNSVGFontWeight300,
    ABI37_0_0RNSVGFontWeight400,
    ABI37_0_0RNSVGFontWeight500,
    ABI37_0_0RNSVGFontWeight600,
    ABI37_0_0RNSVGFontWeight700,
    ABI37_0_0RNSVGFontWeight800,
    ABI37_0_0RNSVGFontWeight900,
    // Relative
    ABI37_0_0RNSVGFontWeightBolder,
    ABI37_0_0RNSVGFontWeightLighter,
    ABI37_0_0RNSVGFontWeightDEFAULT = ABI37_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI37_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI37_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI37_0_0RNSVGFontWeight const ABI37_0_0RNSVGFontWeights[] = {
    ABI37_0_0RNSVGFontWeight100,
    ABI37_0_0RNSVGFontWeight100,
    ABI37_0_0RNSVGFontWeight200,
    ABI37_0_0RNSVGFontWeight300,
    ABI37_0_0RNSVGFontWeightNormal,
    ABI37_0_0RNSVGFontWeight500,
    ABI37_0_0RNSVGFontWeight600,
    ABI37_0_0RNSVGFontWeightBold,
    ABI37_0_0RNSVGFontWeight800,
    ABI37_0_0RNSVGFontWeight900,
    ABI37_0_0RNSVGFontWeight900
};

NSString* ABI37_0_0RNSVGFontWeightToString( enum ABI37_0_0RNSVGFontWeight fw );

enum ABI37_0_0RNSVGFontWeight ABI37_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGTextAnchor) {
    ABI37_0_0RNSVGTextAnchorStart,
    ABI37_0_0RNSVGTextAnchorMiddle,
    ABI37_0_0RNSVGTextAnchorEnd,
    ABI37_0_0RNSVGTextAnchorDEFAULT = ABI37_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI37_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI37_0_0RNSVGTextAnchorToString( enum ABI37_0_0RNSVGTextAnchor fw );

enum ABI37_0_0RNSVGTextAnchor ABI37_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGTextDecoration) {
    ABI37_0_0RNSVGTextDecorationNone,
    ABI37_0_0RNSVGTextDecorationUnderline,
    ABI37_0_0RNSVGTextDecorationOverline,
    ABI37_0_0RNSVGTextDecorationLineThrough,
    ABI37_0_0RNSVGTextDecorationBlink,
    ABI37_0_0RNSVGTextDecorationDEFAULT = ABI37_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI37_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI37_0_0RNSVGTextDecorationToString( enum ABI37_0_0RNSVGTextDecoration fw );

enum ABI37_0_0RNSVGTextDecoration ABI37_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGTextLengthAdjust) {
    ABI37_0_0RNSVGTextLengthAdjustSpacing,
    ABI37_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI37_0_0RNSVGTextLengthAdjustDEFAULT = ABI37_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI37_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI37_0_0RNSVGTextLengthAdjustToString( enum ABI37_0_0RNSVGTextLengthAdjust fw );

enum ABI37_0_0RNSVGTextLengthAdjust ABI37_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGTextPathMethod) {
    ABI37_0_0RNSVGTextPathMethodAlign,
    ABI37_0_0RNSVGTextPathMethodStretch,
    ABI37_0_0RNSVGTextPathMethodDEFAULT = ABI37_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI37_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI37_0_0RNSVGTextPathMethodToString( enum ABI37_0_0RNSVGTextPathMethod fw );

enum ABI37_0_0RNSVGTextPathMethod ABI37_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGTextPathMidLine) {
    ABI37_0_0RNSVGTextPathMidLineSharp,
    ABI37_0_0RNSVGTextPathMidLineSmooth,
    ABI37_0_0RNSVGTextPathMidLineDEFAULT = ABI37_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI37_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI37_0_0RNSVGTextPathMidLineToString( enum ABI37_0_0RNSVGTextPathMidLine fw );

enum ABI37_0_0RNSVGTextPathMidLine ABI37_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGTextPathSide) {
    ABI37_0_0RNSVGTextPathSideLeft,
    ABI37_0_0RNSVGTextPathSideRight,
    ABI37_0_0RNSVGTextPathSideDEFAULT = ABI37_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI37_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI37_0_0RNSVGTextPathSideToString( enum ABI37_0_0RNSVGTextPathSide fw );

enum ABI37_0_0RNSVGTextPathSide ABI37_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI37_0_0RNSVGTextPathSpacing) {
    ABI37_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI37_0_0RNSVGTextPathSpacingExact,
    ABI37_0_0RNSVGTextPathSpacingDEFAULT = ABI37_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI37_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI37_0_0RNSVGTextPathSpacingToString( enum ABI37_0_0RNSVGTextPathSpacing fw );

enum ABI37_0_0RNSVGTextPathSpacing ABI37_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
