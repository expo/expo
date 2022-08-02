#import <Foundation/Foundation.h>

#ifndef ABI46_0_0RNTextProperties_h
#define ABI46_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGAlignmentBaseline) {
    ABI46_0_0RNSVGAlignmentBaselineBaseline,
    ABI46_0_0RNSVGAlignmentBaselineTextBottom,
    ABI46_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI46_0_0RNSVGAlignmentBaselineIdeographic,
    ABI46_0_0RNSVGAlignmentBaselineMiddle,
    ABI46_0_0RNSVGAlignmentBaselineCentral,
    ABI46_0_0RNSVGAlignmentBaselineMathematical,
    ABI46_0_0RNSVGAlignmentBaselineTextTop,
    ABI46_0_0RNSVGAlignmentBaselineBottom,
    ABI46_0_0RNSVGAlignmentBaselineCenter,
    ABI46_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI46_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI46_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI46_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI46_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI46_0_0RNSVGAlignmentBaselineHanging,
    ABI46_0_0RNSVGAlignmentBaselineDEFAULT = ABI46_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI46_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI46_0_0RNSVGAlignmentBaselineToString( enum ABI46_0_0RNSVGAlignmentBaseline fw );

enum ABI46_0_0RNSVGAlignmentBaseline ABI46_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGFontStyle) {
    ABI46_0_0RNSVGFontStyleNormal,
    ABI46_0_0RNSVGFontStyleItalic,
    ABI46_0_0RNSVGFontStyleOblique,
    ABI46_0_0RNSVGFontStyleDEFAULT = ABI46_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI46_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI46_0_0RNSVGFontStyleToString( enum ABI46_0_0RNSVGFontStyle fw );

enum ABI46_0_0RNSVGFontStyle ABI46_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGFontVariantLigatures) {
    ABI46_0_0RNSVGFontVariantLigaturesNormal,
    ABI46_0_0RNSVGFontVariantLigaturesNone,
    ABI46_0_0RNSVGFontVariantLigaturesDEFAULT = ABI46_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI46_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI46_0_0RNSVGFontVariantLigaturesToString( enum ABI46_0_0RNSVGFontVariantLigatures fw );

enum ABI46_0_0RNSVGFontVariantLigatures ABI46_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGFontWeight) {
    // Absolute
    ABI46_0_0RNSVGFontWeightNormal,
    ABI46_0_0RNSVGFontWeightBold,
    ABI46_0_0RNSVGFontWeight100,
    ABI46_0_0RNSVGFontWeight200,
    ABI46_0_0RNSVGFontWeight300,
    ABI46_0_0RNSVGFontWeight400,
    ABI46_0_0RNSVGFontWeight500,
    ABI46_0_0RNSVGFontWeight600,
    ABI46_0_0RNSVGFontWeight700,
    ABI46_0_0RNSVGFontWeight800,
    ABI46_0_0RNSVGFontWeight900,
    // Relative
    ABI46_0_0RNSVGFontWeightBolder,
    ABI46_0_0RNSVGFontWeightLighter,
    ABI46_0_0RNSVGFontWeightDEFAULT = ABI46_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI46_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI46_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI46_0_0RNSVGFontWeight const ABI46_0_0RNSVGFontWeights[] = {
    ABI46_0_0RNSVGFontWeight100,
    ABI46_0_0RNSVGFontWeight100,
    ABI46_0_0RNSVGFontWeight200,
    ABI46_0_0RNSVGFontWeight300,
    ABI46_0_0RNSVGFontWeightNormal,
    ABI46_0_0RNSVGFontWeight500,
    ABI46_0_0RNSVGFontWeight600,
    ABI46_0_0RNSVGFontWeightBold,
    ABI46_0_0RNSVGFontWeight800,
    ABI46_0_0RNSVGFontWeight900,
    ABI46_0_0RNSVGFontWeight900
};

NSString* ABI46_0_0RNSVGFontWeightToString( enum ABI46_0_0RNSVGFontWeight fw );

enum ABI46_0_0RNSVGFontWeight ABI46_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGTextAnchor) {
    ABI46_0_0RNSVGTextAnchorStart,
    ABI46_0_0RNSVGTextAnchorMiddle,
    ABI46_0_0RNSVGTextAnchorEnd,
    ABI46_0_0RNSVGTextAnchorDEFAULT = ABI46_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI46_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI46_0_0RNSVGTextAnchorToString( enum ABI46_0_0RNSVGTextAnchor fw );

enum ABI46_0_0RNSVGTextAnchor ABI46_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGTextDecoration) {
    ABI46_0_0RNSVGTextDecorationNone,
    ABI46_0_0RNSVGTextDecorationUnderline,
    ABI46_0_0RNSVGTextDecorationOverline,
    ABI46_0_0RNSVGTextDecorationLineThrough,
    ABI46_0_0RNSVGTextDecorationBlink,
    ABI46_0_0RNSVGTextDecorationDEFAULT = ABI46_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI46_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI46_0_0RNSVGTextDecorationToString( enum ABI46_0_0RNSVGTextDecoration fw );

enum ABI46_0_0RNSVGTextDecoration ABI46_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGTextLengthAdjust) {
    ABI46_0_0RNSVGTextLengthAdjustSpacing,
    ABI46_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI46_0_0RNSVGTextLengthAdjustDEFAULT = ABI46_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI46_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI46_0_0RNSVGTextLengthAdjustToString( enum ABI46_0_0RNSVGTextLengthAdjust fw );

enum ABI46_0_0RNSVGTextLengthAdjust ABI46_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGTextPathMethod) {
    ABI46_0_0RNSVGTextPathMethodAlign,
    ABI46_0_0RNSVGTextPathMethodStretch,
    ABI46_0_0RNSVGTextPathMethodDEFAULT = ABI46_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI46_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI46_0_0RNSVGTextPathMethodToString( enum ABI46_0_0RNSVGTextPathMethod fw );

enum ABI46_0_0RNSVGTextPathMethod ABI46_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGTextPathMidLine) {
    ABI46_0_0RNSVGTextPathMidLineSharp,
    ABI46_0_0RNSVGTextPathMidLineSmooth,
    ABI46_0_0RNSVGTextPathMidLineDEFAULT = ABI46_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI46_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI46_0_0RNSVGTextPathMidLineToString( enum ABI46_0_0RNSVGTextPathMidLine fw );

enum ABI46_0_0RNSVGTextPathMidLine ABI46_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGTextPathSide) {
    ABI46_0_0RNSVGTextPathSideLeft,
    ABI46_0_0RNSVGTextPathSideRight,
    ABI46_0_0RNSVGTextPathSideDEFAULT = ABI46_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI46_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI46_0_0RNSVGTextPathSideToString( enum ABI46_0_0RNSVGTextPathSide fw );

enum ABI46_0_0RNSVGTextPathSide ABI46_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI46_0_0RNSVGTextPathSpacing) {
    ABI46_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI46_0_0RNSVGTextPathSpacingExact,
    ABI46_0_0RNSVGTextPathSpacingDEFAULT = ABI46_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI46_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI46_0_0RNSVGTextPathSpacingToString( enum ABI46_0_0RNSVGTextPathSpacing fw );

enum ABI46_0_0RNSVGTextPathSpacing ABI46_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
