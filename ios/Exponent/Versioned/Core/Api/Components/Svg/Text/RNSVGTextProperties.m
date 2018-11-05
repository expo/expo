#import "RNSVGTextProperties.h"

#pragma mark - RNSVGAlignmentBaseline

NSString* RNSVGAlignmentBaselineToString( enum RNSVGAlignmentBaseline fw )
{
    return RNSVGAlignmentBaselineStrings[fw];
}

enum RNSVGAlignmentBaseline RNSVGAlignmentBaselineFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGAlignmentBaselineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGAlignmentBaselineStrings[i]]) {
            return i;
        }
    }
    return RNSVGAlignmentBaselineDEFAULT;
}

#pragma mark - RNSVGFontStyle

NSString* RNSVGFontStyleToString( enum RNSVGFontStyle fw )
{
    return RNSVGFontStyleStrings[fw];
}

enum RNSVGFontStyle RNSVGFontStyleFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGFontStyleStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGFontStyleStrings[i]]) {
            return i;
        }
    }
    return RNSVGFontStyleDEFAULT;
}

#pragma mark - RNSVGFontVariantLigatures

NSString* RNSVGFontVariantLigaturesToString( enum RNSVGFontVariantLigatures fw )
{
    return RNSVGFontVariantLigaturesStrings[fw];
}

enum RNSVGFontVariantLigatures RNSVGFontVariantLigaturesFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGFontVariantLigaturesStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGFontVariantLigaturesStrings[i]]) {
            return i;
        }
    }
    return RNSVGFontVariantLigaturesDEFAULT;
}

#pragma mark - RNSVGFontWeight

NSString* RNSVGFontWeightToString( enum RNSVGFontWeight fw )
{
    return RNSVGFontWeightStrings[fw];
}

enum RNSVGFontWeight RNSVGFontWeightFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGFontWeightStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([[s capitalizedString] isEqualToString:RNSVGFontWeightStrings[i]]) {
            return i;
        }
    }
    return RNSVGFontWeightDEFAULT;
}

#pragma mark - RNSVGTextAnchor

NSString* RNSVGTextAnchorToString( enum RNSVGTextAnchor fw )
{
    return RNSVGTextAnchorStrings[fw];
}

enum RNSVGTextAnchor RNSVGTextAnchorFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGTextAnchorStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGTextAnchorStrings[i]]) {
            return i;
        }
    }
    return RNSVGTextAnchorDEFAULT;
}

#pragma mark - RNSVGTextDecoration

NSString* RNSVGTextDecorationToString( enum RNSVGTextDecoration fw )
{
    return RNSVGTextDecorationStrings[fw];
}

enum RNSVGTextDecoration RNSVGTextDecorationFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGTextDecorationStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGTextDecorationStrings[i]]) {
            return i;
        }
    }
    return RNSVGTextDecorationDEFAULT;
}

#pragma mark - RNSVGTextLengthAdjust

NSString* RNSVGTextLengthAdjustToString( enum RNSVGTextLengthAdjust fw )
{
    return RNSVGTextLengthAdjustStrings[fw];
}

enum RNSVGTextLengthAdjust RNSVGTextLengthAdjustFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGTextLengthAdjustStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGTextLengthAdjustStrings[i]]) {
            return i;
        }
    }
    return RNSVGTextLengthAdjustDEFAULT;
}

#pragma mark - RNSVGTextPathMethod

NSString* RNSVGTextPathMethodToString( enum RNSVGTextPathMethod fw )
{
    return RNSVGTextPathMethodStrings[fw];
}

enum RNSVGTextPathMethod RNSVGTextPathMethodFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGTextPathMethodStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGTextPathMethodStrings[i]]) {
            return i;
        }
    }
    return RNSVGTextPathMethodDEFAULT;
}

#pragma mark - RNSVGTextPathMidLine

NSString* RNSVGTextPathMidLineToString( enum RNSVGTextPathMidLine fw )
{
    return RNSVGTextPathMidLineStrings[fw];
}

enum RNSVGTextPathMidLine RNSVGTextPathMidLineFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGTextPathMidLineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGTextPathMidLineStrings[i]]) {
            return i;
        }
    }
    return RNSVGTextPathMidLineDEFAULT;
}

#pragma mark - RNSVGTextPathSide

NSString* RNSVGTextPathSideToString( enum RNSVGTextPathSide fw )
{
    return RNSVGTextPathSideStrings[fw];
}

enum RNSVGTextPathSide RNSVGTextPathSideFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGTextPathSideStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGTextPathSideStrings[i]]) {
            return i;
        }
    }
    return RNSVGTextPathSideDEFAULT;
}

#pragma mark - RNSVGTextPathSpacing

NSString* RNSVGTextPathSpacingToString( enum RNSVGTextPathSpacing fw )
{
    return RNSVGTextPathSpacingStrings[fw];
}

enum RNSVGTextPathSpacing RNSVGTextPathSpacingFromString( NSString* s )
{
    const NSUInteger l = sizeof(RNSVGTextPathSpacingStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:RNSVGTextPathSpacingStrings[i]]) {
            return i;
        }
    }
    return RNSVGTextPathSpacingDEFAULT;
}
