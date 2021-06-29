#import "ABI41_0_0RNSVGTextProperties.h"

#pragma mark - ABI41_0_0RNSVGAlignmentBaseline

NSString* ABI41_0_0RNSVGAlignmentBaselineToString( enum ABI41_0_0RNSVGAlignmentBaseline fw )
{
    return ABI41_0_0RNSVGAlignmentBaselineStrings[fw];
}

enum ABI41_0_0RNSVGAlignmentBaseline ABI41_0_0RNSVGAlignmentBaselineFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGAlignmentBaselineDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGAlignmentBaselineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGAlignmentBaselineStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGAlignmentBaselineDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGFontStyle

NSString* ABI41_0_0RNSVGFontStyleToString( enum ABI41_0_0RNSVGFontStyle fw )
{
    return ABI41_0_0RNSVGFontStyleStrings[fw];
}

enum ABI41_0_0RNSVGFontStyle ABI41_0_0RNSVGFontStyleFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGFontStyleDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGFontStyleStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGFontStyleStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGFontStyleDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGFontVariantLigatures

NSString* ABI41_0_0RNSVGFontVariantLigaturesToString( enum ABI41_0_0RNSVGFontVariantLigatures fw )
{
    return ABI41_0_0RNSVGFontVariantLigaturesStrings[fw];
}

enum ABI41_0_0RNSVGFontVariantLigatures ABI41_0_0RNSVGFontVariantLigaturesFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGFontVariantLigaturesDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGFontVariantLigaturesStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGFontVariantLigaturesStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGFontVariantLigaturesDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGFontWeight

NSString* ABI41_0_0RNSVGFontWeightToString( enum ABI41_0_0RNSVGFontWeight fw )
{
    return ABI41_0_0RNSVGFontWeightStrings[fw];
}

NSInteger ABI41_0_0RNSVGFontWeightFromString( NSString* s )
{
    if ([s length] == 0) {
        return -1;
    }
    const NSInteger l = sizeof(ABI41_0_0RNSVGFontWeightStrings) / sizeof(NSString*);
    for (NSInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGFontWeightStrings[i]]) {
            return i;
        }
    }
    return -1;
}

#pragma mark - ABI41_0_0RNSVGTextAnchor

NSString* ABI41_0_0RNSVGTextAnchorToString( enum ABI41_0_0RNSVGTextAnchor fw )
{
    return ABI41_0_0RNSVGTextAnchorStrings[fw];
}

enum ABI41_0_0RNSVGTextAnchor ABI41_0_0RNSVGTextAnchorFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGTextAnchorDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGTextAnchorStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGTextAnchorStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGTextAnchorDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGTextDecoration

NSString* ABI41_0_0RNSVGTextDecorationToString( enum ABI41_0_0RNSVGTextDecoration fw )
{
    return ABI41_0_0RNSVGTextDecorationStrings[fw];
}

enum ABI41_0_0RNSVGTextDecoration ABI41_0_0RNSVGTextDecorationFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGTextDecorationDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGTextDecorationStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGTextDecorationStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGTextDecorationDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGTextLengthAdjust

NSString* ABI41_0_0RNSVGTextLengthAdjustToString( enum ABI41_0_0RNSVGTextLengthAdjust fw )
{
    return ABI41_0_0RNSVGTextLengthAdjustStrings[fw];
}

enum ABI41_0_0RNSVGTextLengthAdjust ABI41_0_0RNSVGTextLengthAdjustFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGTextLengthAdjustDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGTextLengthAdjustStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGTextLengthAdjustStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGTextLengthAdjustDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGTextPathMethod

NSString* ABI41_0_0RNSVGTextPathMethodToString( enum ABI41_0_0RNSVGTextPathMethod fw )
{
    return ABI41_0_0RNSVGTextPathMethodStrings[fw];
}

enum ABI41_0_0RNSVGTextPathMethod ABI41_0_0RNSVGTextPathMethodFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGTextPathMethodDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGTextPathMethodStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGTextPathMethodStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGTextPathMethodDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGTextPathMidLine

NSString* ABI41_0_0RNSVGTextPathMidLineToString( enum ABI41_0_0RNSVGTextPathMidLine fw )
{
    return ABI41_0_0RNSVGTextPathMidLineStrings[fw];
}

enum ABI41_0_0RNSVGTextPathMidLine ABI41_0_0RNSVGTextPathMidLineFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGTextPathMidLineDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGTextPathMidLineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGTextPathMidLineStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGTextPathMidLineDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGTextPathSide

NSString* ABI41_0_0RNSVGTextPathSideToString( enum ABI41_0_0RNSVGTextPathSide fw )
{
    return ABI41_0_0RNSVGTextPathSideStrings[fw];
}

enum ABI41_0_0RNSVGTextPathSide ABI41_0_0RNSVGTextPathSideFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGTextPathSideDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGTextPathSideStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGTextPathSideStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGTextPathSideDEFAULT;
}

#pragma mark - ABI41_0_0RNSVGTextPathSpacing

NSString* ABI41_0_0RNSVGTextPathSpacingToString( enum ABI41_0_0RNSVGTextPathSpacing fw )
{
    return ABI41_0_0RNSVGTextPathSpacingStrings[fw];
}

enum ABI41_0_0RNSVGTextPathSpacing ABI41_0_0RNSVGTextPathSpacingFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI41_0_0RNSVGTextPathSpacingDEFAULT;
    }
    const NSUInteger l = sizeof(ABI41_0_0RNSVGTextPathSpacingStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI41_0_0RNSVGTextPathSpacingStrings[i]]) {
            return i;
        }
    }
    return ABI41_0_0RNSVGTextPathSpacingDEFAULT;
}
