#import <Foundation/Foundation.h>

#ifndef RNTextProperties_h
#define RNTextProperties_h

typedef NS_ENUM(NSInteger, RNSVGAlignmentBaseline) {
    RNSVGAlignmentBaselineBaseline,
    RNSVGAlignmentBaselineTextBottom,
    RNSVGAlignmentBaselineAlphabetic,
    RNSVGAlignmentBaselineIdeographic,
    RNSVGAlignmentBaselineMiddle,
    RNSVGAlignmentBaselineCentral,
    RNSVGAlignmentBaselineMathematical,
    RNSVGAlignmentBaselineTextTop,
    RNSVGAlignmentBaselineBottom,
    RNSVGAlignmentBaselineCenter,
    RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    RNSVGAlignmentBaselineTextBeforeEdge,
    RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    RNSVGAlignmentBaselineBeforeEdge,
    RNSVGAlignmentBaselineAfterEdge,
    RNSVGAlignmentBaselineHanging,
    RNSVGAlignmentBaselineDEFAULT = RNSVGAlignmentBaselineBaseline
};

static NSString* const RNSVGAlignmentBaselineStrings[] = {
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

NSString* RNSVGAlignmentBaselineToString( enum RNSVGAlignmentBaseline fw );

enum RNSVGAlignmentBaseline RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGFontStyle) {
    RNSVGFontStyleNormal,
    RNSVGFontStyleItalic,
    RNSVGFontStyleOblique,
    RNSVGFontStyleDEFAULT = RNSVGFontStyleNormal,
};

static NSString* const RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* RNSVGFontStyleToString( enum RNSVGFontStyle fw );

enum RNSVGFontStyle RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGFontVariantLigatures) {
    RNSVGFontVariantLigaturesNormal,
    RNSVGFontVariantLigaturesNone,
    RNSVGFontVariantLigaturesDEFAULT = RNSVGFontVariantLigaturesNormal,
};

static NSString* const RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* RNSVGFontVariantLigaturesToString( enum RNSVGFontVariantLigatures fw );

enum RNSVGFontVariantLigatures RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGFontWeight) {
    // Absolute
    RNSVGFontWeightNormal,
    RNSVGFontWeightBold,
    RNSVGFontWeight100,
    RNSVGFontWeight200,
    RNSVGFontWeight300,
    RNSVGFontWeight400,
    RNSVGFontWeight500,
    RNSVGFontWeight600,
    RNSVGFontWeight700,
    RNSVGFontWeight800,
    RNSVGFontWeight900,
    // Relative
    RNSVGFontWeightBolder,
    RNSVGFontWeightLighter,
    RNSVGFontWeightDEFAULT = RNSVGFontWeightNormal,
};

static NSString* const RNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const RNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static RNSVGFontWeight const RNSVGFontWeights[] = {
    RNSVGFontWeight100,
    RNSVGFontWeight100,
    RNSVGFontWeight200,
    RNSVGFontWeight300,
    RNSVGFontWeightNormal,
    RNSVGFontWeight500,
    RNSVGFontWeight600,
    RNSVGFontWeightBold,
    RNSVGFontWeight800,
    RNSVGFontWeight900,
    RNSVGFontWeight900
};

NSString* RNSVGFontWeightToString( enum RNSVGFontWeight fw );

enum RNSVGFontWeight RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGTextAnchor) {
    RNSVGTextAnchorStart,
    RNSVGTextAnchorMiddle,
    RNSVGTextAnchorEnd,
    RNSVGTextAnchorDEFAULT = RNSVGTextAnchorStart,
};

static NSString* const RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* RNSVGTextAnchorToString( enum RNSVGTextAnchor fw );

enum RNSVGTextAnchor RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGTextDecoration) {
    RNSVGTextDecorationNone,
    RNSVGTextDecorationUnderline,
    RNSVGTextDecorationOverline,
    RNSVGTextDecorationLineThrough,
    RNSVGTextDecorationBlink,
    RNSVGTextDecorationDEFAULT = RNSVGTextDecorationNone,
};

static NSString* const RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* RNSVGTextDecorationToString( enum RNSVGTextDecoration fw );

enum RNSVGTextDecoration RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGTextLengthAdjust) {
    RNSVGTextLengthAdjustSpacing,
    RNSVGTextLengthAdjustSpacingAndGlyphs,
    RNSVGTextLengthAdjustDEFAULT = RNSVGTextLengthAdjustSpacing,
};

static NSString* const RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* RNSVGTextLengthAdjustToString( enum RNSVGTextLengthAdjust fw );

enum RNSVGTextLengthAdjust RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGTextPathMethod) {
    RNSVGTextPathMethodAlign,
    RNSVGTextPathMethodStretch,
    RNSVGTextPathMethodDEFAULT = RNSVGTextPathMethodAlign,
};

static NSString* const RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* RNSVGTextPathMethodToString( enum RNSVGTextPathMethod fw );

enum RNSVGTextPathMethod RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGTextPathMidLine) {
    RNSVGTextPathMidLineSharp,
    RNSVGTextPathMidLineSmooth,
    RNSVGTextPathMidLineDEFAULT = RNSVGTextPathMidLineSharp,
};

static NSString* const RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* RNSVGTextPathMidLineToString( enum RNSVGTextPathMidLine fw );

enum RNSVGTextPathMidLine RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGTextPathSide) {
    RNSVGTextPathSideLeft,
    RNSVGTextPathSideRight,
    RNSVGTextPathSideDEFAULT = RNSVGTextPathSideLeft,
};

static NSString* const RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* RNSVGTextPathSideToString( enum RNSVGTextPathSide fw );

enum RNSVGTextPathSide RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, RNSVGTextPathSpacing) {
    RNSVGTextPathSpacingAutoSpacing,
    RNSVGTextPathSpacingExact,
    RNSVGTextPathSpacingDEFAULT = RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* RNSVGTextPathSpacingToString( enum RNSVGTextPathSpacing fw );

enum RNSVGTextPathSpacing RNSVGTextPathSpacingFromString( NSString* s );

#endif
