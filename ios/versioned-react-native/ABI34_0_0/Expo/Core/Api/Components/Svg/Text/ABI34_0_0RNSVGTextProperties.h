#import <Foundation/Foundation.h>

#ifndef ABI34_0_0RNTextProperties_h
#define ABI34_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGAlignmentBaseline) {
    ABI34_0_0RNSVGAlignmentBaselineBaseline,
    ABI34_0_0RNSVGAlignmentBaselineTextBottom,
    ABI34_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI34_0_0RNSVGAlignmentBaselineIdeographic,
    ABI34_0_0RNSVGAlignmentBaselineMiddle,
    ABI34_0_0RNSVGAlignmentBaselineCentral,
    ABI34_0_0RNSVGAlignmentBaselineMathematical,
    ABI34_0_0RNSVGAlignmentBaselineTextTop,
    ABI34_0_0RNSVGAlignmentBaselineBottom,
    ABI34_0_0RNSVGAlignmentBaselineCenter,
    ABI34_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI34_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI34_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI34_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI34_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI34_0_0RNSVGAlignmentBaselineHanging,
    ABI34_0_0RNSVGAlignmentBaselineDEFAULT = ABI34_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI34_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI34_0_0RNSVGAlignmentBaselineToString( enum ABI34_0_0RNSVGAlignmentBaseline fw );

enum ABI34_0_0RNSVGAlignmentBaseline ABI34_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGFontStyle) {
    ABI34_0_0RNSVGFontStyleNormal,
    ABI34_0_0RNSVGFontStyleItalic,
    ABI34_0_0RNSVGFontStyleOblique,
    ABI34_0_0RNSVGFontStyleDEFAULT = ABI34_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI34_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI34_0_0RNSVGFontStyleToString( enum ABI34_0_0RNSVGFontStyle fw );

enum ABI34_0_0RNSVGFontStyle ABI34_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGFontVariantLigatures) {
    ABI34_0_0RNSVGFontVariantLigaturesNormal,
    ABI34_0_0RNSVGFontVariantLigaturesNone,
    ABI34_0_0RNSVGFontVariantLigaturesDEFAULT = ABI34_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI34_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI34_0_0RNSVGFontVariantLigaturesToString( enum ABI34_0_0RNSVGFontVariantLigatures fw );

enum ABI34_0_0RNSVGFontVariantLigatures ABI34_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGFontWeight) {
    ABI34_0_0RNSVGFontWeightNormal,
    ABI34_0_0RNSVGFontWeightBold,
    ABI34_0_0RNSVGFontWeightBolder,
    ABI34_0_0RNSVGFontWeightLighter,
    ABI34_0_0RNSVGFontWeight100,
    ABI34_0_0RNSVGFontWeight200,
    ABI34_0_0RNSVGFontWeight300,
    ABI34_0_0RNSVGFontWeight400,
    ABI34_0_0RNSVGFontWeight500,
    ABI34_0_0RNSVGFontWeight600,
    ABI34_0_0RNSVGFontWeight700,
    ABI34_0_0RNSVGFontWeight800,
    ABI34_0_0RNSVGFontWeight900,
    ABI34_0_0RNSVGFontWeightDEFAULT = ABI34_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI34_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI34_0_0RNSVGFontWeightToString( enum ABI34_0_0RNSVGFontWeight fw );

enum ABI34_0_0RNSVGFontWeight ABI34_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGTextAnchor) {
    ABI34_0_0RNSVGTextAnchorStart,
    ABI34_0_0RNSVGTextAnchorMiddle,
    ABI34_0_0RNSVGTextAnchorEnd,
    ABI34_0_0RNSVGTextAnchorDEFAULT = ABI34_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI34_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI34_0_0RNSVGTextAnchorToString( enum ABI34_0_0RNSVGTextAnchor fw );

enum ABI34_0_0RNSVGTextAnchor ABI34_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGTextDecoration) {
    ABI34_0_0RNSVGTextDecorationNone,
    ABI34_0_0RNSVGTextDecorationUnderline,
    ABI34_0_0RNSVGTextDecorationOverline,
    ABI34_0_0RNSVGTextDecorationLineThrough,
    ABI34_0_0RNSVGTextDecorationBlink,
    ABI34_0_0RNSVGTextDecorationDEFAULT = ABI34_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI34_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI34_0_0RNSVGTextDecorationToString( enum ABI34_0_0RNSVGTextDecoration fw );

enum ABI34_0_0RNSVGTextDecoration ABI34_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGTextLengthAdjust) {
    ABI34_0_0RNSVGTextLengthAdjustSpacing,
    ABI34_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI34_0_0RNSVGTextLengthAdjustDEFAULT = ABI34_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI34_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI34_0_0RNSVGTextLengthAdjustToString( enum ABI34_0_0RNSVGTextLengthAdjust fw );

enum ABI34_0_0RNSVGTextLengthAdjust ABI34_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGTextPathMethod) {
    ABI34_0_0RNSVGTextPathMethodAlign,
    ABI34_0_0RNSVGTextPathMethodStretch,
    ABI34_0_0RNSVGTextPathMethodDEFAULT = ABI34_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI34_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI34_0_0RNSVGTextPathMethodToString( enum ABI34_0_0RNSVGTextPathMethod fw );

enum ABI34_0_0RNSVGTextPathMethod ABI34_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGTextPathMidLine) {
    ABI34_0_0RNSVGTextPathMidLineSharp,
    ABI34_0_0RNSVGTextPathMidLineSmooth,
    ABI34_0_0RNSVGTextPathMidLineDEFAULT = ABI34_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI34_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI34_0_0RNSVGTextPathMidLineToString( enum ABI34_0_0RNSVGTextPathMidLine fw );

enum ABI34_0_0RNSVGTextPathMidLine ABI34_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGTextPathSide) {
    ABI34_0_0RNSVGTextPathSideLeft,
    ABI34_0_0RNSVGTextPathSideRight,
    ABI34_0_0RNSVGTextPathSideDEFAULT = ABI34_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI34_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI34_0_0RNSVGTextPathSideToString( enum ABI34_0_0RNSVGTextPathSide fw );

enum ABI34_0_0RNSVGTextPathSide ABI34_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI34_0_0RNSVGTextPathSpacing) {
    ABI34_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI34_0_0RNSVGTextPathSpacingExact,
    ABI34_0_0RNSVGTextPathSpacingDEFAULT = ABI34_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI34_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI34_0_0RNSVGTextPathSpacingToString( enum ABI34_0_0RNSVGTextPathSpacing fw );

enum ABI34_0_0RNSVGTextPathSpacing ABI34_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
