#import <Foundation/Foundation.h>

#ifndef ABI28_0_0RNTextProperties_h
#define ABI28_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGAlignmentBaseline) {
    ABI28_0_0RNSVGAlignmentBaselineBaseline,
    ABI28_0_0RNSVGAlignmentBaselineTextBottom,
    ABI28_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI28_0_0RNSVGAlignmentBaselineIdeographic,
    ABI28_0_0RNSVGAlignmentBaselineMiddle,
    ABI28_0_0RNSVGAlignmentBaselineCentral,
    ABI28_0_0RNSVGAlignmentBaselineMathematical,
    ABI28_0_0RNSVGAlignmentBaselineTextTop,
    ABI28_0_0RNSVGAlignmentBaselineBottom,
    ABI28_0_0RNSVGAlignmentBaselineCenter,
    ABI28_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI28_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI28_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI28_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI28_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI28_0_0RNSVGAlignmentBaselineHanging,
    ABI28_0_0RNSVGAlignmentBaselineDEFAULT = ABI28_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI28_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI28_0_0RNSVGAlignmentBaselineToString( enum ABI28_0_0RNSVGAlignmentBaseline fw );

enum ABI28_0_0RNSVGAlignmentBaseline ABI28_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGFontStyle) {
    ABI28_0_0RNSVGFontStyleNormal,
    ABI28_0_0RNSVGFontStyleItalic,
    ABI28_0_0RNSVGFontStyleOblique,
    ABI28_0_0RNSVGFontStyleDEFAULT = ABI28_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI28_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI28_0_0RNSVGFontStyleToString( enum ABI28_0_0RNSVGFontStyle fw );

enum ABI28_0_0RNSVGFontStyle ABI28_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGFontVariantLigatures) {
    ABI28_0_0RNSVGFontVariantLigaturesNormal,
    ABI28_0_0RNSVGFontVariantLigaturesNone,
    ABI28_0_0RNSVGFontVariantLigaturesDEFAULT = ABI28_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI28_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI28_0_0RNSVGFontVariantLigaturesToString( enum ABI28_0_0RNSVGFontVariantLigatures fw );

enum ABI28_0_0RNSVGFontVariantLigatures ABI28_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGFontWeight) {
    ABI28_0_0RNSVGFontWeightNormal,
    ABI28_0_0RNSVGFontWeightBold,
    ABI28_0_0RNSVGFontWeightBolder,
    ABI28_0_0RNSVGFontWeightLighter,
    ABI28_0_0RNSVGFontWeight100,
    ABI28_0_0RNSVGFontWeight200,
    ABI28_0_0RNSVGFontWeight300,
    ABI28_0_0RNSVGFontWeight400,
    ABI28_0_0RNSVGFontWeight500,
    ABI28_0_0RNSVGFontWeight600,
    ABI28_0_0RNSVGFontWeight700,
    ABI28_0_0RNSVGFontWeight800,
    ABI28_0_0RNSVGFontWeight900,
    ABI28_0_0RNSVGFontWeightDEFAULT = ABI28_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI28_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI28_0_0RNSVGFontWeightToString( enum ABI28_0_0RNSVGFontWeight fw );

enum ABI28_0_0RNSVGFontWeight ABI28_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGTextAnchor) {
    ABI28_0_0RNSVGTextAnchorStart,
    ABI28_0_0RNSVGTextAnchorMiddle,
    ABI28_0_0RNSVGTextAnchorEnd,
    ABI28_0_0RNSVGTextAnchorDEFAULT = ABI28_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI28_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI28_0_0RNSVGTextAnchorToString( enum ABI28_0_0RNSVGTextAnchor fw );

enum ABI28_0_0RNSVGTextAnchor ABI28_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGTextDecoration) {
    ABI28_0_0RNSVGTextDecorationNone,
    ABI28_0_0RNSVGTextDecorationUnderline,
    ABI28_0_0RNSVGTextDecorationOverline,
    ABI28_0_0RNSVGTextDecorationLineThrough,
    ABI28_0_0RNSVGTextDecorationBlink,
    ABI28_0_0RNSVGTextDecorationDEFAULT = ABI28_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI28_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI28_0_0RNSVGTextDecorationToString( enum ABI28_0_0RNSVGTextDecoration fw );

enum ABI28_0_0RNSVGTextDecoration ABI28_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGTextLengthAdjust) {
    ABI28_0_0RNSVGTextLengthAdjustSpacing,
    ABI28_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI28_0_0RNSVGTextLengthAdjustDEFAULT = ABI28_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI28_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI28_0_0RNSVGTextLengthAdjustToString( enum ABI28_0_0RNSVGTextLengthAdjust fw );

enum ABI28_0_0RNSVGTextLengthAdjust ABI28_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGTextPathMethod) {
    ABI28_0_0RNSVGTextPathMethodAlign,
    ABI28_0_0RNSVGTextPathMethodStretch,
    ABI28_0_0RNSVGTextPathMethodDEFAULT = ABI28_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI28_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI28_0_0RNSVGTextPathMethodToString( enum ABI28_0_0RNSVGTextPathMethod fw );

enum ABI28_0_0RNSVGTextPathMethod ABI28_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGTextPathMidLine) {
    ABI28_0_0RNSVGTextPathMidLineSharp,
    ABI28_0_0RNSVGTextPathMidLineSmooth,
    ABI28_0_0RNSVGTextPathMidLineDEFAULT = ABI28_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI28_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI28_0_0RNSVGTextPathMidLineToString( enum ABI28_0_0RNSVGTextPathMidLine fw );

enum ABI28_0_0RNSVGTextPathMidLine ABI28_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGTextPathSide) {
    ABI28_0_0RNSVGTextPathSideLeft,
    ABI28_0_0RNSVGTextPathSideRight,
    ABI28_0_0RNSVGTextPathSideDEFAULT = ABI28_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI28_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI28_0_0RNSVGTextPathSideToString( enum ABI28_0_0RNSVGTextPathSide fw );

enum ABI28_0_0RNSVGTextPathSide ABI28_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI28_0_0RNSVGTextPathSpacing) {
    ABI28_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI28_0_0RNSVGTextPathSpacingExact,
    ABI28_0_0RNSVGTextPathSpacingDEFAULT = ABI28_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI28_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI28_0_0RNSVGTextPathSpacingToString( enum ABI28_0_0RNSVGTextPathSpacing fw );

enum ABI28_0_0RNSVGTextPathSpacing ABI28_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
