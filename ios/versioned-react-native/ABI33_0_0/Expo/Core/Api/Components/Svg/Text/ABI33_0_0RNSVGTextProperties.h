#import <Foundation/Foundation.h>

#ifndef ABI33_0_0RNTextProperties_h
#define ABI33_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGAlignmentBaseline) {
    ABI33_0_0RNSVGAlignmentBaselineBaseline,
    ABI33_0_0RNSVGAlignmentBaselineTextBottom,
    ABI33_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI33_0_0RNSVGAlignmentBaselineIdeographic,
    ABI33_0_0RNSVGAlignmentBaselineMiddle,
    ABI33_0_0RNSVGAlignmentBaselineCentral,
    ABI33_0_0RNSVGAlignmentBaselineMathematical,
    ABI33_0_0RNSVGAlignmentBaselineTextTop,
    ABI33_0_0RNSVGAlignmentBaselineBottom,
    ABI33_0_0RNSVGAlignmentBaselineCenter,
    ABI33_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI33_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI33_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI33_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI33_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI33_0_0RNSVGAlignmentBaselineHanging,
    ABI33_0_0RNSVGAlignmentBaselineDEFAULT = ABI33_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI33_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI33_0_0RNSVGAlignmentBaselineToString( enum ABI33_0_0RNSVGAlignmentBaseline fw );

enum ABI33_0_0RNSVGAlignmentBaseline ABI33_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGFontStyle) {
    ABI33_0_0RNSVGFontStyleNormal,
    ABI33_0_0RNSVGFontStyleItalic,
    ABI33_0_0RNSVGFontStyleOblique,
    ABI33_0_0RNSVGFontStyleDEFAULT = ABI33_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI33_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI33_0_0RNSVGFontStyleToString( enum ABI33_0_0RNSVGFontStyle fw );

enum ABI33_0_0RNSVGFontStyle ABI33_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGFontVariantLigatures) {
    ABI33_0_0RNSVGFontVariantLigaturesNormal,
    ABI33_0_0RNSVGFontVariantLigaturesNone,
    ABI33_0_0RNSVGFontVariantLigaturesDEFAULT = ABI33_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI33_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI33_0_0RNSVGFontVariantLigaturesToString( enum ABI33_0_0RNSVGFontVariantLigatures fw );

enum ABI33_0_0RNSVGFontVariantLigatures ABI33_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGFontWeight) {
    ABI33_0_0RNSVGFontWeightNormal,
    ABI33_0_0RNSVGFontWeightBold,
    ABI33_0_0RNSVGFontWeightBolder,
    ABI33_0_0RNSVGFontWeightLighter,
    ABI33_0_0RNSVGFontWeight100,
    ABI33_0_0RNSVGFontWeight200,
    ABI33_0_0RNSVGFontWeight300,
    ABI33_0_0RNSVGFontWeight400,
    ABI33_0_0RNSVGFontWeight500,
    ABI33_0_0RNSVGFontWeight600,
    ABI33_0_0RNSVGFontWeight700,
    ABI33_0_0RNSVGFontWeight800,
    ABI33_0_0RNSVGFontWeight900,
    ABI33_0_0RNSVGFontWeightDEFAULT = ABI33_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI33_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI33_0_0RNSVGFontWeightToString( enum ABI33_0_0RNSVGFontWeight fw );

enum ABI33_0_0RNSVGFontWeight ABI33_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGTextAnchor) {
    ABI33_0_0RNSVGTextAnchorStart,
    ABI33_0_0RNSVGTextAnchorMiddle,
    ABI33_0_0RNSVGTextAnchorEnd,
    ABI33_0_0RNSVGTextAnchorDEFAULT = ABI33_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI33_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI33_0_0RNSVGTextAnchorToString( enum ABI33_0_0RNSVGTextAnchor fw );

enum ABI33_0_0RNSVGTextAnchor ABI33_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGTextDecoration) {
    ABI33_0_0RNSVGTextDecorationNone,
    ABI33_0_0RNSVGTextDecorationUnderline,
    ABI33_0_0RNSVGTextDecorationOverline,
    ABI33_0_0RNSVGTextDecorationLineThrough,
    ABI33_0_0RNSVGTextDecorationBlink,
    ABI33_0_0RNSVGTextDecorationDEFAULT = ABI33_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI33_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI33_0_0RNSVGTextDecorationToString( enum ABI33_0_0RNSVGTextDecoration fw );

enum ABI33_0_0RNSVGTextDecoration ABI33_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGTextLengthAdjust) {
    ABI33_0_0RNSVGTextLengthAdjustSpacing,
    ABI33_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI33_0_0RNSVGTextLengthAdjustDEFAULT = ABI33_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI33_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI33_0_0RNSVGTextLengthAdjustToString( enum ABI33_0_0RNSVGTextLengthAdjust fw );

enum ABI33_0_0RNSVGTextLengthAdjust ABI33_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGTextPathMethod) {
    ABI33_0_0RNSVGTextPathMethodAlign,
    ABI33_0_0RNSVGTextPathMethodStretch,
    ABI33_0_0RNSVGTextPathMethodDEFAULT = ABI33_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI33_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI33_0_0RNSVGTextPathMethodToString( enum ABI33_0_0RNSVGTextPathMethod fw );

enum ABI33_0_0RNSVGTextPathMethod ABI33_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGTextPathMidLine) {
    ABI33_0_0RNSVGTextPathMidLineSharp,
    ABI33_0_0RNSVGTextPathMidLineSmooth,
    ABI33_0_0RNSVGTextPathMidLineDEFAULT = ABI33_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI33_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI33_0_0RNSVGTextPathMidLineToString( enum ABI33_0_0RNSVGTextPathMidLine fw );

enum ABI33_0_0RNSVGTextPathMidLine ABI33_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGTextPathSide) {
    ABI33_0_0RNSVGTextPathSideLeft,
    ABI33_0_0RNSVGTextPathSideRight,
    ABI33_0_0RNSVGTextPathSideDEFAULT = ABI33_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI33_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI33_0_0RNSVGTextPathSideToString( enum ABI33_0_0RNSVGTextPathSide fw );

enum ABI33_0_0RNSVGTextPathSide ABI33_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI33_0_0RNSVGTextPathSpacing) {
    ABI33_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI33_0_0RNSVGTextPathSpacingExact,
    ABI33_0_0RNSVGTextPathSpacingDEFAULT = ABI33_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI33_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI33_0_0RNSVGTextPathSpacingToString( enum ABI33_0_0RNSVGTextPathSpacing fw );

enum ABI33_0_0RNSVGTextPathSpacing ABI33_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
