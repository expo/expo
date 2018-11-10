#import "ABI31_0_0RNSVGTextProperties.h"

#pragma mark - ABI31_0_0RNSVGAlignmentBaseline

NSString* ABI31_0_0RNSVGAlignmentBaselineToString( enum ABI31_0_0RNSVGAlignmentBaseline fw )
{
    return ABI31_0_0RNSVGAlignmentBaselineStrings[fw];
}

enum ABI31_0_0RNSVGAlignmentBaseline ABI31_0_0RNSVGAlignmentBaselineFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGAlignmentBaselineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGAlignmentBaselineStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGAlignmentBaselineDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGFontStyle

NSString* ABI31_0_0RNSVGFontStyleToString( enum ABI31_0_0RNSVGFontStyle fw )
{
    return ABI31_0_0RNSVGFontStyleStrings[fw];
}

enum ABI31_0_0RNSVGFontStyle ABI31_0_0RNSVGFontStyleFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGFontStyleStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGFontStyleStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGFontStyleDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGFontVariantLigatures

NSString* ABI31_0_0RNSVGFontVariantLigaturesToString( enum ABI31_0_0RNSVGFontVariantLigatures fw )
{
    return ABI31_0_0RNSVGFontVariantLigaturesStrings[fw];
}

enum ABI31_0_0RNSVGFontVariantLigatures ABI31_0_0RNSVGFontVariantLigaturesFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGFontVariantLigaturesStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGFontVariantLigaturesStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGFontVariantLigaturesDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGFontWeight

NSString* ABI31_0_0RNSVGFontWeightToString( enum ABI31_0_0RNSVGFontWeight fw )
{
    return ABI31_0_0RNSVGFontWeightStrings[fw];
}

enum ABI31_0_0RNSVGFontWeight ABI31_0_0RNSVGFontWeightFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGFontWeightStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([[s capitalizedString] isEqualToString:ABI31_0_0RNSVGFontWeightStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGFontWeightDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGTextAnchor

NSString* ABI31_0_0RNSVGTextAnchorToString( enum ABI31_0_0RNSVGTextAnchor fw )
{
    return ABI31_0_0RNSVGTextAnchorStrings[fw];
}

enum ABI31_0_0RNSVGTextAnchor ABI31_0_0RNSVGTextAnchorFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGTextAnchorStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGTextAnchorStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGTextAnchorDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGTextDecoration

NSString* ABI31_0_0RNSVGTextDecorationToString( enum ABI31_0_0RNSVGTextDecoration fw )
{
    return ABI31_0_0RNSVGTextDecorationStrings[fw];
}

enum ABI31_0_0RNSVGTextDecoration ABI31_0_0RNSVGTextDecorationFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGTextDecorationStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGTextDecorationStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGTextDecorationDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGTextLengthAdjust

NSString* ABI31_0_0RNSVGTextLengthAdjustToString( enum ABI31_0_0RNSVGTextLengthAdjust fw )
{
    return ABI31_0_0RNSVGTextLengthAdjustStrings[fw];
}

enum ABI31_0_0RNSVGTextLengthAdjust ABI31_0_0RNSVGTextLengthAdjustFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGTextLengthAdjustStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGTextLengthAdjustStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGTextLengthAdjustDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGTextPathMethod

NSString* ABI31_0_0RNSVGTextPathMethodToString( enum ABI31_0_0RNSVGTextPathMethod fw )
{
    return ABI31_0_0RNSVGTextPathMethodStrings[fw];
}

enum ABI31_0_0RNSVGTextPathMethod ABI31_0_0RNSVGTextPathMethodFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGTextPathMethodStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGTextPathMethodStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGTextPathMethodDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGTextPathMidLine

NSString* ABI31_0_0RNSVGTextPathMidLineToString( enum ABI31_0_0RNSVGTextPathMidLine fw )
{
    return ABI31_0_0RNSVGTextPathMidLineStrings[fw];
}

enum ABI31_0_0RNSVGTextPathMidLine ABI31_0_0RNSVGTextPathMidLineFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGTextPathMidLineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGTextPathMidLineStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGTextPathMidLineDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGTextPathSide

NSString* ABI31_0_0RNSVGTextPathSideToString( enum ABI31_0_0RNSVGTextPathSide fw )
{
    return ABI31_0_0RNSVGTextPathSideStrings[fw];
}

enum ABI31_0_0RNSVGTextPathSide ABI31_0_0RNSVGTextPathSideFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGTextPathSideStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGTextPathSideStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGTextPathSideDEFAULT;
}

#pragma mark - ABI31_0_0RNSVGTextPathSpacing

NSString* ABI31_0_0RNSVGTextPathSpacingToString( enum ABI31_0_0RNSVGTextPathSpacing fw )
{
    return ABI31_0_0RNSVGTextPathSpacingStrings[fw];
}

enum ABI31_0_0RNSVGTextPathSpacing ABI31_0_0RNSVGTextPathSpacingFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI31_0_0RNSVGTextPathSpacingStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI31_0_0RNSVGTextPathSpacingStrings[i]]) {
            return i;
        }
    }
    return ABI31_0_0RNSVGTextPathSpacingDEFAULT;
}
