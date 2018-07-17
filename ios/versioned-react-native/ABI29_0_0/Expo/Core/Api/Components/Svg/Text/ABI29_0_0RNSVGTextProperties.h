#import <Foundation/Foundation.h>

#ifndef ABI29_0_0RNTextProperties_h
#define ABI29_0_0RNTextProperties_h

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGAlignmentBaseline) {
    ABI29_0_0RNSVGAlignmentBaselineBaseline,
    ABI29_0_0RNSVGAlignmentBaselineTextBottom,
    ABI29_0_0RNSVGAlignmentBaselineAlphabetic,
    ABI29_0_0RNSVGAlignmentBaselineIdeographic,
    ABI29_0_0RNSVGAlignmentBaselineMiddle,
    ABI29_0_0RNSVGAlignmentBaselineCentral,
    ABI29_0_0RNSVGAlignmentBaselineMathematical,
    ABI29_0_0RNSVGAlignmentBaselineTextTop,
    ABI29_0_0RNSVGAlignmentBaselineBottom,
    ABI29_0_0RNSVGAlignmentBaselineCenter,
    ABI29_0_0RNSVGAlignmentBaselineTop,
    /*
     SVG implementations may support the following aliases in order to support legacy content:
     
     text-before-edge = text-top
     text-after-edge = text-bottom
     */
    ABI29_0_0RNSVGAlignmentBaselineTextBeforeEdge,
    ABI29_0_0RNSVGAlignmentBaselineTextAfterEdge,
    // SVG 1.1
    ABI29_0_0RNSVGAlignmentBaselineBeforeEdge,
    ABI29_0_0RNSVGAlignmentBaselineAfterEdge,
    ABI29_0_0RNSVGAlignmentBaselineHanging,
    ABI29_0_0RNSVGAlignmentBaselineDEFAULT = ABI29_0_0RNSVGAlignmentBaselineBaseline
};

static NSString* const ABI29_0_0RNSVGAlignmentBaselineStrings[] = {
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

NSString* ABI29_0_0RNSVGAlignmentBaselineToString( enum ABI29_0_0RNSVGAlignmentBaseline fw );

enum ABI29_0_0RNSVGAlignmentBaseline ABI29_0_0RNSVGAlignmentBaselineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGFontStyle) {
    ABI29_0_0RNSVGFontStyleNormal,
    ABI29_0_0RNSVGFontStyleItalic,
    ABI29_0_0RNSVGFontStyleOblique,
    ABI29_0_0RNSVGFontStyleDEFAULT = ABI29_0_0RNSVGFontStyleNormal,
};

static NSString* const ABI29_0_0RNSVGFontStyleStrings[] = {@"normal", @"italic", @"oblique", nil};

NSString* ABI29_0_0RNSVGFontStyleToString( enum ABI29_0_0RNSVGFontStyle fw );

enum ABI29_0_0RNSVGFontStyle ABI29_0_0RNSVGFontStyleFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGFontVariantLigatures) {
    ABI29_0_0RNSVGFontVariantLigaturesNormal,
    ABI29_0_0RNSVGFontVariantLigaturesNone,
    ABI29_0_0RNSVGFontVariantLigaturesDEFAULT = ABI29_0_0RNSVGFontVariantLigaturesNormal,
};

static NSString* const ABI29_0_0RNSVGFontVariantLigaturesStrings[] = {@"normal", @"none", nil};

NSString* ABI29_0_0RNSVGFontVariantLigaturesToString( enum ABI29_0_0RNSVGFontVariantLigatures fw );

enum ABI29_0_0RNSVGFontVariantLigatures ABI29_0_0RNSVGFontVariantLigaturesFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGFontWeight) {
    ABI29_0_0RNSVGFontWeightNormal,
    ABI29_0_0RNSVGFontWeightBold,
    ABI29_0_0RNSVGFontWeightBolder,
    ABI29_0_0RNSVGFontWeightLighter,
    ABI29_0_0RNSVGFontWeight100,
    ABI29_0_0RNSVGFontWeight200,
    ABI29_0_0RNSVGFontWeight300,
    ABI29_0_0RNSVGFontWeight400,
    ABI29_0_0RNSVGFontWeight500,
    ABI29_0_0RNSVGFontWeight600,
    ABI29_0_0RNSVGFontWeight700,
    ABI29_0_0RNSVGFontWeight800,
    ABI29_0_0RNSVGFontWeight900,
    ABI29_0_0RNSVGFontWeightDEFAULT = ABI29_0_0RNSVGFontWeightNormal,
};

static NSString* const ABI29_0_0RNSVGFontWeightStrings[] = {@"Normal", @"Bold", @"Bolder", @"Lighter", @"100", @"200", @"300", @"400", @"500", @"600", @"700", @"800", @"900", nil};


NSString* ABI29_0_0RNSVGFontWeightToString( enum ABI29_0_0RNSVGFontWeight fw );

enum ABI29_0_0RNSVGFontWeight ABI29_0_0RNSVGFontWeightFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGTextAnchor) {
    ABI29_0_0RNSVGTextAnchorStart,
    ABI29_0_0RNSVGTextAnchorMiddle,
    ABI29_0_0RNSVGTextAnchorEnd,
    ABI29_0_0RNSVGTextAnchorDEFAULT = ABI29_0_0RNSVGTextAnchorStart,
};

static NSString* const ABI29_0_0RNSVGTextAnchorStrings[] = {@"start", @"middle", @"end", nil};

NSString* ABI29_0_0RNSVGTextAnchorToString( enum ABI29_0_0RNSVGTextAnchor fw );

enum ABI29_0_0RNSVGTextAnchor ABI29_0_0RNSVGTextAnchorFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGTextDecoration) {
    ABI29_0_0RNSVGTextDecorationNone,
    ABI29_0_0RNSVGTextDecorationUnderline,
    ABI29_0_0RNSVGTextDecorationOverline,
    ABI29_0_0RNSVGTextDecorationLineThrough,
    ABI29_0_0RNSVGTextDecorationBlink,
    ABI29_0_0RNSVGTextDecorationDEFAULT = ABI29_0_0RNSVGTextDecorationNone,
};

static NSString* const ABI29_0_0RNSVGTextDecorationStrings[] = {@"None", @"Underline", @"Overline", @"LineThrough", @"Blink", nil};

NSString* ABI29_0_0RNSVGTextDecorationToString( enum ABI29_0_0RNSVGTextDecoration fw );

enum ABI29_0_0RNSVGTextDecoration ABI29_0_0RNSVGTextDecorationFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGTextLengthAdjust) {
    ABI29_0_0RNSVGTextLengthAdjustSpacing,
    ABI29_0_0RNSVGTextLengthAdjustSpacingAndGlyphs,
    ABI29_0_0RNSVGTextLengthAdjustDEFAULT = ABI29_0_0RNSVGTextLengthAdjustSpacing,
};

static NSString* const ABI29_0_0RNSVGTextLengthAdjustStrings[] = {@"spacing", @"spacingAndGlyphs", nil};

NSString* ABI29_0_0RNSVGTextLengthAdjustToString( enum ABI29_0_0RNSVGTextLengthAdjust fw );

enum ABI29_0_0RNSVGTextLengthAdjust ABI29_0_0RNSVGTextLengthAdjustFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGTextPathMethod) {
    ABI29_0_0RNSVGTextPathMethodAlign,
    ABI29_0_0RNSVGTextPathMethodStretch,
    ABI29_0_0RNSVGTextPathMethodDEFAULT = ABI29_0_0RNSVGTextPathMethodAlign,
};

static NSString* const ABI29_0_0RNSVGTextPathMethodStrings[] = {@"align", @"stretch", nil};

NSString* ABI29_0_0RNSVGTextPathMethodToString( enum ABI29_0_0RNSVGTextPathMethod fw );

enum ABI29_0_0RNSVGTextPathMethod ABI29_0_0RNSVGTextPathMethodFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGTextPathMidLine) {
    ABI29_0_0RNSVGTextPathMidLineSharp,
    ABI29_0_0RNSVGTextPathMidLineSmooth,
    ABI29_0_0RNSVGTextPathMidLineDEFAULT = ABI29_0_0RNSVGTextPathMidLineSharp,
};

static NSString* const ABI29_0_0RNSVGTextPathMidLineStrings[] = {@"sharp", @"smooth", nil};

NSString* ABI29_0_0RNSVGTextPathMidLineToString( enum ABI29_0_0RNSVGTextPathMidLine fw );

enum ABI29_0_0RNSVGTextPathMidLine ABI29_0_0RNSVGTextPathMidLineFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGTextPathSide) {
    ABI29_0_0RNSVGTextPathSideLeft,
    ABI29_0_0RNSVGTextPathSideRight,
    ABI29_0_0RNSVGTextPathSideDEFAULT = ABI29_0_0RNSVGTextPathSideLeft,
};

static NSString* const ABI29_0_0RNSVGTextPathSideStrings[] = {@"left", @"right", nil};

NSString* ABI29_0_0RNSVGTextPathSideToString( enum ABI29_0_0RNSVGTextPathSide fw );

enum ABI29_0_0RNSVGTextPathSide ABI29_0_0RNSVGTextPathSideFromString( NSString* s );

typedef NS_ENUM(NSInteger, ABI29_0_0RNSVGTextPathSpacing) {
    ABI29_0_0RNSVGTextPathSpacingAutoSpacing,
    ABI29_0_0RNSVGTextPathSpacingExact,
    ABI29_0_0RNSVGTextPathSpacingDEFAULT = ABI29_0_0RNSVGTextPathSpacingAutoSpacing,
};

static NSString* const ABI29_0_0RNSVGTextPathSpacingStrings[] = {@"auto", @"exact", nil};

NSString* ABI29_0_0RNSVGTextPathSpacingToString( enum ABI29_0_0RNSVGTextPathSpacing fw );

enum ABI29_0_0RNSVGTextPathSpacing ABI29_0_0RNSVGTextPathSpacingFromString( NSString* s );

#endif
