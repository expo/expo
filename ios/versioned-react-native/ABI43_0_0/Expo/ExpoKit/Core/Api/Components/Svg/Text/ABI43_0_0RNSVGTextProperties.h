#import <Foundation/Foundation.h>

#ifndef ABI43_0_0RNTextProperties_h
#define ABI43_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGAlignmentBaseline) {
    ABI43_0_0RNSVGAlignmentBaselineBaseline,
    ABI43_0_0RNSVGAlignmentBaselineTextBottom,
    ABI43_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI43_0_0RNSVGAlignmentBaselineIdeographic,
    ABI43_0_0RNSVGAlignmentBaselineMiddle,
    ABI43_0_0RNSVGAlignmentBaselineCentral,
    ABI43_0_0RNSVGAlignmentBaselineMathematical,
    ABI43_0_0RNSVGAlignmentBaselineTextTop,
    ABI43_0_0RNSVGAlignmentBaselineBottom,
    ABI43_0_0RNSVGAlignmentBaselineCenter,
    ABI43_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI43_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI43_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI43_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI43_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI43_0_0RNSVGAlignmentBaselineHanging,
    ABI43_0_0RNSVGAlignmentBaselineDEFAULT = ABI43_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI43_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI43_0_0RNSVGAlignmentBaselineToString( enum ABI43_0_0RNSVGAlignmentBaseline fw );

enum ABI43_0_0RNSVGAlignmentBaseline ABI43_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGFontStyle) {
    ABI43_0_0RNSVGFontStyleNormal,
    ABI43_0_0RNSVGFontStyleItalic,
    ABI43_0_0RNSVGFontStyleOblique,
    ABI43_0_0RNSVGFontStyleDEFAULT = ABI43_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI43_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI43_0_0RNSVGFontStyleToString( enum ABI43_0_0RNSVGFontStyle fw );

enum ABI43_0_0RNSVGFontStyle ABI43_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGFontVariantLigatures) {
    ABI43_0_0RNSVGFontVariantLigaturesNormal,
    ABI43_0_0RNSVGFontVariantLigaturesNone,
    ABI43_0_0RNSVGFontVariantLigaturesDEFAULT = ABI43_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI43_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI43_0_0RNSVGFontVariantLigaturesToString( enum ABI43_0_0RNSVGFontVariantLigatures fw );

enum ABI43_0_0RNSVGFontVariantLigatures ABI43_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGFontWeight) {
    // Absolute
    ABI43_0_0RNSVGFontWeightNormal,
    ABI43_0_0RNSVGFontWeightBold,
    ABI43_0_0RNSVGFontWeight100,
    ABI43_0_0RNSVGFontWeight200,
    ABI43_0_0RNSVGFontWeight300,
    ABI43_0_0RNSVGFontWeight400,
    ABI43_0_0RNSVGFontWeight500,
    ABI43_0_0RNSVGFontWeight600,
    ABI43_0_0RNSVGFontWeight700,
    ABI43_0_0RNSVGFontWeight800,
    ABI43_0_0RNSVGFontWeight900,
    // Relative
    ABI43_0_0RNSVGFontWeightBolder,
    ABI43_0_0RNSVGFontWeightLighter,
    ABI43_0_0RNSVGFontWeightDEFAULT = ABI43_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI43_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI43_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI43_0_0RNSVGFontWeight const ABI43_0_0RNSVGFontWeights[] = {
    ABI43_0_0RNSVGFontWeight100,
    ABI43_0_0RNSVGFontWeight100,
    ABI43_0_0RNSVGFontWeight200,
    ABI43_0_0RNSVGFontWeight300,
    ABI43_0_0RNSVGFontWeightNormal,
    ABI43_0_0RNSVGFontWeight500,
    ABI43_0_0RNSVGFontWeight600,
    ABI43_0_0RNSVGFontWeightBold,
    ABI43_0_0RNSVGFontWeight800,
    ABI43_0_0RNSVGFontWeight900,
    ABI43_0_0RNSVGFontWeight900
};

NSString* ABI43_0_0RNSVGFontWeightToString( enum ABI43_0_0RNSVGFontWeight fw );

enum ABI43_0_0RNSVGFontWeight ABI43_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGTextAnchor) {
    ABI43_0_0RNSVGTextAnchorStart,
    ABI43_0_0RNSVGTextAnchorMiddle,
    ABI43_0_0RNSVGTextAnchorEnd,
    ABI43_0_0RNSVGTextAnchorDEFAULT = ABI43_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI43_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI43_0_0RNSVGTextAnchorToString( enum ABI43_0_0RNSVGTextAnchor fw );

enum ABI43_0_0RNSVGTextAnchor ABI43_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGTextDecoration) {
    ABI43_0_0RNSVGTextDecorationNone,
    ABI43_0_0RNSVGTextDecorationUnderline,
    ABI43_0_0RNSVGTextDecorationOverline,
    ABI43_0_0RNSVGTextDecorationLineThrough,
    ABI43_0_0RNSVGTextDecorationBlink,
    ABI43_0_0RNSVGTextDecorationDEFAULT = ABI43_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI43_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI43_0_0RNSVGTextDecorationToString( enum ABI43_0_0RNSVGTextDecoration fw );

enum ABI43_0_0RNSVGTextDecoration ABI43_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGTextLengthAdjust) {
    ABI43_0_0RNSVGTextLengthAdjustSpacing,
    ABI43_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI43_0_0RNSVGTextLengthAdjustDEFAULT = ABI43_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI43_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI43_0_0RNSVGTextLengthAdjustToString( enum ABI43_0_0RNSVGTextLengthAdjust fw );

enum ABI43_0_0RNSVGTextLengthAdjust ABI43_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGTextPathMethod) {
    ABI43_0_0RNSVGTextPathMethodAlign,
    ABI43_0_0RNSVGTextPathMethodStretch,
    ABI43_0_0RNSVGTextPathMethodDEFAULT = ABI43_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI43_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI43_0_0RNSVGTextPathMethodToString( enum ABI43_0_0RNSVGTextPathMethod fw );

enum ABI43_0_0RNSVGTextPathMethod ABI43_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGTextPathMidLine) {
    ABI43_0_0RNSVGTextPathMidLineSharp,
    ABI43_0_0RNSVGTextPathMidLineSmooth,
    ABI43_0_0RNSVGTextPathMidLineDEFAULT = ABI43_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI43_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI43_0_0RNSVGTextPathMidLineToString( enum ABI43_0_0RNSVGTextPathMidLine fw );

enum ABI43_0_0RNSVGTextPathMidLine ABI43_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGTextPathSide) {
    ABI43_0_0RNSVGTextPathSideLeft,
    ABI43_0_0RNSVGTextPathSideRight,
    ABI43_0_0RNSVGTextPathSideDEFAULT = ABI43_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI43_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI43_0_0RNSVGTextPathSideToString( enum ABI43_0_0RNSVGTextPathSide fw );

enum ABI43_0_0RNSVGTextPathSide ABI43_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI43_0_0RNSVGTextPathSpacing) {
    ABI43_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI43_0_0RNSVGTextPathSpacingExact,
    ABI43_0_0RNSVGTextPathSpacingDEFAULT = ABI43_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI43_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI43_0_0RNSVGTextPathSpacingToString( enum ABI43_0_0RNSVGTextPathSpacing fw );

enum ABI43_0_0RNSVGTextPathSpacing ABI43_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
