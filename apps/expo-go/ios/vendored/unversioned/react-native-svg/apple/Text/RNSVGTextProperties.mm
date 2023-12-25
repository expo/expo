#import "RNSVGTextProperties.h"

#pragma mark - RNSVGAlignmentBaseline

NSString *RNSVGAlignmentBaselineToString(enum RNSVGAlignmentBaseline fw)
{
  return RNSVGAlignmentBaselineStrings[fw];
}

enum RNSVGAlignmentBaseline RNSVGAlignmentBaselineFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGAlignmentBaselineDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGAlignmentBaselineStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGAlignmentBaselineStrings[i]]) {
      return (RNSVGAlignmentBaseline)i;
    }
  }
  return RNSVGAlignmentBaselineDEFAULT;
}

#pragma mark - RNSVGFontStyle

NSString *RNSVGFontStyleToString(enum RNSVGFontStyle fw)
{
  return RNSVGFontStyleStrings[fw];
}

enum RNSVGFontStyle RNSVGFontStyleFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGFontStyleDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGFontStyleStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGFontStyleStrings[i]]) {
      return (RNSVGFontStyle)i;
    }
  }
  return RNSVGFontStyleDEFAULT;
}

#pragma mark - RNSVGFontVariantLigatures

NSString *RNSVGFontVariantLigaturesToString(enum RNSVGFontVariantLigatures fw)
{
  return RNSVGFontVariantLigaturesStrings[fw];
}

enum RNSVGFontVariantLigatures RNSVGFontVariantLigaturesFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGFontVariantLigaturesDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGFontVariantLigaturesStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGFontVariantLigaturesStrings[i]]) {
      return (RNSVGFontVariantLigatures)i;
    }
  }
  return RNSVGFontVariantLigaturesDEFAULT;
}

#pragma mark - RNSVGFontWeight

NSString *RNSVGFontWeightToString(enum RNSVGFontWeight fw)
{
  return RNSVGFontWeightStrings[fw];
}

NSInteger RNSVGFontWeightFromString(NSString *s)
{
  if ([s length] == 0) {
    return -1;
  }
  const NSInteger l = sizeof(RNSVGFontWeightStrings) / sizeof(NSString *);
  for (NSInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGFontWeightStrings[i]]) {
      return i;
    }
  }
  return -1;
}

#pragma mark - RNSVGTextAnchor

NSString *RNSVGTextAnchorToString(enum RNSVGTextAnchor fw)
{
  return RNSVGTextAnchorStrings[fw];
}

enum RNSVGTextAnchor RNSVGTextAnchorFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGTextAnchorDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGTextAnchorStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGTextAnchorStrings[i]]) {
      return (RNSVGTextAnchor)i;
    }
  }
  return RNSVGTextAnchorDEFAULT;
}

#pragma mark - RNSVGTextDecoration

NSString *RNSVGTextDecorationToString(enum RNSVGTextDecoration fw)
{
  return RNSVGTextDecorationStrings[fw];
}

enum RNSVGTextDecoration RNSVGTextDecorationFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGTextDecorationDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGTextDecorationStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGTextDecorationStrings[i]]) {
      return (RNSVGTextDecoration)i;
    }
  }
  return RNSVGTextDecorationDEFAULT;
}

#pragma mark - RNSVGTextLengthAdjust

NSString *RNSVGTextLengthAdjustToString(enum RNSVGTextLengthAdjust fw)
{
  return RNSVGTextLengthAdjustStrings[fw];
}

enum RNSVGTextLengthAdjust RNSVGTextLengthAdjustFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGTextLengthAdjustDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGTextLengthAdjustStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGTextLengthAdjustStrings[i]]) {
      return (RNSVGTextLengthAdjust)i;
    }
  }
  return RNSVGTextLengthAdjustDEFAULT;
}

#pragma mark - RNSVGTextPathMethod

NSString *RNSVGTextPathMethodToString(enum RNSVGTextPathMethod fw)
{
  return RNSVGTextPathMethodStrings[fw];
}

enum RNSVGTextPathMethod RNSVGTextPathMethodFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGTextPathMethodDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGTextPathMethodStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGTextPathMethodStrings[i]]) {
      return (RNSVGTextPathMethod)i;
    }
  }
  return RNSVGTextPathMethodDEFAULT;
}

#pragma mark - RNSVGTextPathMidLine

NSString *RNSVGTextPathMidLineToString(enum RNSVGTextPathMidLine fw)
{
  return RNSVGTextPathMidLineStrings[fw];
}

enum RNSVGTextPathMidLine RNSVGTextPathMidLineFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGTextPathMidLineDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGTextPathMidLineStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGTextPathMidLineStrings[i]]) {
      return (RNSVGTextPathMidLine)i;
    }
  }
  return RNSVGTextPathMidLineDEFAULT;
}

#pragma mark - RNSVGTextPathSide

NSString *RNSVGTextPathSideToString(enum RNSVGTextPathSide fw)
{
  return RNSVGTextPathSideStrings[fw];
}

enum RNSVGTextPathSide RNSVGTextPathSideFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGTextPathSideDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGTextPathSideStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGTextPathSideStrings[i]]) {
      return (RNSVGTextPathSide)i;
    }
  }
  return RNSVGTextPathSideDEFAULT;
}

#pragma mark - RNSVGTextPathSpacing

NSString *RNSVGTextPathSpacingToString(enum RNSVGTextPathSpacing fw)
{
  return RNSVGTextPathSpacingStrings[fw];
}

enum RNSVGTextPathSpacing RNSVGTextPathSpacingFromString(NSString *s)
{
  if ([s length] == 0) {
    return RNSVGTextPathSpacingDEFAULT;
  }
  const NSUInteger l = sizeof(RNSVGTextPathSpacingStrings) / sizeof(NSString *);
  for (NSUInteger i = 0; i < l; i++) {
    if ([s isEqualToString:RNSVGTextPathSpacingStrings[i]]) {
      return (RNSVGTextPathSpacing)i;
    }
  }
  return RNSVGTextPathSpacingDEFAULT;
}
