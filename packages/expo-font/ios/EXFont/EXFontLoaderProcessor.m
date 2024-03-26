// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFont/EXFontLoaderProcessor.h>
#import <EXFont/EXFontLoader.h>
#import <EXFont/EXFont.h>
#import <EXFont/EXFontManager.h>
#import <objc/runtime.h>
#import <React/RCTConvert.h>
#import <React/RCTFont.h>
#import <CoreText/CoreText.h>

typedef CGFloat RCTFontWeight;

@implementation RCTConvert (RCTFont)

+ (UIFont *)UIFont:(id)json
{
  json = [self NSDictionary:json];

  return [RCTFont updateFont:nil
                  withFamily:[RCTConvert NSString:json[@"fontFamily"]]
                        size:[RCTConvert NSNumber:json[@"fontSize"]]
                      weight:[RCTConvert NSString:json[@"fontWeight"]]
                       style:[RCTConvert NSString:json[@"fontStyle"]]
                     variant:[RCTConvert NSStringArray:json[@"fontVariant"]]
             scaleMultiplier:1];
}

RCT_ENUM_CONVERTER(
  RCTFontWeight,
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

typedef BOOL RCTFontStyle;

RCT_ENUM_CONVERTER(
  RCTFontStyle,
  (@{
    @"normal" : @NO,
    @"italic" : @YES,
    @"oblique" : @YES,
  }),
  NO,
  boolValue)

typedef NSDictionary RCTFontVariantDescriptor;

+ (RCTFontVariantDescriptor *)RCTFontVariantDescriptor:(id)json
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
      @"stylistic-one" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltOneOnSelector),
      },
      @"stylistic-two" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTwoOnSelector),
      },
      @"stylistic-three" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltThreeOnSelector),
      },
      @"stylistic-four" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFourOnSelector),
      },
      @"stylistic-five" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFiveOnSelector),
      },
      @"stylistic-six" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSixOnSelector),
      },
      @"stylistic-seven" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSevenOnSelector),
      },
      @"stylistic-eight" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltEightOnSelector),
      },
      @"stylistic-nine" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltNineOnSelector),
      },
      @"stylistic-ten" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTenOnSelector),
      },
      @"stylistic-eleven" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltElevenOnSelector),
      },
      @"stylistic-twelve" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTwelveOnSelector),
      },
      @"stylistic-thirteen" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltThirteenOnSelector),
      },
      @"stylistic-fourteen" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFourteenOnSelector),
      },
      @"stylistic-fifteen" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltFifteenOnSelector),
      },
      @"stylistic-sixteen" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSixteenOnSelector),
      },
      @"stylistic-seventeen" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltSeventeenOnSelector),
      },
      @"stylistic-eighteen" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltEighteenOnSelector),
      },
      @"stylistic-nineteen" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltNineteenOnSelector),
      },
      @"stylistic-twenty" : @{
        UIFontFeatureTypeIdentifierKey : @(kStylisticAlternativesType),
        UIFontFeatureSelectorIdentifierKey : @(kStylisticAltTwentyOnSelector),
      }
    };
  });
  
  RCTFontVariantDescriptor *value = mapping[json];

  if (RCT_DEBUG && !value && [json description].length > 0) {
    RCTLogError(
      @"Invalid RCTFontVariantDescriptor '%@'. should be one of: %@",
      json,
      [[mapping allKeys] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)]);
  }

  return value;
}

RCT_ARRAY_CONVERTER(RCTFontVariantDescriptor)

@end

@interface EXFontLoaderProcessor ()

@property (nonatomic, copy) NSString *fontFamilyPrefix;
@property (nonatomic, strong) EXFontManager *manager;

@end

@implementation EXFontLoaderProcessor

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(EXFontManager *)manager
{
  if (self = [super init]) {
    _fontFamilyPrefix = prefix;
    _manager = manager;
  }

  return self;
}

- (instancetype)initWithManager:(EXFontManager *)manager
{
  return [self initWithFontFamilyPrefix:nil manager:manager];
}

- (UIFont *)updateFont:(UIFont *)uiFont
            withFamily:(NSString *)family
                  size:(NSNumber *)size
                weight:(NSString *)weight
                  style:(NSString *)style
                variant:(NSArray<NSDictionary *> *)variant
        scaleMultiplier:(CGFloat)scaleMultiplier
{
  const CGFloat defaultFontSize = 14;
  EXFont *exFont = nil;

  // Did we get a new family, and if so, is it associated with an EXFont?
  if (_fontFamilyPrefix && [family hasPrefix:_fontFamilyPrefix]) {
    NSString *suffix = [family substringFromIndex:_fontFamilyPrefix.length];
    exFont = [_manager fontForName:suffix];
  } else if (!_fontFamilyPrefix) {
    exFont = [_manager fontForName:family];
  }

  // Did the passed-in UIFont come from an EXFont?
  if (!exFont && uiFont) {
    exFont = objc_getAssociatedObject(uiFont, EXFontAssocKey);
  }

  // If it's an EXFont, generate the corresponding UIFont, else fallback to React Native's built-in method
  if (exFont) {
    CGFloat computedSize = [size doubleValue] ?: uiFont.pointSize ?: defaultFontSize;
    if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
      computedSize = round(computedSize * scaleMultiplier);
    }

    UIFont *font = [exFont UIFontWithSize:computedSize];
    
    if (variant) {
      NSArray *fontFeatures = [RCTConvert RCTFontVariantDescriptorArray:variant];
      
      UIFontDescriptor *fontDescriptor =
        [font.fontDescriptor fontDescriptorByAddingAttributes:@{
          UIFontDescriptorFeatureSettingsAttribute : fontFeatures
        }];

      font = [UIFont fontWithDescriptor:fontDescriptor size:computedSize];
    }

    return font;
  }

  return nil;
}

@end
