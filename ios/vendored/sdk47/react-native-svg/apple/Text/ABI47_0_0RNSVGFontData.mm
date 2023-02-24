#import "ABI47_0_0RNSVGFontData.h"
#import "ABI47_0_0RNSVGNode.h"
#import "ABI47_0_0RNSVGPropHelper.h"
#import "ABI47_0_0RNSVGTextProperties.h"

#define ABI47_0_0RNSVG_DEFAULT_KERNING 0.0
#define ABI47_0_0RNSVG_DEFAULT_WORD_SPACING 0.0
#define ABI47_0_0RNSVG_DEFAULT_LETTER_SPACING 0.0
static NSString *KERNING = @"kerning";
static NSString *FONT_SIZE = @"fontSize";
static NSString *FONT_DATA = @"fontData";
static NSString *FONT_STYLE = @"fontStyle";
static NSString *FONT_WEIGHT = @"fontWeight";
static NSString *FONT_FAMILY = @"fontFamily";
static NSString *TEXT_ANCHOR = @"textAnchor";
static NSString *WORD_SPACING = @"wordSpacing";
static NSString *LETTER_SPACING = @"letterSpacing";
static NSString *TEXT_DECORATION = @"textDecoration";
static NSString *FONT_FEATURE_SETTINGS = @"fontFeatureSettings";
static NSString *FONT_VARIANT_LIGATURES = @"fontVariantLigatures";

ABI47_0_0RNSVGFontData *ABI47_0_0RNSVGFontData_Defaults;

@implementation ABI47_0_0RNSVGFontData

+ (instancetype)Defaults
{
  if (!ABI47_0_0RNSVGFontData_Defaults) {
    ABI47_0_0RNSVGFontData *self = [ABI47_0_0RNSVGFontData alloc];
    self->fontData = nil;
    self->fontFamily = @"";
    self->fontStyle = ABI47_0_0RNSVGFontStyleNormal;
    self->fontWeight = ABI47_0_0RNSVGFontWeightNormal;
    self->absoluteFontWeight = 400;
    self->fontFeatureSettings = @"";
    self->fontVariantLigatures = ABI47_0_0RNSVGFontVariantLigaturesNormal;
    self->textAnchor = ABI47_0_0RNSVGTextAnchorStart;
    self->textDecoration = ABI47_0_0RNSVGTextDecorationNone;
    self->manualKerning = false;
    self->kerning = ABI47_0_0RNSVG_DEFAULT_KERNING;
    self->fontSize = ABI47_0_0RNSVG_DEFAULT_FONT_SIZE;
    self->wordSpacing = ABI47_0_0RNSVG_DEFAULT_WORD_SPACING;
    self->letterSpacing = ABI47_0_0RNSVG_DEFAULT_LETTER_SPACING;
    ABI47_0_0RNSVGFontData_Defaults = self;
  }
  return ABI47_0_0RNSVGFontData_Defaults;
}

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string fontSize:(CGFloat)fontSize
{
  return [ABI47_0_0RNSVGPropHelper fromRelativeWithNSString:string relative:0 fontSize:fontSize];
}

- (void)setInheritedWeight:(ABI47_0_0RNSVGFontData *)parent
{
  absoluteFontWeight = parent->absoluteFontWeight;
  fontWeight = parent->fontWeight;
}

ABI47_0_0RNSVGFontWeight ABI47_0_0nearestFontWeight(int absoluteFontWeight)
{
  return ABI47_0_0RNSVGFontWeights[(int)round(absoluteFontWeight / 100.0)];
}

- (void)handleNumericWeight:(ABI47_0_0RNSVGFontData *)parent weight:(double)weight
{
  long roundWeight = round(weight);
  if (roundWeight >= 1 && roundWeight <= 1000) {
    absoluteFontWeight = (int)roundWeight;
    fontWeight = ABI47_0_0nearestFontWeight(absoluteFontWeight);
  } else {
    [self setInheritedWeight:parent];
  }
}

// https://drafts.csswg.org/css-fonts-4/#relative-weights
int ABI47_0_0AbsoluteFontWeight(ABI47_0_0RNSVGFontWeight fontWeight, ABI47_0_0RNSVGFontData *parent)
{
  if (fontWeight == ABI47_0_0RNSVGFontWeightBolder) {
    return ABI47_0_0bolder(parent->absoluteFontWeight);
  } else if (fontWeight == ABI47_0_0RNSVGFontWeightLighter) {
    return ABI47_0_0lighter(parent->absoluteFontWeight);
  } else {
    return ABI47_0_0RNSVGAbsoluteFontWeights[fontWeight];
  }
}

int ABI47_0_0bolder(int inherited)
{
  if (inherited < 350) {
    return 400;
  } else if (inherited < 550) {
    return 700;
  } else if (inherited < 900) {
    return 900;
  } else {
    return inherited;
  }
}

int ABI47_0_0lighter(int inherited)
{
  if (inherited < 100) {
    return inherited;
  } else if (inherited < 550) {
    return 100;
  } else if (inherited < 750) {
    return 400;
  } else {
    return 700;
  }
}

+ (instancetype)initWithNSDictionary:(NSDictionary *)font parent:(ABI47_0_0RNSVGFontData *)parent
{
  ABI47_0_0RNSVGFontData *data = [ABI47_0_0RNSVGFontData alloc];
  CGFloat parentFontSize = parent->fontSize;
  if ([font objectForKey:FONT_SIZE]) {
    id fontSize = [font objectForKey:FONT_SIZE];
    if ([fontSize isKindOfClass:NSNumber.class]) {
      NSNumber *fs = fontSize;
      data->fontSize = (CGFloat)[fs doubleValue];
    } else {
      data->fontSize = [ABI47_0_0RNSVGPropHelper fromRelativeWithNSString:fontSize
                                                        relative:parentFontSize
                                                        fontSize:parentFontSize];
    }
  } else {
    data->fontSize = parentFontSize;
  }

  if ([font objectForKey:FONT_WEIGHT]) {
    id fontWeight = [font objectForKey:FONT_WEIGHT];
    if ([fontWeight isKindOfClass:NSNumber.class]) {
      [data handleNumericWeight:parent weight:[fontWeight doubleValue]];
    } else {
      NSString *weight = fontWeight;
      NSInteger fw = ABI47_0_0RNSVGFontWeightFromString(weight);
      if (fw != -1) {
        data->absoluteFontWeight = ABI47_0_0AbsoluteFontWeight((ABI47_0_0RNSVGFontWeight)fw, parent);
        data->fontWeight = ABI47_0_0nearestFontWeight(data->absoluteFontWeight);
      } else if ([weight length] != 0) {
        [data handleNumericWeight:parent weight:[weight doubleValue]];
      } else {
        [data setInheritedWeight:parent];
      }
    }
  } else {
    [data setInheritedWeight:parent];
  }

  data->fontData = [font objectForKey:FONT_DATA] ? [font objectForKey:FONT_DATA] : parent->fontData;
  data->fontFamily = [font objectForKey:FONT_FAMILY] ? [font objectForKey:FONT_FAMILY] : parent->fontFamily;
  NSString *style = [font objectForKey:FONT_STYLE];
  data->fontStyle = style ? ABI47_0_0RNSVGFontStyleFromString(style) : parent->fontStyle;
  NSString *feature = [font objectForKey:FONT_FEATURE_SETTINGS];
  data->fontFeatureSettings = feature ? [font objectForKey:FONT_FEATURE_SETTINGS] : parent->fontFeatureSettings;
  NSString *variant = [font objectForKey:FONT_VARIANT_LIGATURES];
  data->fontVariantLigatures = variant ? ABI47_0_0RNSVGFontVariantLigaturesFromString(variant) : parent->fontVariantLigatures;
  NSString *anchor = [font objectForKey:TEXT_ANCHOR];
  data->textAnchor = anchor ? ABI47_0_0RNSVGTextAnchorFromString(anchor) : parent->textAnchor;
  NSString *decoration = [font objectForKey:TEXT_DECORATION];
  data->textDecoration = decoration ? ABI47_0_0RNSVGTextDecorationFromString(decoration) : parent->textDecoration;

  CGFloat fontSize = data->fontSize;
  id kerning = [font objectForKey:KERNING];
  data->manualKerning = (kerning || parent->manualKerning);
  if ([kerning isKindOfClass:NSNumber.class]) {
    NSNumber *kern = kerning;
    data->kerning = (CGFloat)[kern doubleValue];
  } else {
    data->kerning = kerning ? [ABI47_0_0RNSVGFontData toAbsoluteWithNSString:kerning fontSize:fontSize] : parent->kerning;
  }

  id wordSpacing = [font objectForKey:WORD_SPACING];
  if ([wordSpacing isKindOfClass:NSNumber.class]) {
    NSNumber *ws = wordSpacing;
    data->wordSpacing = (CGFloat)[ws doubleValue];
  } else {
    data->wordSpacing =
        wordSpacing ? [ABI47_0_0RNSVGFontData toAbsoluteWithNSString:wordSpacing fontSize:fontSize] : parent->wordSpacing;
  }

  id letterSpacing = [font objectForKey:LETTER_SPACING];
  if ([letterSpacing isKindOfClass:NSNumber.class]) {
    NSNumber *ls = letterSpacing;
    data->wordSpacing = (CGFloat)[ls doubleValue];
  } else {
    data->letterSpacing =
        letterSpacing ? [ABI47_0_0RNSVGFontData toAbsoluteWithNSString:letterSpacing fontSize:fontSize] : parent->letterSpacing;
  }

  return data;
}

@end
