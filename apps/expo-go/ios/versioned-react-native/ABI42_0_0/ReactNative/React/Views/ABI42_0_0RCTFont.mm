/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTFont.h"
#import "ABI42_0_0RCTAssert.h"
#import "ABI42_0_0RCTLog.h"

#import <CoreText/CoreText.h>

#import <mutex>

typedef CGFloat ABI42_0_0RCTFontWeight;
static ABI42_0_0RCTFontWeight weightOfFont(UIFont *font)
{
  static NSArray *fontNames;
  static NSArray *fontWeights;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // We use two arrays instead of one map because
    // the order is important for suffix matching.
    fontNames = @[
      @"normal",
      @"ultralight",
      @"thin",
      @"light",
      @"regular",
      @"medium",
      @"semibold",
      @"demibold",
      @"extrabold",
      @"ultrabold",
      @"bold",
      @"heavy",
      @"black"
    ];
    fontWeights = @[
      @(UIFontWeightRegular),
      @(UIFontWeightUltraLight),
      @(UIFontWeightThin),
      @(UIFontWeightLight),
      @(UIFontWeightRegular),
      @(UIFontWeightMedium),
      @(UIFontWeightSemibold),
      @(UIFontWeightSemibold),
      @(UIFontWeightHeavy),
      @(UIFontWeightHeavy),
      @(UIFontWeightBold),
      @(UIFontWeightHeavy),
      @(UIFontWeightBlack)
    ];
  });

  for (NSInteger i = 0; i < 0 || i < (unsigned)fontNames.count; i++) {
    if ([font.fontName.lowercaseString hasSuffix:fontNames[i]]) {
      return (ABI42_0_0RCTFontWeight)[fontWeights[i] doubleValue];
    }
  }

  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  return (ABI42_0_0RCTFontWeight)[traits[UIFontWeightTrait] doubleValue];
}

static BOOL isItalicFont(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitItalic) != 0;
}

static BOOL isCondensedFont(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitCondensed) != 0;
}

static ABI42_0_0RCTFontHandler defaultFontHandler;

void ABI42_0_0RCTSetDefaultFontHandler(ABI42_0_0RCTFontHandler handler)
{
  defaultFontHandler = handler;
}

BOOL ABI42_0_0RCTHasFontHandlerSet()
{
  return defaultFontHandler != nil;
}

// We pass a string description of the font weight to the defaultFontHandler because UIFontWeight
// is not defined pre-iOS 8.2.
// Furthermore, UIFontWeight's are lossy floats, so we must use an inexact compare to figure out
// which one we actually have.
static inline BOOL CompareFontWeights(UIFontWeight firstWeight, UIFontWeight secondWeight)
{
#if CGFLOAT_IS_DOUBLE
  return fabs(firstWeight - secondWeight) < 0.01;
#else
  return fabsf(firstWeight - secondWeight) < 0.01;
#endif
}

static NSString *FontWeightDescriptionFromUIFontWeight(UIFontWeight fontWeight)
{
  if (CompareFontWeights(fontWeight, UIFontWeightUltraLight)) {
    return @"ultralight";
  } else if (CompareFontWeights(fontWeight, UIFontWeightThin)) {
    return @"thin";
  } else if (CompareFontWeights(fontWeight, UIFontWeightLight)) {
    return @"light";
  } else if (CompareFontWeights(fontWeight, UIFontWeightRegular)) {
    return @"regular";
  } else if (CompareFontWeights(fontWeight, UIFontWeightMedium)) {
    return @"medium";
  } else if (CompareFontWeights(fontWeight, UIFontWeightSemibold)) {
    return @"semibold";
  } else if (CompareFontWeights(fontWeight, UIFontWeightBold)) {
    return @"bold";
  } else if (CompareFontWeights(fontWeight, UIFontWeightHeavy)) {
    return @"heavy";
  } else if (CompareFontWeights(fontWeight, UIFontWeightBlack)) {
    return @"black";
  }
  ABI42_0_0RCTAssert(NO, @"Unknown UIFontWeight passed in: %f", fontWeight);
  return @"regular";
}

static UIFont *cachedSystemFont(CGFloat size, ABI42_0_0RCTFontWeight weight)
{
  static NSCache *fontCache;
  static std::mutex *fontCacheMutex = new std::mutex;

  NSString *cacheKey = [NSString stringWithFormat:@"%.1f/%.2f", size, weight];
  UIFont *font;
  {
    std::lock_guard<std::mutex> lock(*fontCacheMutex);
    if (!fontCache) {
      fontCache = [NSCache new];
    }
    font = [fontCache objectForKey:cacheKey];
  }

  if (!font) {
    if (defaultFontHandler) {
      NSString *fontWeightDescription = FontWeightDescriptionFromUIFontWeight(weight);
      font = defaultFontHandler(size, fontWeightDescription);
    } else {
      font = [UIFont systemFontOfSize:size weight:weight];
    }

    {
      std::lock_guard<std::mutex> lock(*fontCacheMutex);
      [fontCache setObject:font forKey:cacheKey];
    }
  }

  return font;
}

@implementation ABI42_0_0RCTConvert (ABI42_0_0RCTFont)

+ (UIFont *)UIFont:(id)json
{
  json = [self NSDictionary:json];
  return [ABI42_0_0RCTFont updateFont:nil
                  withFamily:[ABI42_0_0RCTConvert NSString:json[@"fontFamily"]]
                        size:[ABI42_0_0RCTConvert NSNumber:json[@"fontSize"]]
                      weight:[ABI42_0_0RCTConvert NSString:json[@"fontWeight"]]
                       style:[ABI42_0_0RCTConvert NSString:json[@"fontStyle"]]
                     variant:[ABI42_0_0RCTConvert NSStringArray:json[@"fontVariant"]]
             scaleMultiplier:1];
}

ABI42_0_0RCT_ENUM_CONVERTER(
    ABI42_0_0RCTFontWeight,
    (@{
      @"normal" : @(UIFontWeightRegular),
      @"bold" : @(UIFontWeightBold),
      @"100" : @(UIFontWeightUltraLight),
      @"200" : @(UIFontWeightThin),
      @"300" : @(UIFontWeightLight),
      @"400" : @(UIFontWeightRegular),
      @"500" : @(UIFontWeightMedium),
      @"600" : @(UIFontWeightSemibold),
      @"700" : @(UIFontWeightBold),
      @"800" : @(UIFontWeightHeavy),
      @"900" : @(UIFontWeightBlack),
    }),
    UIFontWeightRegular,
    doubleValue)

typedef BOOL ABI42_0_0RCTFontStyle;
ABI42_0_0RCT_ENUM_CONVERTER(
    ABI42_0_0RCTFontStyle,
    (@{
      @"normal" : @NO,
      @"italic" : @YES,
      @"oblique" : @YES,
    }),
    NO,
    boolValue)

typedef NSDictionary ABI42_0_0RCTFontVariantDescriptor;
+ (ABI42_0_0RCTFontVariantDescriptor *)ABI42_0_0RCTFontVariantDescriptor:(id)json
{
  static NSDictionary *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    mapping = @{
      @"small-caps" : @{
        UIFontFeatureTypeIdentifierKey : @(kLowerCaseType),
        UIFontFeatureSelectorIdentifierKey : @(kLowerCaseSmallCapsSelector),
      },
      @"oldstyle-nums" : @{
        UIFontFeatureTypeIdentifierKey : @(kNumberCaseType),
        UIFontFeatureSelectorIdentifierKey : @(kLowerCaseNumbersSelector),
      },
      @"lining-nums" : @{
        UIFontFeatureTypeIdentifierKey : @(kNumberCaseType),
        UIFontFeatureSelectorIdentifierKey : @(kUpperCaseNumbersSelector),
      },
      @"tabular-nums" : @{
        UIFontFeatureTypeIdentifierKey : @(kNumberSpacingType),
        UIFontFeatureSelectorIdentifierKey : @(kMonospacedNumbersSelector),
      },
      @"proportional-nums" : @{
        UIFontFeatureTypeIdentifierKey : @(kNumberSpacingType),
        UIFontFeatureSelectorIdentifierKey : @(kProportionalNumbersSelector),
      },
    };
  });
  ABI42_0_0RCTFontVariantDescriptor *value = mapping[json];
  if (ABI42_0_0RCT_DEBUG && !value && [json description].length > 0) {
    ABI42_0_0RCTLogError(
        @"Invalid ABI42_0_0RCTFontVariantDescriptor '%@'. should be one of: %@",
        json,
        [[mapping allKeys] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)]);
  }
  return value;
}

ABI42_0_0RCT_ARRAY_CONVERTER(ABI42_0_0RCTFontVariantDescriptor)

@end

@implementation ABI42_0_0RCTFont

+ (UIFont *)updateFont:(UIFont *)font
            withFamily:(NSString *)family
                  size:(NSNumber *)size
                weight:(NSString *)weight
                 style:(NSString *)style
               variant:(NSArray<ABI42_0_0RCTFontVariantDescriptor *> *)variant
       scaleMultiplier:(CGFloat)scaleMultiplier
{
  // Defaults
  static NSString *defaultFontFamily;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    defaultFontFamily = [UIFont systemFontOfSize:14].familyName;
  });
  const ABI42_0_0RCTFontWeight defaultFontWeight = UIFontWeightRegular;
  const CGFloat defaultFontSize = 14;

  // Initialize properties to defaults
  CGFloat fontSize = defaultFontSize;
  ABI42_0_0RCTFontWeight fontWeight = defaultFontWeight;
  NSString *familyName = defaultFontFamily;
  BOOL isItalic = NO;
  BOOL isCondensed = NO;

  if (font) {
    familyName = font.familyName ?: defaultFontFamily;
    fontSize = font.pointSize ?: defaultFontSize;
    fontWeight = weightOfFont(font);
    isItalic = isItalicFont(font);
    isCondensed = isCondensedFont(font);
  }

  // Get font attributes
  fontSize = [ABI42_0_0RCTConvert CGFloat:size] ?: fontSize;
  if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
    fontSize = round(fontSize * scaleMultiplier);
  }
  familyName = [ABI42_0_0RCTConvert NSString:family] ?: familyName;
  isItalic = style ? [ABI42_0_0RCTConvert ABI42_0_0RCTFontStyle:style] : isItalic;
  fontWeight = weight ? [ABI42_0_0RCTConvert ABI42_0_0RCTFontWeight:weight] : fontWeight;

  BOOL didFindFont = NO;

  // Handle system font as special case. This ensures that we preserve
  // the specific metrics of the standard system font as closely as possible.
  if ([familyName isEqual:defaultFontFamily] || [familyName isEqualToString:@"System"]) {
    font = cachedSystemFont(fontSize, fontWeight);
    if (font) {
      didFindFont = YES;

      if (isItalic || isCondensed) {
        UIFontDescriptor *fontDescriptor = [font fontDescriptor];
        UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
        if (isItalic) {
          symbolicTraits |= UIFontDescriptorTraitItalic;
        }
        if (isCondensed) {
          symbolicTraits |= UIFontDescriptorTraitCondensed;
        }
        fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
        font = [UIFont fontWithDescriptor:fontDescriptor size:fontSize];
      }
    }
  }

  // Gracefully handle being given a font name rather than font family, for
  // example: "Helvetica Light Oblique" rather than just "Helvetica".
  if (!didFindFont && [UIFont fontNamesForFamilyName:familyName].count == 0) {
    font = [UIFont fontWithName:familyName size:fontSize];
    if (font) {
      // It's actually a font name, not a font family name,
      // but we'll do what was meant, not what was said.
      familyName = font.familyName;
      fontWeight = weight ? fontWeight : weightOfFont(font);
      isItalic = style ? isItalic : isItalicFont(font);
      isCondensed = isCondensedFont(font);
    } else {
      // Not a valid font or family
      ABI42_0_0RCTLogError(@"Unrecognized font family '%@'", familyName);
      if ([UIFont respondsToSelector:@selector(systemFontOfSize:weight:)]) {
        font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
      } else if (fontWeight > UIFontWeightRegular) {
        font = [UIFont boldSystemFontOfSize:fontSize];
      } else {
        font = [UIFont systemFontOfSize:fontSize];
      }
    }
  }

  // Get the closest font that matches the given weight for the fontFamily
  CGFloat closestWeight = INFINITY;
  for (NSString *name in [UIFont fontNamesForFamilyName:familyName]) {
    UIFont *match = [UIFont fontWithName:name size:fontSize];
    if (isItalic == isItalicFont(match) && isCondensed == isCondensedFont(match)) {
      CGFloat testWeight = weightOfFont(match);
      if (ABS(testWeight - fontWeight) < ABS(closestWeight - fontWeight)) {
        font = match;
        closestWeight = testWeight;
      }
    }
  }

  // If we still don't have a match at least return the first font in the fontFamily
  // This is to support built-in font Zapfino and other custom single font families like Impact
  if (!font) {
    NSArray *names = [UIFont fontNamesForFamilyName:familyName];
    if (names.count > 0) {
      font = [UIFont fontWithName:names[0] size:fontSize];
    }
  }

  // Apply font variants to font object
  if (variant) {
    NSArray *fontFeatures = [ABI42_0_0RCTConvert ABI42_0_0RCTFontVariantDescriptorArray:variant];
    UIFontDescriptor *fontDescriptor = [font.fontDescriptor
        fontDescriptorByAddingAttributes:@{UIFontDescriptorFeatureSettingsAttribute : fontFeatures}];
    font = [UIFont fontWithDescriptor:fontDescriptor size:fontSize];
  }

  return font;
}

+ (UIFont *)updateFont:(UIFont *)font withFamily:(NSString *)family
{
  return [self updateFont:font withFamily:family size:nil weight:nil style:nil variant:nil scaleMultiplier:1];
}

+ (UIFont *)updateFont:(UIFont *)font withSize:(NSNumber *)size
{
  return [self updateFont:font withFamily:nil size:size weight:nil style:nil variant:nil scaleMultiplier:1];
}

+ (UIFont *)updateFont:(UIFont *)font withWeight:(NSString *)weight
{
  return [self updateFont:font withFamily:nil size:nil weight:weight style:nil variant:nil scaleMultiplier:1];
}

+ (UIFont *)updateFont:(UIFont *)font withStyle:(NSString *)style
{
  return [self updateFont:font withFamily:nil size:nil weight:nil style:style variant:nil scaleMultiplier:1];
}

@end
