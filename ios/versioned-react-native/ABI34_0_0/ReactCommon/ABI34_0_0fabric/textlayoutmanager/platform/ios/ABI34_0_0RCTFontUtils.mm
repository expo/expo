/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTFontUtils.h"

#import <cmath>
#import <mutex>

static ABI34_0_0RCTFontProperties ABI34_0_0RCTDefaultFontProperties() {
  static ABI34_0_0RCTFontProperties defaultFontProperties;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    defaultFontProperties.size = 14;
    defaultFontProperties.family =
        [UIFont systemFontOfSize:defaultFontProperties.size].familyName;
    defaultFontProperties.style = ABI34_0_0RCTFontStyleNormal;
    defaultFontProperties.variant = ABI34_0_0RCTFontVariantDefault;
    defaultFontProperties.sizeMultiplier = 1.0;
  });

  return defaultFontProperties;
}

static ABI34_0_0RCTFontProperties ABI34_0_0RCTResolveFontProperties(
    ABI34_0_0RCTFontProperties fontProperties) {
  ABI34_0_0RCTFontProperties defaultFontProperties = ABI34_0_0RCTDefaultFontProperties();
  fontProperties.family = fontProperties.family.length &&
          ![fontProperties.family isEqualToString:@"System"]
      ? fontProperties.family
      : defaultFontProperties.family;
  fontProperties.size = !isnan(fontProperties.size)
      ? fontProperties.size
      : defaultFontProperties.size;
  fontProperties.weight = !isnan(fontProperties.weight)
      ? fontProperties.weight
      : defaultFontProperties.weight;
  fontProperties.style = fontProperties.style != ABI34_0_0RCTFontStyleUndefined
      ? fontProperties.style
      : defaultFontProperties.style;
  fontProperties.variant = fontProperties.variant != ABI34_0_0RCTFontVariantUndefined
      ? fontProperties.variant
      : defaultFontProperties.variant;
  return fontProperties;
}

static UIFontWeight ABI34_0_0RCTGetFontWeight(UIFont *font) {
  NSDictionary *traits =
      [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  return [traits[UIFontWeightTrait] doubleValue];
}

static ABI34_0_0RCTFontStyle ABI34_0_0RCTGetFontStyle(UIFont *font) {
  NSDictionary *traits =
      [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits =
      [traits[UIFontSymbolicTrait] unsignedIntValue];
  if (symbolicTraits & UIFontDescriptorTraitItalic) {
    return ABI34_0_0RCTFontStyleItalic;
  }

  return ABI34_0_0RCTFontStyleNormal;
}

static NSArray *ABI34_0_0RCTFontFeatures(ABI34_0_0RCTFontVariant fontVariant) {
  // FIXME:
  return @[];
}

static UIFontWeight ABI34_0_0RCTUIFontWeightFromFloat(CGFloat fontWeight) {
  // Note: Even if the underlying type of `UIFontWeight` is `CGFloat`
  // and UIKit uses the same numerical notation, we have to use exact
  // `UIFontWeight*` constants to make it work properly (because
  // float values comparison is tricky).
  static UIFontWeight weights[] = {/* ~100 */ UIFontWeightUltraLight,
                                   /* ~200 */ UIFontWeightThin,
                                   /* ~300 */ UIFontWeightLight,
                                   /* ~400 */ UIFontWeightRegular,
                                   /* ~500 */ UIFontWeightMedium,
                                   /* ~600 */ UIFontWeightSemibold,
                                   /* ~700 */ UIFontWeightBold,
                                   /* ~800 */ UIFontWeightHeavy,
                                   /* ~900 */ UIFontWeightBlack};
  return weights[std::llround((fontWeight / 100) - 1)];
}

static UIFont *ABI34_0_0RCTDefaultFontWithFontProperties(
    ABI34_0_0RCTFontProperties fontProperties) {
  static NSCache *fontCache;
  static std::mutex fontCacheMutex;

  NSString *cacheKey = [NSString stringWithFormat:@"%.1f/%.2f",
                                                  fontProperties.size,
                                                  fontProperties.weight];
  UIFont *font;

  {
    std::lock_guard<std::mutex> lock(fontCacheMutex);
    if (!fontCache) {
      fontCache = [NSCache new];
    }
    font = [fontCache objectForKey:cacheKey];
  }

  if (!font) {
    font = [UIFont
        systemFontOfSize:fontProperties.size
                  weight:ABI34_0_0RCTUIFontWeightFromFloat(fontProperties.weight)];

    if (fontProperties.variant == ABI34_0_0RCTFontStyleItalic) {
      UIFontDescriptor *fontDescriptor = [font fontDescriptor];
      UIFontDescriptorSymbolicTraits symbolicTraits =
          fontDescriptor.symbolicTraits;

      symbolicTraits |= UIFontDescriptorTraitItalic;

      fontDescriptor =
          [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
      font = [UIFont fontWithDescriptor:fontDescriptor
                                   size:fontProperties.size];
    }

    {
      std::lock_guard<std::mutex> lock(fontCacheMutex);
      [fontCache setObject:font forKey:cacheKey];
    }
  }

  return font;
}

UIFont *ABI34_0_0RCTFontWithFontProperties(ABI34_0_0RCTFontProperties fontProperties) {
  ABI34_0_0RCTFontProperties defaultFontProperties = ABI34_0_0RCTDefaultFontProperties();
  fontProperties = ABI34_0_0RCTResolveFontProperties(fontProperties);

  CGFloat effectiveFontSize =
      fontProperties.sizeMultiplier * fontProperties.size;
  UIFont *font;
  if ([fontProperties.family isEqualToString:defaultFontProperties.family]) {
    // Handle system font as special case. This ensures that we preserve
    // the specific metrics of the standard system font as closely as possible.
    font = ABI34_0_0RCTDefaultFontWithFontProperties(fontProperties);
  } else {
    NSArray<NSString *> *fontNames =
        [UIFont fontNamesForFamilyName:fontProperties.family];

    if (fontNames.count == 0) {
      // Gracefully handle being given a font name rather than font family, for
      // example: "Helvetica Light Oblique" rather than just "Helvetica".
      font = [UIFont fontWithName:fontProperties.family size:effectiveFontSize];

      if (!font) {
        // Failback to system font.
        font = [UIFont
            systemFontOfSize:effectiveFontSize
                      weight:ABI34_0_0RCTUIFontWeightFromFloat(fontProperties.weight)];
      }
    } else {
      // Get the closest font that matches the given weight for the fontFamily
      CGFloat closestWeight = INFINITY;
      for (NSString *name in fontNames) {
        UIFont *fontMatch = [UIFont fontWithName:name size:effectiveFontSize];

        if (ABI34_0_0RCTGetFontStyle(fontMatch) != fontProperties.style) {
          continue;
        }

        CGFloat testWeight = ABI34_0_0RCTGetFontWeight(fontMatch);
        if (ABS(testWeight - fontProperties.weight) <
            ABS(closestWeight - fontProperties.weight)) {
          font = fontMatch;
          closestWeight = testWeight;
        }
      }

      if (!font) {
        // If we still don't have a match at least return the first font in the
        // fontFamily This is to support built-in font Zapfino and other custom
        // single font families like Impact
        font = [UIFont fontWithName:fontNames[0] size:effectiveFontSize];
      }
    }
  }

  // Apply font variants to font object.
  if (fontProperties.variant != ABI34_0_0RCTFontVariantDefault) {
    NSArray *fontFeatures = ABI34_0_0RCTFontFeatures(fontProperties.variant);
    UIFontDescriptor *fontDescriptor =
        [font.fontDescriptor fontDescriptorByAddingAttributes:@{
          UIFontDescriptorFeatureSettingsAttribute : fontFeatures
        }];
    font = [UIFont fontWithDescriptor:fontDescriptor size:effectiveFontSize];
  }

  return font;
}
