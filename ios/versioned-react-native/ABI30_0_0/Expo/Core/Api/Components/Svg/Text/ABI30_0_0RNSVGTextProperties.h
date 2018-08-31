#import <Foundation/Foundation.h>

#ifndef ABI30_0_0RNTextProperties_h
#define ABI30_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGAlignmentBaseline) {
    ABI30_0_0RNSVGAlignmentBaselineBaseline,
    ABI30_0_0RNSVGAlignmentBaselineTextBottom,
    ABI30_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI30_0_0RNSVGAlignmentBaselineIdeographic,
    ABI30_0_0RNSVGAlignmentBaselineMiddle,
    ABI30_0_0RNSVGAlignmentBaselineCentral,
    ABI30_0_0RNSVGAlignmentBaselineMathematical,
    ABI30_0_0RNSVGAlignmentBaselineTextTop,
    ABI30_0_0RNSVGAlignmentBaselineBottom,
    ABI30_0_0RNSVGAlignmentBaselineCenter,
    ABI30_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI30_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI30_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI30_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI30_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI30_0_0RNSVGAlignmentBaselineHanging,
    ABI30_0_0RNSVGAlignmentBaselineDEFAULT = ABI30_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI30_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI30_0_0RNSVGAlignmentBaselineToString( enum ABI30_0_0RNSVGAlignmentBaseline fw );

enum ABI30_0_0RNSVGAlignmentBaseline ABI30_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGFontStyle) {
    ABI30_0_0RNSVGFontStyleNormal,
    ABI30_0_0RNSVGFontStyleItalic,
    ABI30_0_0RNSVGFontStyleOblique,
    ABI30_0_0RNSVGFontStyleDEFAULT = ABI30_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI30_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI30_0_0RNSVGFontStyleToString( enum ABI30_0_0RNSVGFontStyle fw );

enum ABI30_0_0RNSVGFontStyle ABI30_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGFontVariantLigatures) {
    ABI30_0_0RNSVGFontVariantLigaturesNormal,
    ABI30_0_0RNSVGFontVariantLigaturesNone,
    ABI30_0_0RNSVGFontVariantLigaturesDEFAULT = ABI30_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI30_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI30_0_0RNSVGFontVariantLigaturesToString( enum ABI30_0_0RNSVGFontVariantLigatures fw );

enum ABI30_0_0RNSVGFontVariantLigatures ABI30_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGFontWeight) {
    ABI30_0_0RNSVGFontWeightNormal,
    ABI30_0_0RNSVGFontWeightBold,
    ABI30_0_0RNSVGFontWeightBolder,
    ABI30_0_0RNSVGFontWeightLighter,
    ABI30_0_0RNSVGFontWeight100,
    ABI30_0_0RNSVGFontWeight200,
    ABI30_0_0RNSVGFontWeight300,
    ABI30_0_0RNSVGFontWeight400,
    ABI30_0_0RNSVGFontWeight500,
    ABI30_0_0RNSVGFontWeight600,
    ABI30_0_0RNSVGFontWeight700,
    ABI30_0_0RNSVGFontWeight800,
    ABI30_0_0RNSVGFontWeight900,
    ABI30_0_0RNSVGFontWeightDEFAULT = ABI30_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI30_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI30_0_0RNSVGFontWeightToString( enum ABI30_0_0RNSVGFontWeight fw );

enum ABI30_0_0RNSVGFontWeight ABI30_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGTextAnchor) {
    ABI30_0_0RNSVGTextAnchorStart,
    ABI30_0_0RNSVGTextAnchorMiddle,
    ABI30_0_0RNSVGTextAnchorEnd,
    ABI30_0_0RNSVGTextAnchorDEFAULT = ABI30_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI30_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI30_0_0RNSVGTextAnchorToString( enum ABI30_0_0RNSVGTextAnchor fw );

enum ABI30_0_0RNSVGTextAnchor ABI30_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGTextDecoration) {
    ABI30_0_0RNSVGTextDecorationNone,
    ABI30_0_0RNSVGTextDecorationUnderline,
    ABI30_0_0RNSVGTextDecorationOverline,
    ABI30_0_0RNSVGTextDecorationLineThrough,
    ABI30_0_0RNSVGTextDecorationBlink,
    ABI30_0_0RNSVGTextDecorationDEFAULT = ABI30_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI30_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI30_0_0RNSVGTextDecorationToString( enum ABI30_0_0RNSVGTextDecoration fw );

enum ABI30_0_0RNSVGTextDecoration ABI30_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGTextLengthAdjust) {
    ABI30_0_0RNSVGTextLengthAdjustSpacing,
    ABI30_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI30_0_0RNSVGTextLengthAdjustDEFAULT = ABI30_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI30_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI30_0_0RNSVGTextLengthAdjustToString( enum ABI30_0_0RNSVGTextLengthAdjust fw );

enum ABI30_0_0RNSVGTextLengthAdjust ABI30_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGTextPathMethod) {
    ABI30_0_0RNSVGTextPathMethodAlign,
    ABI30_0_0RNSVGTextPathMethodStretch,
    ABI30_0_0RNSVGTextPathMethodDEFAULT = ABI30_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI30_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI30_0_0RNSVGTextPathMethodToString( enum ABI30_0_0RNSVGTextPathMethod fw );

enum ABI30_0_0RNSVGTextPathMethod ABI30_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGTextPathMidLine) {
    ABI30_0_0RNSVGTextPathMidLineSharp,
    ABI30_0_0RNSVGTextPathMidLineSmooth,
    ABI30_0_0RNSVGTextPathMidLineDEFAULT = ABI30_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI30_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI30_0_0RNSVGTextPathMidLineToString( enum ABI30_0_0RNSVGTextPathMidLine fw );

enum ABI30_0_0RNSVGTextPathMidLine ABI30_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGTextPathSide) {
    ABI30_0_0RNSVGTextPathSideLeft,
    ABI30_0_0RNSVGTextPathSideRight,
    ABI30_0_0RNSVGTextPathSideDEFAULT = ABI30_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI30_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI30_0_0RNSVGTextPathSideToString( enum ABI30_0_0RNSVGTextPathSide fw );

enum ABI30_0_0RNSVGTextPathSide ABI30_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI30_0_0RNSVGTextPathSpacing) {
    ABI30_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI30_0_0RNSVGTextPathSpacingExact,
    ABI30_0_0RNSVGTextPathSpacingDEFAULT = ABI30_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI30_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI30_0_0RNSVGTextPathSpacingToString( enum ABI30_0_0RNSVGTextPathSpacing fw );

enum ABI30_0_0RNSVGTextPathSpacing ABI30_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
