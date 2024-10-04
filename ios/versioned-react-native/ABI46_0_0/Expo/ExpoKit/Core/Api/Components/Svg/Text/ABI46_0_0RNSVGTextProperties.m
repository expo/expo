#import "ABI46_0_0RNSVGTextProperties.h"

#pragma mark - ABI46_0_0RNSVGAlignmentBaseline

NSString* ABI46_0_0RNSVGAlignmentBaselineToString( enum ABI46_0_0RNSVGAlignmentBaseline fw )
{
    return ABI46_0_0RNSVGAlignmentBaselineStrings[fw];
}

enum ABI46_0_0RNSVGAlignmentBaseline ABI46_0_0RNSVGAlignmentBaselineFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGAlignmentBaselineDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGAlignmentBaselineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGAlignmentBaselineStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGAlignmentBaselineDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGFontStyle

NSString* ABI46_0_0RNSVGFontStyleToString( enum ABI46_0_0RNSVGFontStyle fw )
{
    return ABI46_0_0RNSVGFontStyleStrings[fw];
}

enum ABI46_0_0RNSVGFontStyle ABI46_0_0RNSVGFontStyleFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGFontStyleDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGFontStyleStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGFontStyleStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGFontStyleDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGFontVariantLigatures

NSString* ABI46_0_0RNSVGFontVariantLigaturesToString( enum ABI46_0_0RNSVGFontVariantLigatures fw )
{
    return ABI46_0_0RNSVGFontVariantLigaturesStrings[fw];
}

enum ABI46_0_0RNSVGFontVariantLigatures ABI46_0_0RNSVGFontVariantLigaturesFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGFontVariantLigaturesDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGFontVariantLigaturesStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGFontVariantLigaturesStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGFontVariantLigaturesDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGFontWeight

NSString* ABI46_0_0RNSVGFontWeightToString( enum ABI46_0_0RNSVGFontWeight fw )
{
    return ABI46_0_0RNSVGFontWeightStrings[fw];
}

NSInteger ABI46_0_0RNSVGFontWeightFromString( NSString* s )
{
    if ([s length] == 0) {
        return -1;
    }
    const NSInteger l = sizeof(ABI46_0_0RNSVGFontWeightStrings) / sizeof(NSString*);
    for (NSInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGFontWeightStrings[i]]) {
            return i;
        }
    }
    return -1;
}

#pragma mark - ABI46_0_0RNSVGTextAnchor

NSString* ABI46_0_0RNSVGTextAnchorToString( enum ABI46_0_0RNSVGTextAnchor fw )
{
    return ABI46_0_0RNSVGTextAnchorStrings[fw];
}

enum ABI46_0_0RNSVGTextAnchor ABI46_0_0RNSVGTextAnchorFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGTextAnchorDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGTextAnchorStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGTextAnchorStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGTextAnchorDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGTextDecoration

NSString* ABI46_0_0RNSVGTextDecorationToString( enum ABI46_0_0RNSVGTextDecoration fw )
{
    return ABI46_0_0RNSVGTextDecorationStrings[fw];
}

enum ABI46_0_0RNSVGTextDecoration ABI46_0_0RNSVGTextDecorationFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGTextDecorationDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGTextDecorationStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGTextDecorationStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGTextDecorationDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGTextLengthAdjust

NSString* ABI46_0_0RNSVGTextLengthAdjustToString( enum ABI46_0_0RNSVGTextLengthAdjust fw )
{
    return ABI46_0_0RNSVGTextLengthAdjustStrings[fw];
}

enum ABI46_0_0RNSVGTextLengthAdjust ABI46_0_0RNSVGTextLengthAdjustFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGTextLengthAdjustDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGTextLengthAdjustStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGTextLengthAdjustStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGTextLengthAdjustDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGTextPathMethod

NSString* ABI46_0_0RNSVGTextPathMethodToString( enum ABI46_0_0RNSVGTextPathMethod fw )
{
    return ABI46_0_0RNSVGTextPathMethodStrings[fw];
}

enum ABI46_0_0RNSVGTextPathMethod ABI46_0_0RNSVGTextPathMethodFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGTextPathMethodDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGTextPathMethodStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGTextPathMethodStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGTextPathMethodDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGTextPathMidLine

NSString* ABI46_0_0RNSVGTextPathMidLineToString( enum ABI46_0_0RNSVGTextPathMidLine fw )
{
    return ABI46_0_0RNSVGTextPathMidLineStrings[fw];
}

enum ABI46_0_0RNSVGTextPathMidLine ABI46_0_0RNSVGTextPathMidLineFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGTextPathMidLineDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGTextPathMidLineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGTextPathMidLineStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGTextPathMidLineDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGTextPathSide

NSString* ABI46_0_0RNSVGTextPathSideToString( enum ABI46_0_0RNSVGTextPathSide fw )
{
    return ABI46_0_0RNSVGTextPathSideStrings[fw];
}

enum ABI46_0_0RNSVGTextPathSide ABI46_0_0RNSVGTextPathSideFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGTextPathSideDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGTextPathSideStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGTextPathSideStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGTextPathSideDEFAULT;
}

#pragma mark - ABI46_0_0RNSVGTextPathSpacing

NSString* ABI46_0_0RNSVGTextPathSpacingToString( enum ABI46_0_0RNSVGTextPathSpacing fw )
{
    return ABI46_0_0RNSVGTextPathSpacingStrings[fw];
}

enum ABI46_0_0RNSVGTextPathSpacing ABI46_0_0RNSVGTextPathSpacingFromString( NSString* s )
{
    if ([s length] == 0) {
        return ABI46_0_0RNSVGTextPathSpacingDEFAULT;
    }
    const NSUInteger l = sizeof(ABI46_0_0RNSVGTextPathSpacingStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:ABI46_0_0RNSVGTextPathSpacingStrings[i]]) {
            return i;
        }
    }
    return ABI46_0_0RNSVGTextPathSpacingDEFAULT;
}
