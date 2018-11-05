#import <Foundation/Foundation.h>

#ifndef ABI27_0_0RNTextProperties_h
#define ABI27_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGAlignmentBaseline) {
    ABI27_0_0RNSVGAlignmentBaselineBaseline,
    ABI27_0_0RNSVGAlignmentBaselineTextBottom,
    ABI27_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI27_0_0RNSVGAlignmentBaselineIdeographic,
    ABI27_0_0RNSVGAlignmentBaselineMiddle,
    ABI27_0_0RNSVGAlignmentBaselineCentral,
    ABI27_0_0RNSVGAlignmentBaselineMathematical,
    ABI27_0_0RNSVGAlignmentBaselineTextTop,
    ABI27_0_0RNSVGAlignmentBaselineBottom,
    ABI27_0_0RNSVGAlignmentBaselineCenter,
    ABI27_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI27_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI27_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI27_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI27_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI27_0_0RNSVGAlignmentBaselineHanging,
    ABI27_0_0RNSVGAlignmentBaselineDEFAULT = ABI27_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI27_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI27_0_0RNSVGAlignmentBaselineToString( enum ABI27_0_0RNSVGAlignmentBaseline fw );

enum ABI27_0_0RNSVGAlignmentBaseline ABI27_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGFontStyle) {
    ABI27_0_0RNSVGFontStyleNormal,
    ABI27_0_0RNSVGFontStyleItalic,
    ABI27_0_0RNSVGFontStyleOblique,
    ABI27_0_0RNSVGFontStyleDEFAULT = ABI27_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI27_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI27_0_0RNSVGFontStyleToString( enum ABI27_0_0RNSVGFontStyle fw );

enum ABI27_0_0RNSVGFontStyle ABI27_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGFontVariantLigatures) {
    ABI27_0_0RNSVGFontVariantLigaturesNormal,
    ABI27_0_0RNSVGFontVariantLigaturesNone,
    ABI27_0_0RNSVGFontVariantLigaturesDEFAULT = ABI27_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI27_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI27_0_0RNSVGFontVariantLigaturesToString( enum ABI27_0_0RNSVGFontVariantLigatures fw );

enum ABI27_0_0RNSVGFontVariantLigatures ABI27_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGFontWeight) {
    ABI27_0_0RNSVGFontWeightNormal,
    ABI27_0_0RNSVGFontWeightBold,
    ABI27_0_0RNSVGFontWeightBolder,
    ABI27_0_0RNSVGFontWeightLighter,
    ABI27_0_0RNSVGFontWeight100,
    ABI27_0_0RNSVGFontWeight200,
    ABI27_0_0RNSVGFontWeight300,
    ABI27_0_0RNSVGFontWeight400,
    ABI27_0_0RNSVGFontWeight500,
    ABI27_0_0RNSVGFontWeight600,
    ABI27_0_0RNSVGFontWeight700,
    ABI27_0_0RNSVGFontWeight800,
    ABI27_0_0RNSVGFontWeight900,
    ABI27_0_0RNSVGFontWeightDEFAULT = ABI27_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI27_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI27_0_0RNSVGFontWeightToString( enum ABI27_0_0RNSVGFontWeight fw );

enum ABI27_0_0RNSVGFontWeight ABI27_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGTextAnchor) {
    ABI27_0_0RNSVGTextAnchorStart,
    ABI27_0_0RNSVGTextAnchorMiddle,
    ABI27_0_0RNSVGTextAnchorEnd,
    ABI27_0_0RNSVGTextAnchorDEFAULT = ABI27_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI27_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI27_0_0RNSVGTextAnchorToString( enum ABI27_0_0RNSVGTextAnchor fw );

enum ABI27_0_0RNSVGTextAnchor ABI27_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGTextDecoration) {
    ABI27_0_0RNSVGTextDecorationNone,
    ABI27_0_0RNSVGTextDecorationUnderline,
    ABI27_0_0RNSVGTextDecorationOverline,
    ABI27_0_0RNSVGTextDecorationLineThrough,
    ABI27_0_0RNSVGTextDecorationBlink,
    ABI27_0_0RNSVGTextDecorationDEFAULT = ABI27_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI27_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI27_0_0RNSVGTextDecorationToString( enum ABI27_0_0RNSVGTextDecoration fw );

enum ABI27_0_0RNSVGTextDecoration ABI27_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGTextLengthAdjust) {
    ABI27_0_0RNSVGTextLengthAdjustSpacing,
    ABI27_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI27_0_0RNSVGTextLengthAdjustDEFAULT = ABI27_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI27_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI27_0_0RNSVGTextLengthAdjustToString( enum ABI27_0_0RNSVGTextLengthAdjust fw );

enum ABI27_0_0RNSVGTextLengthAdjust ABI27_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGTextPathMethod) {
    ABI27_0_0RNSVGTextPathMethodAlign,
    ABI27_0_0RNSVGTextPathMethodStretch,
    ABI27_0_0RNSVGTextPathMethodDEFAULT = ABI27_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI27_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI27_0_0RNSVGTextPathMethodToString( enum ABI27_0_0RNSVGTextPathMethod fw );

enum ABI27_0_0RNSVGTextPathMethod ABI27_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGTextPathMidLine) {
    ABI27_0_0RNSVGTextPathMidLineSharp,
    ABI27_0_0RNSVGTextPathMidLineSmooth,
    ABI27_0_0RNSVGTextPathMidLineDEFAULT = ABI27_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI27_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI27_0_0RNSVGTextPathMidLineToString( enum ABI27_0_0RNSVGTextPathMidLine fw );

enum ABI27_0_0RNSVGTextPathMidLine ABI27_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGTextPathSide) {
    ABI27_0_0RNSVGTextPathSideLeft,
    ABI27_0_0RNSVGTextPathSideRight,
    ABI27_0_0RNSVGTextPathSideDEFAULT = ABI27_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI27_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI27_0_0RNSVGTextPathSideToString( enum ABI27_0_0RNSVGTextPathSide fw );

enum ABI27_0_0RNSVGTextPathSide ABI27_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI27_0_0RNSVGTextPathSpacing) {
    ABI27_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI27_0_0RNSVGTextPathSpacingExact,
    ABI27_0_0RNSVGTextPathSpacingDEFAULT = ABI27_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI27_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI27_0_0RNSVGTextPathSpacingToString( enum ABI27_0_0RNSVGTextPathSpacing fw );

enum ABI27_0_0RNSVGTextPathSpacing ABI27_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
