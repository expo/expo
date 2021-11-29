#import "DevLauncherRNSVGTextProperties.h"

#pragma mark - DevLauncherRNSVGAlignmentBaseline

NSString* DevLauncherRNSVGAlignmentBaselineToString( enum DevLauncherRNSVGAlignmentBaseline fw )
{
    return DevLauncherRNSVGAlignmentBaselineStrings[fw];
}

enum DevLauncherRNSVGAlignmentBaseline DevLauncherRNSVGAlignmentBaselineFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGAlignmentBaselineDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGAlignmentBaselineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGAlignmentBaselineStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGAlignmentBaselineDEFAULT;
}

#pragma mark - DevLauncherRNSVGFontStyle

NSString* DevLauncherRNSVGFontStyleToString( enum DevLauncherRNSVGFontStyle fw )
{
    return DevLauncherRNSVGFontStyleStrings[fw];
}

enum DevLauncherRNSVGFontStyle DevLauncherRNSVGFontStyleFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGFontStyleDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGFontStyleStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGFontStyleStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGFontStyleDEFAULT;
}

#pragma mark - DevLauncherRNSVGFontVariantLigatures

NSString* DevLauncherRNSVGFontVariantLigaturesToString( enum DevLauncherRNSVGFontVariantLigatures fw )
{
    return DevLauncherRNSVGFontVariantLigaturesStrings[fw];
}

enum DevLauncherRNSVGFontVariantLigatures DevLauncherRNSVGFontVariantLigaturesFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGFontVariantLigaturesDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGFontVariantLigaturesStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGFontVariantLigaturesStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGFontVariantLigaturesDEFAULT;
}

#pragma mark - DevLauncherRNSVGFontWeight

NSString* DevLauncherRNSVGFontWeightToString( enum DevLauncherRNSVGFontWeight fw )
{
    return DevLauncherRNSVGFontWeightStrings[fw];
}

NSInteger DevLauncherRNSVGFontWeightFromString( NSString* s )
{
    if ([s length] == 0) {
        return -1;
    }
    const NSInteger l = sizeof(DevLauncherRNSVGFontWeightStrings) / sizeof(NSString*);
    for (NSInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGFontWeightStrings[i]]) {
            return i;
        }
    }
    return -1;
}

#pragma mark - DevLauncherRNSVGTextAnchor

NSString* DevLauncherRNSVGTextAnchorToString( enum DevLauncherRNSVGTextAnchor fw )
{
    return DevLauncherRNSVGTextAnchorStrings[fw];
}

enum DevLauncherRNSVGTextAnchor DevLauncherRNSVGTextAnchorFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGTextAnchorDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGTextAnchorStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGTextAnchorStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGTextAnchorDEFAULT;
}

#pragma mark - DevLauncherRNSVGTextDecoration

NSString* DevLauncherRNSVGTextDecorationToString( enum DevLauncherRNSVGTextDecoration fw )
{
    return DevLauncherRNSVGTextDecorationStrings[fw];
}

enum DevLauncherRNSVGTextDecoration DevLauncherRNSVGTextDecorationFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGTextDecorationDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGTextDecorationStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGTextDecorationStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGTextDecorationDEFAULT;
}

#pragma mark - DevLauncherRNSVGTextLengthAdjust

NSString* DevLauncherRNSVGTextLengthAdjustToString( enum DevLauncherRNSVGTextLengthAdjust fw )
{
    return DevLauncherRNSVGTextLengthAdjustStrings[fw];
}

enum DevLauncherRNSVGTextLengthAdjust DevLauncherRNSVGTextLengthAdjustFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGTextLengthAdjustDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGTextLengthAdjustStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGTextLengthAdjustStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGTextLengthAdjustDEFAULT;
}

#pragma mark - DevLauncherRNSVGTextPathMethod

NSString* DevLauncherRNSVGTextPathMethodToString( enum DevLauncherRNSVGTextPathMethod fw )
{
    return DevLauncherRNSVGTextPathMethodStrings[fw];
}

enum DevLauncherRNSVGTextPathMethod DevLauncherRNSVGTextPathMethodFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGTextPathMethodDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGTextPathMethodStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGTextPathMethodStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGTextPathMethodDEFAULT;
}

#pragma mark - DevLauncherRNSVGTextPathMidLine

NSString* DevLauncherRNSVGTextPathMidLineToString( enum DevLauncherRNSVGTextPathMidLine fw )
{
    return DevLauncherRNSVGTextPathMidLineStrings[fw];
}

enum DevLauncherRNSVGTextPathMidLine DevLauncherRNSVGTextPathMidLineFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGTextPathMidLineDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGTextPathMidLineStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGTextPathMidLineStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGTextPathMidLineDEFAULT;
}

#pragma mark - DevLauncherRNSVGTextPathSide

NSString* DevLauncherRNSVGTextPathSideToString( enum DevLauncherRNSVGTextPathSide fw )
{
    return DevLauncherRNSVGTextPathSideStrings[fw];
}

enum DevLauncherRNSVGTextPathSide DevLauncherRNSVGTextPathSideFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGTextPathSideDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGTextPathSideStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGTextPathSideStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGTextPathSideDEFAULT;
}

#pragma mark - DevLauncherRNSVGTextPathSpacing

NSString* DevLauncherRNSVGTextPathSpacingToString( enum DevLauncherRNSVGTextPathSpacing fw )
{
    return DevLauncherRNSVGTextPathSpacingStrings[fw];
}

enum DevLauncherRNSVGTextPathSpacing DevLauncherRNSVGTextPathSpacingFromString( NSString* s )
{
    if ([s length] == 0) {
        return DevLauncherRNSVGTextPathSpacingDEFAULT;
    }
    const NSUInteger l = sizeof(DevLauncherRNSVGTextPathSpacingStrings) / sizeof(NSString*);
    for (NSUInteger i = 0; i < l; i++) {
        if ([s isEqualToString:DevLauncherRNSVGTextPathSpacingStrings[i]]) {
            return i;
        }
    }
    return DevLauncherRNSVGTextPathSpacingDEFAULT;
}
