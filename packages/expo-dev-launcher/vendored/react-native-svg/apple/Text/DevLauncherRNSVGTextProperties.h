#import <Foundation/Foundation.h>

#ifndef RNTextProperties_h
#define RNTextProperties_h

typedef NS_ENUM(NSInteger, DevLauncherRNSVGAlignmentBaseline) {
    DevLauncherRNSVGAlignmentBaselineBaseline,
    DevLauncherRNSVGAlignmentBaselineTextBottom,
    DevLauncherRNSVGAlignmentBaselineAlphabetic,
    DevLauncherRNSVGAlignmentBaselineIdeographic,
    DevLauncherRNSVGAlignmentBaselineMiddle,
    DevLauncherRNSVGAlignmentBaselineCentral,
    DevLauncherRNSVGAlignmentBaselineMathematical,
    DevLauncherRNSVGAlignmentBaselineTextTop,
    DevLauncherRNSVGAlignmentBaselineBottom,
    DevLauncherRNSVGAlignmentBaselineCenter,
    DevLauncherRNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    DevLauncherRNSVGAlignmentBaselineTextBeforeEdge,
    DevLauncherRNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    DevLauncherRNSVGAlignmentBaselineBeforeEdge,
    DevLauncherRNSVGAlignmentBaselineAfterEdge,
    DevLauncherRNSVGAlignmentBaselineHanging,
    DevLauncherRNSVGAlignmentBaselineDEFAULT = DevLauncherRNSVGAlignmentBaselineBaseline
};

static NSString* const DevLauncherRNSVGAlignmentBaselineStrings[] = {
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

NSString* DevLauncherRNSVGAlignmentBaselineToString( enum DevLauncherRNSVGAlignmentBaseline fw );

enum DevLauncherRNSVGAlignmentBaseline DevLauncherRNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGFontStyle) {
    DevLauncherRNSVGFontStyleNormal,
    DevLauncherRNSVGFontStyleItalic,
    DevLauncherRNSVGFontStyleOblique,
    DevLauncherRNSVGFontStyleDEFAULT = DevLauncherRNSVGFontStyleNormal,
};

static NSString* const DevLauncherRNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* DevLauncherRNSVGFontStyleToString( enum DevLauncherRNSVGFontStyle fw );

enum DevLauncherRNSVGFontStyle DevLauncherRNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGFontVariantLigatures) {
    DevLauncherRNSVGFontVariantLigaturesNormal,
    DevLauncherRNSVGFontVariantLigaturesNone,
    DevLauncherRNSVGFontVariantLigaturesDEFAULT = DevLauncherRNSVGFontVariantLigaturesNormal,
};

static NSString* const DevLauncherRNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* DevLauncherRNSVGFontVariantLigaturesToString( enum DevLauncherRNSVGFontVariantLigatures fw );

enum DevLauncherRNSVGFontVariantLigatures DevLauncherRNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGFontWeight) {
    // Absolute
    DevLauncherRNSVGFontWeightNormal,
    DevLauncherRNSVGFontWeightBold,
    DevLauncherRNSVGFontWeight100,
    DevLauncherRNSVGFontWeight200,
    DevLauncherRNSVGFontWeight300,
    DevLauncherRNSVGFontWeight400,
    DevLauncherRNSVGFontWeight500,
    DevLauncherRNSVGFontWeight600,
    DevLauncherRNSVGFontWeight700,
    DevLauncherRNSVGFontWeight800,
    DevLauncherRNSVGFontWeight900,
    // Relative
    DevLauncherRNSVGFontWeightBolder,
    DevLauncherRNSVGFontWeightLighter,
    DevLauncherRNSVGFontWeightDEFAULT = DevLauncherRNSVGFontWeightNormal,
};

static NSString* const DevLauncherRNSVGFontWeightStrings[] = {@"normal", @"bold", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", @"bolder", @"lighter", nil};

static int const DevLauncherRNSVGAbsoluteFontWeights[] = {400, 700, 100, 200, 300, 400, 500, 600, 700, 800, 900};

static DevLauncherRNSVGFontWeight const DevLauncherRNSVGFontWeights[] = {
    DevLauncherRNSVGFontWeight100,
    DevLauncherRNSVGFontWeight100,
    DevLauncherRNSVGFontWeight200,
    DevLauncherRNSVGFontWeight300,
    DevLauncherRNSVGFontWeightNormal,
    DevLauncherRNSVGFontWeight500,
    DevLauncherRNSVGFontWeight600,
    DevLauncherRNSVGFontWeightBold,
    DevLauncherRNSVGFontWeight800,
    DevLauncherRNSVGFontWeight900,
    DevLauncherRNSVGFontWeight900
};

NSString* DevLauncherRNSVGFontWeightToString( enum DevLauncherRNSVGFontWeight fw );

enum DevLauncherRNSVGFontWeight DevLauncherRNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGTextAnchor) {
    DevLauncherRNSVGTextAnchorStart,
    DevLauncherRNSVGTextAnchorMiddle,
    DevLauncherRNSVGTextAnchorEnd,
    DevLauncherRNSVGTextAnchorDEFAULT = DevLauncherRNSVGTextAnchorStart,
};

static NSString* const DevLauncherRNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* DevLauncherRNSVGTextAnchorToString( enum DevLauncherRNSVGTextAnchor fw );

enum DevLauncherRNSVGTextAnchor DevLauncherRNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGTextDecoration) {
    DevLauncherRNSVGTextDecorationNone,
    DevLauncherRNSVGTextDecorationUnderline,
    DevLauncherRNSVGTextDecorationOverline,
    DevLauncherRNSVGTextDecorationLineThrough,
    DevLauncherRNSVGTextDecorationBlink,
    DevLauncherRNSVGTextDecorationDEFAULT = DevLauncherRNSVGTextDecorationNone,
};

static NSString* const DevLauncherRNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* DevLauncherRNSVGTextDecorationToString( enum DevLauncherRNSVGTextDecoration fw );

enum DevLauncherRNSVGTextDecoration DevLauncherRNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGTextLengthAdjust) {
    DevLauncherRNSVGTextLengthAdjustSpacing,
    DevLauncherRNSVGTextLengthAdjustSpacingAndGlyphs,
    DevLauncherRNSVGTextLengthAdjustDEFAULT = DevLauncherRNSVGTextLengthAdjustSpacing,
};

static NSString* const DevLauncherRNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* DevLauncherRNSVGTextLengthAdjustToString( enum DevLauncherRNSVGTextLengthAdjust fw );

enum DevLauncherRNSVGTextLengthAdjust DevLauncherRNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGTextPathMethod) {
    DevLauncherRNSVGTextPathMethodAlign,
    DevLauncherRNSVGTextPathMethodStretch,
    DevLauncherRNSVGTextPathMethodDEFAULT = DevLauncherRNSVGTextPathMethodAlign,
};

static NSString* const DevLauncherRNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* DevLauncherRNSVGTextPathMethodToString( enum DevLauncherRNSVGTextPathMethod fw );

enum DevLauncherRNSVGTextPathMethod DevLauncherRNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGTextPathMidLine) {
    DevLauncherRNSVGTextPathMidLineSharp,
    DevLauncherRNSVGTextPathMidLineSmooth,
    DevLauncherRNSVGTextPathMidLineDEFAULT = DevLauncherRNSVGTextPathMidLineSharp,
};

static NSString* const DevLauncherRNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* DevLauncherRNSVGTextPathMidLineToString( enum DevLauncherRNSVGTextPathMidLine fw );

enum DevLauncherRNSVGTextPathMidLine DevLauncherRNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGTextPathSide) {
    DevLauncherRNSVGTextPathSideLeft,
    DevLauncherRNSVGTextPathSideRight,
    DevLauncherRNSVGTextPathSideDEFAULT = DevLauncherRNSVGTextPathSideLeft,
};

static NSString* const DevLauncherRNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* DevLauncherRNSVGTextPathSideToString( enum DevLauncherRNSVGTextPathSide fw );

enum DevLauncherRNSVGTextPathSide DevLauncherRNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, DevLauncherRNSVGTextPathSpacing) {
    DevLauncherRNSVGTextPathSpacingAutoSpacing,
    DevLauncherRNSVGTextPathSpacingExact,
    DevLauncherRNSVGTextPathSpacingDEFAULT = DevLauncherRNSVGTextPathSpacingAutoSpacing,
};

static NSString* const DevLauncherRNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* DevLauncherRNSVGTextPathSpacingToString( enum DevLauncherRNSVGTextPathSpacing fw );

enum DevLauncherRNSVGTextPathSpacing DevLauncherRNSVGTextPathSpacingFromString( NSString* s );

#endif
