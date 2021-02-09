#import <Foundation/Foundation.h>

#ifndef ABI39_0_0RNTextProperties_h
#define ABI39_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGAlignmentBaseline) {
    ABI39_0_0RNSVGAlignmentBaselineBaseline,
    ABI39_0_0RNSVGAlignmentBaselineTextBottom,
    ABI39_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI39_0_0RNSVGAlignmentBaselineIdeographic,
    ABI39_0_0RNSVGAlignmentBaselineMiddle,
    ABI39_0_0RNSVGAlignmentBaselineCentral,
    ABI39_0_0RNSVGAlignmentBaselineMathematical,
    ABI39_0_0RNSVGAlignmentBaselineTextTop,
    ABI39_0_0RNSVGAlignmentBaselineBottom,
    ABI39_0_0RNSVGAlignmentBaselineCenter,
    ABI39_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI39_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI39_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI39_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI39_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI39_0_0RNSVGAlignmentBaselineHanging,
    ABI39_0_0RNSVGAlignmentBaselineDEFAULT = ABI39_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI39_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI39_0_0RNSVGAlignmentBaselineToString( enum ABI39_0_0RNSVGAlignmentBaseline fw );

enum ABI39_0_0RNSVGAlignmentBaseline ABI39_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGFontStyle) {
    ABI39_0_0RNSVGFontStyleNormal,
    ABI39_0_0RNSVGFontStyleItalic,
    ABI39_0_0RNSVGFontStyleOblique,
    ABI39_0_0RNSVGFontStyleDEFAULT = ABI39_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI39_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI39_0_0RNSVGFontStyleToString( enum ABI39_0_0RNSVGFontStyle fw );

enum ABI39_0_0RNSVGFontStyle ABI39_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGFontVariantLigatures) {
    ABI39_0_0RNSVGFontVariantLigaturesNormal,
    ABI39_0_0RNSVGFontVariantLigaturesNone,
    ABI39_0_0RNSVGFontVariantLigaturesDEFAULT = ABI39_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI39_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI39_0_0RNSVGFontVariantLigaturesToString( enum ABI39_0_0RNSVGFontVariantLigatures fw );

enum ABI39_0_0RNSVGFontVariantLigatures ABI39_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGFontWeight) {
    // Absolute
    ABI39_0_0RNSVGFontWeightNormal,
    ABI39_0_0RNSVGFontWeightBold,
    ABI39_0_0RNSVGFontWeight100,
    ABI39_0_0RNSVGFontWeight200,
    ABI39_0_0RNSVGFontWeight300,
    ABI39_0_0RNSVGFontWeight400,
    ABI39_0_0RNSVGFontWeight500,
    ABI39_0_0RNSVGFontWeight600,
    ABI39_0_0RNSVGFontWeight700,
    ABI39_0_0RNSVGFontWeight800,
    ABI39_0_0RNSVGFontWeight900,
    // Relative
    ABI39_0_0RNSVGFontWeightBolder,
    ABI39_0_0RNSVGFontWeightLighter,
    ABI39_0_0RNSVGFontWeightDEFAULT = ABI39_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI39_0_0RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const ABI39_0_0RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static ABI39_0_0RNSVGFontWeight const ABI39_0_0RNSVGFontWeights[] = {
    ABI39_0_0RNSVGFontWeight100,
    ABI39_0_0RNSVGFontWeight100,
    ABI39_0_0RNSVGFontWeight200,
    ABI39_0_0RNSVGFontWeight300,
    ABI39_0_0RNSVGFontWeightNormal,
    ABI39_0_0RNSVGFontWeight500,
    ABI39_0_0RNSVGFontWeight600,
    ABI39_0_0RNSVGFontWeightBold,
    ABI39_0_0RNSVGFontWeight800,
    ABI39_0_0RNSVGFontWeight900,
    ABI39_0_0RNSVGFontWeight900
};

NSString* ABI39_0_0RNSVGFontWeightToString( enum ABI39_0_0RNSVGFontWeight fw );

enum ABI39_0_0RNSVGFontWeight ABI39_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGTextAnchor) {
    ABI39_0_0RNSVGTextAnchorStart,
    ABI39_0_0RNSVGTextAnchorMiddle,
    ABI39_0_0RNSVGTextAnchorEnd,
    ABI39_0_0RNSVGTextAnchorDEFAULT = ABI39_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI39_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI39_0_0RNSVGTextAnchorToString( enum ABI39_0_0RNSVGTextAnchor fw );

enum ABI39_0_0RNSVGTextAnchor ABI39_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGTextDecoration) {
    ABI39_0_0RNSVGTextDecorationNone,
    ABI39_0_0RNSVGTextDecorationUnderline,
    ABI39_0_0RNSVGTextDecorationOverline,
    ABI39_0_0RNSVGTextDecorationLineThrough,
    ABI39_0_0RNSVGTextDecorationBlink,
    ABI39_0_0RNSVGTextDecorationDEFAULT = ABI39_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI39_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI39_0_0RNSVGTextDecorationToString( enum ABI39_0_0RNSVGTextDecoration fw );

enum ABI39_0_0RNSVGTextDecoration ABI39_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGTextLengthAdjust) {
    ABI39_0_0RNSVGTextLengthAdjustSpacing,
    ABI39_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI39_0_0RNSVGTextLengthAdjustDEFAULT = ABI39_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI39_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI39_0_0RNSVGTextLengthAdjustToString( enum ABI39_0_0RNSVGTextLengthAdjust fw );

enum ABI39_0_0RNSVGTextLengthAdjust ABI39_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGTextPathMethod) {
    ABI39_0_0RNSVGTextPathMethodAlign,
    ABI39_0_0RNSVGTextPathMethodStretch,
    ABI39_0_0RNSVGTextPathMethodDEFAULT = ABI39_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI39_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI39_0_0RNSVGTextPathMethodToString( enum ABI39_0_0RNSVGTextPathMethod fw );

enum ABI39_0_0RNSVGTextPathMethod ABI39_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGTextPathMidLine) {
    ABI39_0_0RNSVGTextPathMidLineSharp,
    ABI39_0_0RNSVGTextPathMidLineSmooth,
    ABI39_0_0RNSVGTextPathMidLineDEFAULT = ABI39_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI39_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI39_0_0RNSVGTextPathMidLineToString( enum ABI39_0_0RNSVGTextPathMidLine fw );

enum ABI39_0_0RNSVGTextPathMidLine ABI39_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGTextPathSide) {
    ABI39_0_0RNSVGTextPathSideLeft,
    ABI39_0_0RNSVGTextPathSideRight,
    ABI39_0_0RNSVGTextPathSideDEFAULT = ABI39_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI39_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI39_0_0RNSVGTextPathSideToString( enum ABI39_0_0RNSVGTextPathSide fw );

enum ABI39_0_0RNSVGTextPathSide ABI39_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI39_0_0RNSVGTextPathSpacing) {
    ABI39_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI39_0_0RNSVGTextPathSpacingExact,
    ABI39_0_0RNSVGTextPathSpacingDEFAULT = ABI39_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI39_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI39_0_0RNSVGTextPathSpacingToString( enum ABI39_0_0RNSVGTextPathSpacing fw );

enum ABI39_0_0RNSVGTextPathSpacing ABI39_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
