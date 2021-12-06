#import <Foundation/Foundation.h>

#ifndef ABI44_0_0RNTextProperties_h
#define ABI44_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGAlignmentBaseline) {
    ABI44_0_0RNSVGAlignmentBaselineBaseline,
    ABI44_0_0RNSVGAlignmentBaselineTextBottom,
    ABI44_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI44_0_0RNSVGAlignmentBaselineIdeographic,
    ABI44_0_0RNSVGAlignmentBaselineMiddle,
    ABI44_0_0RNSVGAlignmentBaselineCentral,
    ABI44_0_0RNSVGAlignmentBaselineMathematical,
    ABI44_0_0RNSVGAlignmentBaselineTextTop,
    ABI44_0_0RNSVGAlignmentBaselineBottom,
    ABI44_0_0RNSVGAlignmentBaselineCenter,
    ABI44_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI44_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI44_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI44_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI44_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI44_0_0RNSVGAlignmentBaselineHanging,
    ABI44_0_0RNSVGAlignmentBaselineDEFAULT = ABI44_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI44_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI44_0_0RNSVGAlignmentBaselineToString( enum ABI44_0_0RNSVGAlignmentBaseline fw );

enum ABI44_0_0RNSVGAlignmentBaseline ABI44_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGFontStyle) {
    ABI44_0_0RNSVGFontStyleNormal,
    ABI44_0_0RNSVGFontStyleItalic,
    ABI44_0_0RNSVGFontStyleOblique,
    ABI44_0_0RNSVGFontStyleDEFAULT = ABI44_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI44_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI44_0_0RNSVGFontStyleToString( enum ABI44_0_0RNSVGFontStyle fw );

enum ABI44_0_0RNSVGFontStyle ABI44_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGFontVariantLigatures) {
    ABI44_0_0RNSVGFontVariantLigaturesNormal,
    ABI44_0_0RNSVGFontVariantLigaturesNone,
    ABI44_0_0RNSVGFontVariantLigaturesDEFAULT = ABI44_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI44_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI44_0_0RNSVGFontVariantLigaturesToString( enum ABI44_0_0RNSVGFontVariantLigatures fw );

enum ABI44_0_0RNSVGFontVariantLigatures ABI44_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGFontWeight) {
    // Absolute
    ABI44_0_0RNSVGFontWeightNormal,
    ABI44_0_0RNSVGFontWeightBold,
    ABI44_0_0RNSVGFontWeight100,
    ABI44_0_0RNSVGFontWeight200,
    ABI44_0_0RNSVGFontWeight300,
    ABI44_0_0RNSVGFontWeight400,
    ABI44_0_0RNSVGFontWeight500,
    ABI44_0_0RNSVGFontWeight600,
    ABI44_0_0RNSVGFontWeight700,
    ABI44_0_0RNSVGFontWeight800,
    ABI44_0_0RNSVGFontWeight900,
    // Relative
    ABI44_0_0RNSVGFontWeightBolder,
    ABI44_0_0RNSVGFontWeightLighter,
    ABI44_0_0RNSVGFontWeightDEFAULT = ABI44_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI44_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI44_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI44_0_0RNSVGFontWeight const ABI44_0_0RNSVGFontWeights[] = {
    ABI44_0_0RNSVGFontWeight100,
    ABI44_0_0RNSVGFontWeight100,
    ABI44_0_0RNSVGFontWeight200,
    ABI44_0_0RNSVGFontWeight300,
    ABI44_0_0RNSVGFontWeightNormal,
    ABI44_0_0RNSVGFontWeight500,
    ABI44_0_0RNSVGFontWeight600,
    ABI44_0_0RNSVGFontWeightBold,
    ABI44_0_0RNSVGFontWeight800,
    ABI44_0_0RNSVGFontWeight900,
    ABI44_0_0RNSVGFontWeight900
};

NSString* ABI44_0_0RNSVGFontWeightToString( enum ABI44_0_0RNSVGFontWeight fw );

enum ABI44_0_0RNSVGFontWeight ABI44_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGTextAnchor) {
    ABI44_0_0RNSVGTextAnchorStart,
    ABI44_0_0RNSVGTextAnchorMiddle,
    ABI44_0_0RNSVGTextAnchorEnd,
    ABI44_0_0RNSVGTextAnchorDEFAULT = ABI44_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI44_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI44_0_0RNSVGTextAnchorToString( enum ABI44_0_0RNSVGTextAnchor fw );

enum ABI44_0_0RNSVGTextAnchor ABI44_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGTextDecoration) {
    ABI44_0_0RNSVGTextDecorationNone,
    ABI44_0_0RNSVGTextDecorationUnderline,
    ABI44_0_0RNSVGTextDecorationOverline,
    ABI44_0_0RNSVGTextDecorationLineThrough,
    ABI44_0_0RNSVGTextDecorationBlink,
    ABI44_0_0RNSVGTextDecorationDEFAULT = ABI44_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI44_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI44_0_0RNSVGTextDecorationToString( enum ABI44_0_0RNSVGTextDecoration fw );

enum ABI44_0_0RNSVGTextDecoration ABI44_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGTextLengthAdjust) {
    ABI44_0_0RNSVGTextLengthAdjustSpacing,
    ABI44_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI44_0_0RNSVGTextLengthAdjustDEFAULT = ABI44_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI44_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI44_0_0RNSVGTextLengthAdjustToString( enum ABI44_0_0RNSVGTextLengthAdjust fw );

enum ABI44_0_0RNSVGTextLengthAdjust ABI44_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGTextPathMethod) {
    ABI44_0_0RNSVGTextPathMethodAlign,
    ABI44_0_0RNSVGTextPathMethodStretch,
    ABI44_0_0RNSVGTextPathMethodDEFAULT = ABI44_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI44_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI44_0_0RNSVGTextPathMethodToString( enum ABI44_0_0RNSVGTextPathMethod fw );

enum ABI44_0_0RNSVGTextPathMethod ABI44_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGTextPathMidLine) {
    ABI44_0_0RNSVGTextPathMidLineSharp,
    ABI44_0_0RNSVGTextPathMidLineSmooth,
    ABI44_0_0RNSVGTextPathMidLineDEFAULT = ABI44_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI44_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI44_0_0RNSVGTextPathMidLineToString( enum ABI44_0_0RNSVGTextPathMidLine fw );

enum ABI44_0_0RNSVGTextPathMidLine ABI44_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGTextPathSide) {
    ABI44_0_0RNSVGTextPathSideLeft,
    ABI44_0_0RNSVGTextPathSideRight,
    ABI44_0_0RNSVGTextPathSideDEFAULT = ABI44_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI44_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI44_0_0RNSVGTextPathSideToString( enum ABI44_0_0RNSVGTextPathSide fw );

enum ABI44_0_0RNSVGTextPathSide ABI44_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI44_0_0RNSVGTextPathSpacing) {
    ABI44_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI44_0_0RNSVGTextPathSpacingExact,
    ABI44_0_0RNSVGTextPathSpacingDEFAULT = ABI44_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI44_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI44_0_0RNSVGTextPathSpacingToString( enum ABI44_0_0RNSVGTextPathSpacing fw );

enum ABI44_0_0RNSVGTextPathSpacing ABI44_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
