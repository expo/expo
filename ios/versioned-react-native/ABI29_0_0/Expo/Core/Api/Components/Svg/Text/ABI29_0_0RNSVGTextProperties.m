#import "ABI29_0_0RNSVGTextProperties.h"

#pragma mark - ABI29_0_0RNSVGAlignmentBaseline

NSString* ABI29_0_0RNSVGAlignmentBaselineToString( enum ABI29_0_0RNSVGAlignmentBaseline fw )
{
    return ABI29_0_0RNSVGAlignmentBaselineStrings[fw];
}

enum ABI29_0_0RNSVGAlignmentBaseline ABI29_0_0RNSVGAlignmentBaselineFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGAlignmentBaselineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGAlignmentBaselineStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGAlignmentBaselineDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGFontStyle

NSString* ABI29_0_0RNSVGFontStyleToString( enum ABI29_0_0RNSVGFontStyle fw )
{
    return ABI29_0_0RNSVGFontStyleStrings[fw];
}

enum ABI29_0_0RNSVGFontStyle ABI29_0_0RNSVGFontStyleFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGFontStyleStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGFontStyleStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGFontStyleDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGFontVariantLigatures

NSString* ABI29_0_0RNSVGFontVariantLigaturesToString( enum ABI29_0_0RNSVGFontVariantLigatures fw )
{
    return ABI29_0_0RNSVGFontVariantLigaturesStrings[fw];
}

enum ABI29_0_0RNSVGFontVariantLigatures ABI29_0_0RNSVGFontVariantLigaturesFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGFontVariantLigaturesStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGFontVariantLigaturesStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGFontVariantLigaturesDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGFontWeight

NSString* ABI29_0_0RNSVGFontWeightToString( enum ABI29_0_0RNSVGFontWeight fw )
{
    return ABI29_0_0RNSVGFontWeightStrings[fw];
}

enum ABI29_0_0RNSVGFontWeight ABI29_0_0RNSVGFontWeightFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGFontWeightStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([[s capitalizedString] isEqualToString:ABI29_0_0RNSVGFontWeightStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGFontWeightDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGTextAnchor

NSString* ABI29_0_0RNSVGTextAnchorToString( enum ABI29_0_0RNSVGTextAnchor fw )
{
    return ABI29_0_0RNSVGTextAnchorStrings[fw];
}

enum ABI29_0_0RNSVGTextAnchor ABI29_0_0RNSVGTextAnchorFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGTextAnchorStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGTextAnchorStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGTextAnchorDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGTextDecoration

NSString* ABI29_0_0RNSVGTextDecorationToString( enum ABI29_0_0RNSVGTextDecoration fw )
{
    return ABI29_0_0RNSVGTextDecorationStrings[fw];
}

enum ABI29_0_0RNSVGTextDecoration ABI29_0_0RNSVGTextDecorationFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGTextDecorationStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGTextDecorationStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGTextDecorationDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGTextLengthAdjust

NSString* ABI29_0_0RNSVGTextLengthAdjustToString( enum ABI29_0_0RNSVGTextLengthAdjust fw )
{
    return ABI29_0_0RNSVGTextLengthAdjustStrings[fw];
}

enum ABI29_0_0RNSVGTextLengthAdjust ABI29_0_0RNSVGTextLengthAdjustFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGTextLengthAdjustStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGTextLengthAdjustStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGTextLengthAdjustDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGTextPathMethod

NSString* ABI29_0_0RNSVGTextPathMethodToString( enum ABI29_0_0RNSVGTextPathMethod fw )
{
    return ABI29_0_0RNSVGTextPathMethodStrings[fw];
}

enum ABI29_0_0RNSVGTextPathMethod ABI29_0_0RNSVGTextPathMethodFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGTextPathMethodStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGTextPathMethodStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGTextPathMethodDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGTextPathMidLine

NSString* ABI29_0_0RNSVGTextPathMidLineToString( enum ABI29_0_0RNSVGTextPathMidLine fw )
{
    return ABI29_0_0RNSVGTextPathMidLineStrings[fw];
}

enum ABI29_0_0RNSVGTextPathMidLine ABI29_0_0RNSVGTextPathMidLineFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGTextPathMidLineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGTextPathMidLineStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGTextPathMidLineDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGTextPathSide

NSString* ABI29_0_0RNSVGTextPathSideToString( enum ABI29_0_0RNSVGTextPathSide fw )
{
    return ABI29_0_0RNSVGTextPathSideStrings[fw];
}

enum ABI29_0_0RNSVGTextPathSide ABI29_0_0RNSVGTextPathSideFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGTextPathSideStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGTextPathSideStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGTextPathSideDEFAULT;
}

#pragma mark - ABI29_0_0RNSVGTextPathSpacing

NSString* ABI29_0_0RNSVGTextPathSpacingToString( enum ABI29_0_0RNSVGTextPathSpacing fw )
{
    return ABI29_0_0RNSVGTextPathSpacingStrings[fw];
}

enum ABI29_0_0RNSVGTextPathSpacing ABI29_0_0RNSVGTextPathSpacingFromString( NSString* s )
{
    const NSUInteger l = sizeof(ABI29_0_0RNSVGTextPathSpacingStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI29_0_0RNSVGTextPathSpacingStrings[i]]) {
            return i;
        }
    }
    return ABI29_0_0RNSVGTextPathSpacingDEFAULT;
}
