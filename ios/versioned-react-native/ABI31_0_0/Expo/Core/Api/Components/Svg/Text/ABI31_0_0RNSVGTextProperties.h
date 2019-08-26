#import <Foundation/Foundation.h>

#ifndef ABI31_0_0RNTextProperties_h
#define ABI31_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGAlignmentBaseline) {
    ABI31_0_0RNSVGAlignmentBaselineBaseline,
    ABI31_0_0RNSVGAlignmentBaselineTextBottom,
    ABI31_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI31_0_0RNSVGAlignmentBaselineIdeographic,
    ABI31_0_0RNSVGAlignmentBaselineMiddle,
    ABI31_0_0RNSVGAlignmentBaselineCentral,
    ABI31_0_0RNSVGAlignmentBaselineMathematical,
    ABI31_0_0RNSVGAlignmentBaselineTextTop,
    ABI31_0_0RNSVGAlignmentBaselineBottom,
    ABI31_0_0RNSVGAlignmentBaselineCenter,
    ABI31_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI31_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI31_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI31_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI31_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI31_0_0RNSVGAlignmentBaselineHanging,
    ABI31_0_0RNSVGAlignmentBaselineDEFAULT = ABI31_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI31_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI31_0_0RNSVGAlignmentBaselineToString( enum ABI31_0_0RNSVGAlignmentBaseline fw );

enum ABI31_0_0RNSVGAlignmentBaseline ABI31_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGFontStyle) {
    ABI31_0_0RNSVGFontStyleNormal,
    ABI31_0_0RNSVGFontStyleItalic,
    ABI31_0_0RNSVGFontStyleOblique,
    ABI31_0_0RNSVGFontStyleDEFAULT = ABI31_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI31_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI31_0_0RNSVGFontStyleToString( enum ABI31_0_0RNSVGFontStyle fw );

enum ABI31_0_0RNSVGFontStyle ABI31_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGFontVariantLigatures) {
    ABI31_0_0RNSVGFontVariantLigaturesNormal,
    ABI31_0_0RNSVGFontVariantLigaturesNone,
    ABI31_0_0RNSVGFontVariantLigaturesDEFAULT = ABI31_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI31_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI31_0_0RNSVGFontVariantLigaturesToString( enum ABI31_0_0RNSVGFontVariantLigatures fw );

enum ABI31_0_0RNSVGFontVariantLigatures ABI31_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGFontWeight) {
    ABI31_0_0RNSVGFontWeightNormal,
    ABI31_0_0RNSVGFontWeightBold,
    ABI31_0_0RNSVGFontWeightBolder,
    ABI31_0_0RNSVGFontWeightLighter,
    ABI31_0_0RNSVGFontWeight100,
    ABI31_0_0RNSVGFontWeight200,
    ABI31_0_0RNSVGFontWeight300,
    ABI31_0_0RNSVGFontWeight400,
    ABI31_0_0RNSVGFontWeight500,
    ABI31_0_0RNSVGFontWeight600,
    ABI31_0_0RNSVGFontWeight700,
    ABI31_0_0RNSVGFontWeight800,
    ABI31_0_0RNSVGFontWeight900,
    ABI31_0_0RNSVGFontWeightDEFAULT = ABI31_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI31_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI31_0_0RNSVGFontWeightToString( enum ABI31_0_0RNSVGFontWeight fw );

enum ABI31_0_0RNSVGFontWeight ABI31_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGTextAnchor) {
    ABI31_0_0RNSVGTextAnchorStart,
    ABI31_0_0RNSVGTextAnchorMiddle,
    ABI31_0_0RNSVGTextAnchorEnd,
    ABI31_0_0RNSVGTextAnchorDEFAULT = ABI31_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI31_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI31_0_0RNSVGTextAnchorToString( enum ABI31_0_0RNSVGTextAnchor fw );

enum ABI31_0_0RNSVGTextAnchor ABI31_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGTextDecoration) {
    ABI31_0_0RNSVGTextDecorationNone,
    ABI31_0_0RNSVGTextDecorationUnderline,
    ABI31_0_0RNSVGTextDecorationOverline,
    ABI31_0_0RNSVGTextDecorationLineThrough,
    ABI31_0_0RNSVGTextDecorationBlink,
    ABI31_0_0RNSVGTextDecorationDEFAULT = ABI31_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI31_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI31_0_0RNSVGTextDecorationToString( enum ABI31_0_0RNSVGTextDecoration fw );

enum ABI31_0_0RNSVGTextDecoration ABI31_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGTextLengthAdjust) {
    ABI31_0_0RNSVGTextLengthAdjustSpacing,
    ABI31_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI31_0_0RNSVGTextLengthAdjustDEFAULT = ABI31_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI31_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI31_0_0RNSVGTextLengthAdjustToString( enum ABI31_0_0RNSVGTextLengthAdjust fw );

enum ABI31_0_0RNSVGTextLengthAdjust ABI31_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGTextPathMethod) {
    ABI31_0_0RNSVGTextPathMethodAlign,
    ABI31_0_0RNSVGTextPathMethodStretch,
    ABI31_0_0RNSVGTextPathMethodDEFAULT = ABI31_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI31_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI31_0_0RNSVGTextPathMethodToString( enum ABI31_0_0RNSVGTextPathMethod fw );

enum ABI31_0_0RNSVGTextPathMethod ABI31_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGTextPathMidLine) {
    ABI31_0_0RNSVGTextPathMidLineSharp,
    ABI31_0_0RNSVGTextPathMidLineSmooth,
    ABI31_0_0RNSVGTextPathMidLineDEFAULT = ABI31_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI31_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI31_0_0RNSVGTextPathMidLineToString( enum ABI31_0_0RNSVGTextPathMidLine fw );

enum ABI31_0_0RNSVGTextPathMidLine ABI31_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGTextPathSide) {
    ABI31_0_0RNSVGTextPathSideLeft,
    ABI31_0_0RNSVGTextPathSideRight,
    ABI31_0_0RNSVGTextPathSideDEFAULT = ABI31_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI31_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI31_0_0RNSVGTextPathSideToString( enum ABI31_0_0RNSVGTextPathSide fw );

enum ABI31_0_0RNSVGTextPathSide ABI31_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI31_0_0RNSVGTextPathSpacing) {
    ABI31_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI31_0_0RNSVGTextPathSpacingExact,
    ABI31_0_0RNSVGTextPathSpacingDEFAULT = ABI31_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI31_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI31_0_0RNSVGTextPathSpacingToString( enum ABI31_0_0RNSVGTextPathSpacing fw );

enum ABI31_0_0RNSVGTextPathSpacing ABI31_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
