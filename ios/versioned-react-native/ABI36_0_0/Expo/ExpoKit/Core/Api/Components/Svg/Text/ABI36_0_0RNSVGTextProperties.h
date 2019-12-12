#import <Foundation/Foundation.h>

#ifndef ABI36_0_0RNTextProperties_h
#define ABI36_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGAlignmentBaseline) {
    ABI36_0_0RNSVGAlignmentBaselineBaseline,
    ABI36_0_0RNSVGAlignmentBaselineTextBottom,
    ABI36_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI36_0_0RNSVGAlignmentBaselineIdeographic,
    ABI36_0_0RNSVGAlignmentBaselineMiddle,
    ABI36_0_0RNSVGAlignmentBaselineCentral,
    ABI36_0_0RNSVGAlignmentBaselineMathematical,
    ABI36_0_0RNSVGAlignmentBaselineTextTop,
    ABI36_0_0RNSVGAlignmentBaselineBottom,
    ABI36_0_0RNSVGAlignmentBaselineCenter,
    ABI36_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI36_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI36_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI36_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI36_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI36_0_0RNSVGAlignmentBaselineHanging,
    ABI36_0_0RNSVGAlignmentBaselineDEFAULT = ABI36_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI36_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI36_0_0RNSVGAlignmentBaselineToString( enum ABI36_0_0RNSVGAlignmentBaseline fw );

enum ABI36_0_0RNSVGAlignmentBaseline ABI36_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGFontStyle) {
    ABI36_0_0RNSVGFontStyleNormal,
    ABI36_0_0RNSVGFontStyleItalic,
    ABI36_0_0RNSVGFontStyleOblique,
    ABI36_0_0RNSVGFontStyleDEFAULT = ABI36_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI36_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI36_0_0RNSVGFontStyleToString( enum ABI36_0_0RNSVGFontStyle fw );

enum ABI36_0_0RNSVGFontStyle ABI36_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGFontVariantLigatures) {
    ABI36_0_0RNSVGFontVariantLigaturesNormal,
    ABI36_0_0RNSVGFontVariantLigaturesNone,
    ABI36_0_0RNSVGFontVariantLigaturesDEFAULT = ABI36_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI36_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI36_0_0RNSVGFontVariantLigaturesToString( enum ABI36_0_0RNSVGFontVariantLigatures fw );

enum ABI36_0_0RNSVGFontVariantLigatures ABI36_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGFontWeight) {
    // Absolute
    ABI36_0_0RNSVGFontWeightNormal,
    ABI36_0_0RNSVGFontWeightBold,
    ABI36_0_0RNSVGFontWeight100,
    ABI36_0_0RNSVGFontWeight200,
    ABI36_0_0RNSVGFontWeight300,
    ABI36_0_0RNSVGFontWeight400,
    ABI36_0_0RNSVGFontWeight500,
    ABI36_0_0RNSVGFontWeight600,
    ABI36_0_0RNSVGFontWeight700,
    ABI36_0_0RNSVGFontWeight800,
    ABI36_0_0RNSVGFontWeight900,
    // Relative
    ABI36_0_0RNSVGFontWeightBolder,
    ABI36_0_0RNSVGFontWeightLighter,
    ABI36_0_0RNSVGFontWeightDEFAULT = ABI36_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI36_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI36_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI36_0_0RNSVGFontWeight const ABI36_0_0RNSVGFontWeights[] = {
    ABI36_0_0RNSVGFontWeight100,
    ABI36_0_0RNSVGFontWeight100,
    ABI36_0_0RNSVGFontWeight200,
    ABI36_0_0RNSVGFontWeight300,
    ABI36_0_0RNSVGFontWeightNormal,
    ABI36_0_0RNSVGFontWeight500,
    ABI36_0_0RNSVGFontWeight600,
    ABI36_0_0RNSVGFontWeightBold,
    ABI36_0_0RNSVGFontWeight800,
    ABI36_0_0RNSVGFontWeight900,
    ABI36_0_0RNSVGFontWeight900
};

NSString* ABI36_0_0RNSVGFontWeightToString( enum ABI36_0_0RNSVGFontWeight fw );

enum ABI36_0_0RNSVGFontWeight ABI36_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGTextAnchor) {
    ABI36_0_0RNSVGTextAnchorStart,
    ABI36_0_0RNSVGTextAnchorMiddle,
    ABI36_0_0RNSVGTextAnchorEnd,
    ABI36_0_0RNSVGTextAnchorDEFAULT = ABI36_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI36_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI36_0_0RNSVGTextAnchorToString( enum ABI36_0_0RNSVGTextAnchor fw );

enum ABI36_0_0RNSVGTextAnchor ABI36_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGTextDecoration) {
    ABI36_0_0RNSVGTextDecorationNone,
    ABI36_0_0RNSVGTextDecorationUnderline,
    ABI36_0_0RNSVGTextDecorationOverline,
    ABI36_0_0RNSVGTextDecorationLineThrough,
    ABI36_0_0RNSVGTextDecorationBlink,
    ABI36_0_0RNSVGTextDecorationDEFAULT = ABI36_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI36_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI36_0_0RNSVGTextDecorationToString( enum ABI36_0_0RNSVGTextDecoration fw );

enum ABI36_0_0RNSVGTextDecoration ABI36_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGTextLengthAdjust) {
    ABI36_0_0RNSVGTextLengthAdjustSpacing,
    ABI36_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI36_0_0RNSVGTextLengthAdjustDEFAULT = ABI36_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI36_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI36_0_0RNSVGTextLengthAdjustToString( enum ABI36_0_0RNSVGTextLengthAdjust fw );

enum ABI36_0_0RNSVGTextLengthAdjust ABI36_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGTextPathMethod) {
    ABI36_0_0RNSVGTextPathMethodAlign,
    ABI36_0_0RNSVGTextPathMethodStretch,
    ABI36_0_0RNSVGTextPathMethodDEFAULT = ABI36_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI36_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI36_0_0RNSVGTextPathMethodToString( enum ABI36_0_0RNSVGTextPathMethod fw );

enum ABI36_0_0RNSVGTextPathMethod ABI36_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGTextPathMidLine) {
    ABI36_0_0RNSVGTextPathMidLineSharp,
    ABI36_0_0RNSVGTextPathMidLineSmooth,
    ABI36_0_0RNSVGTextPathMidLineDEFAULT = ABI36_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI36_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI36_0_0RNSVGTextPathMidLineToString( enum ABI36_0_0RNSVGTextPathMidLine fw );

enum ABI36_0_0RNSVGTextPathMidLine ABI36_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGTextPathSide) {
    ABI36_0_0RNSVGTextPathSideLeft,
    ABI36_0_0RNSVGTextPathSideRight,
    ABI36_0_0RNSVGTextPathSideDEFAULT = ABI36_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI36_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI36_0_0RNSVGTextPathSideToString( enum ABI36_0_0RNSVGTextPathSide fw );

enum ABI36_0_0RNSVGTextPathSide ABI36_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI36_0_0RNSVGTextPathSpacing) {
    ABI36_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI36_0_0RNSVGTextPathSpacingExact,
    ABI36_0_0RNSVGTextPathSpacingDEFAULT = ABI36_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI36_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI36_0_0RNSVGTextPathSpacingToString( enum ABI36_0_0RNSVGTextPathSpacing fw );

enum ABI36_0_0RNSVGTextPathSpacing ABI36_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
