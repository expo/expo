#import <Foundation/Foundation.h>

#ifndef ABI26_0_0RNTextProperties_h
#define ABI26_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGAlignmentBaseline) {
    ABI26_0_0RNSVGAlignmentBaselineBaseline,
    ABI26_0_0RNSVGAlignmentBaselineTextBottom,
    ABI26_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI26_0_0RNSVGAlignmentBaselineIdeographic,
    ABI26_0_0RNSVGAlignmentBaselineMiddle,
    ABI26_0_0RNSVGAlignmentBaselineCentral,
    ABI26_0_0RNSVGAlignmentBaselineMathematical,
    ABI26_0_0RNSVGAlignmentBaselineTextTop,
    ABI26_0_0RNSVGAlignmentBaselineBottom,
    ABI26_0_0RNSVGAlignmentBaselineCenter,
    ABI26_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI26_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI26_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI26_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI26_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI26_0_0RNSVGAlignmentBaselineHanging,
    ABI26_0_0RNSVGAlignmentBaselineDEFAULT = ABI26_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI26_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI26_0_0RNSVGAlignmentBaselineToString( enum ABI26_0_0RNSVGAlignmentBaseline fw );

enum ABI26_0_0RNSVGAlignmentBaseline ABI26_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGFontStyle) {
    ABI26_0_0RNSVGFontStyleNormal,
    ABI26_0_0RNSVGFontStyleItalic,
    ABI26_0_0RNSVGFontStyleOblique,
    ABI26_0_0RNSVGFontStyleDEFAULT = ABI26_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI26_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI26_0_0RNSVGFontStyleToString( enum ABI26_0_0RNSVGFontStyle fw );

enum ABI26_0_0RNSVGFontStyle ABI26_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGFontVariantLigatures) {
    ABI26_0_0RNSVGFontVariantLigaturesNormal,
    ABI26_0_0RNSVGFontVariantLigaturesNone,
    ABI26_0_0RNSVGFontVariantLigaturesDEFAULT = ABI26_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI26_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI26_0_0RNSVGFontVariantLigaturesToString( enum ABI26_0_0RNSVGFontVariantLigatures fw );

enum ABI26_0_0RNSVGFontVariantLigatures ABI26_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGFontWeight) {
    ABI26_0_0RNSVGFontWeightNormal,
    ABI26_0_0RNSVGFontWeightBold,
    ABI26_0_0RNSVGFontWeightBolder,
    ABI26_0_0RNSVGFontWeightLighter,
    ABI26_0_0RNSVGFontWeight100,
    ABI26_0_0RNSVGFontWeight200,
    ABI26_0_0RNSVGFontWeight300,
    ABI26_0_0RNSVGFontWeight400,
    ABI26_0_0RNSVGFontWeight500,
    ABI26_0_0RNSVGFontWeight600,
    ABI26_0_0RNSVGFontWeight700,
    ABI26_0_0RNSVGFontWeight800,
    ABI26_0_0RNSVGFontWeight900,
    ABI26_0_0RNSVGFontWeightDEFAULT = ABI26_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI26_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI26_0_0RNSVGFontWeightToString( enum ABI26_0_0RNSVGFontWeight fw );

enum ABI26_0_0RNSVGFontWeight ABI26_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGTextAnchor) {
    ABI26_0_0RNSVGTextAnchorStart,
    ABI26_0_0RNSVGTextAnchorMiddle,
    ABI26_0_0RNSVGTextAnchorEnd,
    ABI26_0_0RNSVGTextAnchorDEFAULT = ABI26_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI26_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI26_0_0RNSVGTextAnchorToString( enum ABI26_0_0RNSVGTextAnchor fw );

enum ABI26_0_0RNSVGTextAnchor ABI26_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGTextDecoration) {
    ABI26_0_0RNSVGTextDecorationNone,
    ABI26_0_0RNSVGTextDecorationUnderline,
    ABI26_0_0RNSVGTextDecorationOverline,
    ABI26_0_0RNSVGTextDecorationLineThrough,
    ABI26_0_0RNSVGTextDecorationBlink,
    ABI26_0_0RNSVGTextDecorationDEFAULT = ABI26_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI26_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI26_0_0RNSVGTextDecorationToString( enum ABI26_0_0RNSVGTextDecoration fw );

enum ABI26_0_0RNSVGTextDecoration ABI26_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGTextLengthAdjust) {
    ABI26_0_0RNSVGTextLengthAdjustSpacing,
    ABI26_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI26_0_0RNSVGTextLengthAdjustDEFAULT = ABI26_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI26_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI26_0_0RNSVGTextLengthAdjustToString( enum ABI26_0_0RNSVGTextLengthAdjust fw );

enum ABI26_0_0RNSVGTextLengthAdjust ABI26_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGTextPathMethod) {
    ABI26_0_0RNSVGTextPathMethodAlign,
    ABI26_0_0RNSVGTextPathMethodStretch,
    ABI26_0_0RNSVGTextPathMethodDEFAULT = ABI26_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI26_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI26_0_0RNSVGTextPathMethodToString( enum ABI26_0_0RNSVGTextPathMethod fw );

enum ABI26_0_0RNSVGTextPathMethod ABI26_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGTextPathMidLine) {
    ABI26_0_0RNSVGTextPathMidLineSharp,
    ABI26_0_0RNSVGTextPathMidLineSmooth,
    ABI26_0_0RNSVGTextPathMidLineDEFAULT = ABI26_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI26_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI26_0_0RNSVGTextPathMidLineToString( enum ABI26_0_0RNSVGTextPathMidLine fw );

enum ABI26_0_0RNSVGTextPathMidLine ABI26_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGTextPathSide) {
    ABI26_0_0RNSVGTextPathSideLeft,
    ABI26_0_0RNSVGTextPathSideRight,
    ABI26_0_0RNSVGTextPathSideDEFAULT = ABI26_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI26_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI26_0_0RNSVGTextPathSideToString( enum ABI26_0_0RNSVGTextPathSide fw );

enum ABI26_0_0RNSVGTextPathSide ABI26_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI26_0_0RNSVGTextPathSpacing) {
    ABI26_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI26_0_0RNSVGTextPathSpacingExact,
    ABI26_0_0RNSVGTextPathSpacingDEFAULT = ABI26_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI26_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI26_0_0RNSVGTextPathSpacingToString( enum ABI26_0_0RNSVGTextPathSpacing fw );

enum ABI26_0_0RNSVGTextPathSpacing ABI26_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
