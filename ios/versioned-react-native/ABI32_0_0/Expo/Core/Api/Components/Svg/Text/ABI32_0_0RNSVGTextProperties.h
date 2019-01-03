#import <Foundation/Foundation.h>

#ifndef ABI32_0_0RNTextProperties_h
#define ABI32_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGAlignmentBaseline) {
    ABI32_0_0RNSVGAlignmentBaselineBaseline,
    ABI32_0_0RNSVGAlignmentBaselineTextBottom,
    ABI32_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI32_0_0RNSVGAlignmentBaselineIdeographic,
    ABI32_0_0RNSVGAlignmentBaselineMiddle,
    ABI32_0_0RNSVGAlignmentBaselineCentral,
    ABI32_0_0RNSVGAlignmentBaselineMathematical,
    ABI32_0_0RNSVGAlignmentBaselineTextTop,
    ABI32_0_0RNSVGAlignmentBaselineBottom,
    ABI32_0_0RNSVGAlignmentBaselineCenter,
    ABI32_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI32_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI32_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI32_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI32_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI32_0_0RNSVGAlignmentBaselineHanging,
    ABI32_0_0RNSVGAlignmentBaselineDEFAULT = ABI32_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI32_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI32_0_0RNSVGAlignmentBaselineToString( enum ABI32_0_0RNSVGAlignmentBaseline fw );

enum ABI32_0_0RNSVGAlignmentBaseline ABI32_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGFontStyle) {
    ABI32_0_0RNSVGFontStyleNormal,
    ABI32_0_0RNSVGFontStyleItalic,
    ABI32_0_0RNSVGFontStyleOblique,
    ABI32_0_0RNSVGFontStyleDEFAULT = ABI32_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI32_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI32_0_0RNSVGFontStyleToString( enum ABI32_0_0RNSVGFontStyle fw );

enum ABI32_0_0RNSVGFontStyle ABI32_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGFontVariantLigatures) {
    ABI32_0_0RNSVGFontVariantLigaturesNormal,
    ABI32_0_0RNSVGFontVariantLigaturesNone,
    ABI32_0_0RNSVGFontVariantLigaturesDEFAULT = ABI32_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI32_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI32_0_0RNSVGFontVariantLigaturesToString( enum ABI32_0_0RNSVGFontVariantLigatures fw );

enum ABI32_0_0RNSVGFontVariantLigatures ABI32_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGFontWeight) {
    ABI32_0_0RNSVGFontWeightNormal,
    ABI32_0_0RNSVGFontWeightBold,
    ABI32_0_0RNSVGFontWeightBolder,
    ABI32_0_0RNSVGFontWeightLighter,
    ABI32_0_0RNSVGFontWeight100,
    ABI32_0_0RNSVGFontWeight200,
    ABI32_0_0RNSVGFontWeight300,
    ABI32_0_0RNSVGFontWeight400,
    ABI32_0_0RNSVGFontWeight500,
    ABI32_0_0RNSVGFontWeight600,
    ABI32_0_0RNSVGFontWeight700,
    ABI32_0_0RNSVGFontWeight800,
    ABI32_0_0RNSVGFontWeight900,
    ABI32_0_0RNSVGFontWeightDEFAULT = ABI32_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI32_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI32_0_0RNSVGFontWeightToString( enum ABI32_0_0RNSVGFontWeight fw );

enum ABI32_0_0RNSVGFontWeight ABI32_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGTextAnchor) {
    ABI32_0_0RNSVGTextAnchorStart,
    ABI32_0_0RNSVGTextAnchorMiddle,
    ABI32_0_0RNSVGTextAnchorEnd,
    ABI32_0_0RNSVGTextAnchorDEFAULT = ABI32_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI32_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI32_0_0RNSVGTextAnchorToString( enum ABI32_0_0RNSVGTextAnchor fw );

enum ABI32_0_0RNSVGTextAnchor ABI32_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGTextDecoration) {
    ABI32_0_0RNSVGTextDecorationNone,
    ABI32_0_0RNSVGTextDecorationUnderline,
    ABI32_0_0RNSVGTextDecorationOverline,
    ABI32_0_0RNSVGTextDecorationLineThrough,
    ABI32_0_0RNSVGTextDecorationBlink,
    ABI32_0_0RNSVGTextDecorationDEFAULT = ABI32_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI32_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI32_0_0RNSVGTextDecorationToString( enum ABI32_0_0RNSVGTextDecoration fw );

enum ABI32_0_0RNSVGTextDecoration ABI32_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGTextLengthAdjust) {
    ABI32_0_0RNSVGTextLengthAdjustSpacing,
    ABI32_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI32_0_0RNSVGTextLengthAdjustDEFAULT = ABI32_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI32_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI32_0_0RNSVGTextLengthAdjustToString( enum ABI32_0_0RNSVGTextLengthAdjust fw );

enum ABI32_0_0RNSVGTextLengthAdjust ABI32_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGTextPathMethod) {
    ABI32_0_0RNSVGTextPathMethodAlign,
    ABI32_0_0RNSVGTextPathMethodStretch,
    ABI32_0_0RNSVGTextPathMethodDEFAULT = ABI32_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI32_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI32_0_0RNSVGTextPathMethodToString( enum ABI32_0_0RNSVGTextPathMethod fw );

enum ABI32_0_0RNSVGTextPathMethod ABI32_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGTextPathMidLine) {
    ABI32_0_0RNSVGTextPathMidLineSharp,
    ABI32_0_0RNSVGTextPathMidLineSmooth,
    ABI32_0_0RNSVGTextPathMidLineDEFAULT = ABI32_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI32_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI32_0_0RNSVGTextPathMidLineToString( enum ABI32_0_0RNSVGTextPathMidLine fw );

enum ABI32_0_0RNSVGTextPathMidLine ABI32_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGTextPathSide) {
    ABI32_0_0RNSVGTextPathSideLeft,
    ABI32_0_0RNSVGTextPathSideRight,
    ABI32_0_0RNSVGTextPathSideDEFAULT = ABI32_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI32_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI32_0_0RNSVGTextPathSideToString( enum ABI32_0_0RNSVGTextPathSide fw );

enum ABI32_0_0RNSVGTextPathSide ABI32_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI32_0_0RNSVGTextPathSpacing) {
    ABI32_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI32_0_0RNSVGTextPathSpacingExact,
    ABI32_0_0RNSVGTextPathSpacingDEFAULT = ABI32_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI32_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI32_0_0RNSVGTextPathSpacingToString( enum ABI32_0_0RNSVGTextPathSpacing fw );

enum ABI32_0_0RNSVGTextPathSpacing ABI32_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
