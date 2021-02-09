#import "RNSVGFontData.h"
#import "RNSVGPropHelper.h"
#import "RNSVGTextProperties.h"
#import "RNSVGNode.h"

#define RNSVG_DEFAULT_KERNING 0.0
#define RNSVG_DEFAULT_WORD_SPACING 0.0
#define RNSVG_DEFAULT_LETTER_SPACING 0.0
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

RNSVGFontData *RNSVGFontData_Defaults;

@implementation RNSVGFontData

+ (instancetype)Defaults {
    if (!RNSVGFontData_Defaults) {
        RNSVGFontData *self = [RNSVGFontData alloc];
        self->fontData = nil;
        self->fontFamily = @"";
        self->fontStyle = RNSVGFontStyleNormal;
        self->fontWeight = RNSVGFontWeightNormal;
        self->absoluteFontWeight = 400;
        self->fontFeatureSettings = @"";
        self->fontVariantLigatures = RNSVGFontVariantLigaturesNormal;
        self->textAnchor = RNSVGTextAnchorStart;
        self->textDecoration = RNSVGTextDecorationNone;
        self->manualKerning = false;
        self->kerning = RNSVG_DEFAULT_KERNING;
        self->fontSize = RNSVG_DEFAULT_FONT_SIZE;
        self->wordSpacing = RNSVG_DEFAULT_WORD_SPACING;
        self->letterSpacing = RNSVG_DEFAULT_LETTER_SPACING;
        RNSVGFontData_Defaults = self;
    }
    return RNSVGFontData_Defaults;
}

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize {
    return [RNSVGPropHelper fromRelativeWithNSString:string
                                         relative:0
                                         fontSize:fontSize];
}

- (void)setInheritedWeight:(RNSVGFontData*) parent {
    absoluteFontWeight = parent->absoluteFontWeight;
    fontWeight = parent->fontWeight;
}

RNSVGFontWeight nearestFontWeight(int absoluteFontWeight) {
    return RNSVGFontWeights[(int)round(absoluteFontWeight / 100.0)];
}

- (void)handleNumericWeight:(RNSVGFontData*)parent weight:(double)weight {
    long roundWeight = round(weight);
    if (roundWeight >= 1 && roundWeight <= 1000) {
        absoluteFontWeight = (int)roundWeight;
        fontWeight = nearestFontWeight(absoluteFontWeight);
    } else {
        [self setInheritedWeight:parent];
    }
}

// https://drafts.csswg.org/css-fonts-4/#relative-weights
int AbsoluteFontWeight(RNSVGFontWeight fontWeight, RNSVGFontData* parent) {
    if (fontWeight == RNSVGFontWeightBolder) {
        return bolder(parent->absoluteFontWeight);
    } else if (fontWeight == RNSVGFontWeightLighter) {
        return lighter(parent->absoluteFontWeight);
    } else {
        return RNSVGAbsoluteFontWeights[fontWeight];
    }
}

int bolder(int inherited) {
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

int lighter(int inherited) {
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

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(RNSVGFontData *)parent {
    RNSVGFontData *data = [RNSVGFontData alloc];
    CGFloat parentFontSize = parent->fontSize;
    if ([font objectForKey:FONT_SIZE]) {
        id fontSize = [font objectForKey:FONT_SIZE];
        if ([fontSize isKindOfClass:NSNumber.class]) {
            NSNumber* fs = fontSize;
            data->fontSize = (CGFloat)[fs doubleValue];
        } else {
            data->fontSize = [RNSVGPropHelper fromRelativeWithNSString:fontSize
                                                       relative:parentFontSize
                                                       fontSize:parentFontSize];
        }
    }
    else {
        data->fontSize = parentFontSize;
    }

    if ([font objectForKey:FONT_WEIGHT]) {
        id fontWeight = [font objectForKey:FONT_WEIGHT];
        if ([fontWeight isKindOfClass:NSNumber.class]) {
            [data handleNumericWeight:parent weight:[fontWeight doubleValue]];
        } else {
            NSString* weight = fontWeight;
            NSInteger fw = RNSVGFontWeightFromString(weight);
            if (fw != -1) {
                data->absoluteFontWeight = AbsoluteFontWeight(fw, parent);
                data->fontWeight = nearestFontWeight(data->absoluteFontWeight);
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
    NSString* style = [font objectForKey:FONT_STYLE];
    data->fontStyle = style ? RNSVGFontStyleFromString(style) : parent->fontStyle;
    NSString* feature = [font objectForKey:FONT_FEATURE_SETTINGS];
    data->fontFeatureSettings = feature ? [font objectForKey:FONT_FEATURE_SETTINGS] : parent->fontFeatureSettings;
    NSString* variant = [font objectForKey:FONT_VARIANT_LIGATURES];
    data->fontVariantLigatures = variant ? RNSVGFontVariantLigaturesFromString(variant) : parent->fontVariantLigatures;
    NSString* anchor = [font objectForKey:TEXT_ANCHOR];
    data->textAnchor = anchor ? RNSVGTextAnchorFromString(anchor) : parent->textAnchor;
    NSString* decoration = [font objectForKey:TEXT_DECORATION];
    data->textDecoration = decoration ? RNSVGTextDecorationFromString(decoration) : parent->textDecoration;

    CGFloat fontSize = data->fontSize;
    id kerning = [font objectForKey:KERNING];
    data->manualKerning = (kerning || parent->manualKerning );
    if ([kerning isKindOfClass:NSNumber.class]) {
        NSNumber* kern = kerning;
        data->kerning = (CGFloat)[kern doubleValue];
    } else {
        data->kerning = kerning ?
        [RNSVGFontData toAbsoluteWithNSString:kerning
                                     fontSize:fontSize]
        : parent->kerning;
    }

    id wordSpacing = [font objectForKey:WORD_SPACING];
    if ([wordSpacing isKindOfClass:NSNumber.class]) {
        NSNumber* ws = wordSpacing;
        data->wordSpacing = (CGFloat)[ws doubleValue];
    } else {
        data->wordSpacing = wordSpacing ?
        [RNSVGFontData toAbsoluteWithNSString:wordSpacing
                                     fontSize:fontSize]
        : parent->wordSpacing;
    }

    id letterSpacing = [font objectForKey:LETTER_SPACING];
    if ([letterSpacing isKindOfClass:NSNumber.class]) {
        NSNumber* ls = letterSpacing;
        data->wordSpacing = (CGFloat)[ls doubleValue];
    } else {
        data->letterSpacing = letterSpacing ?
        [RNSVGFontData toAbsoluteWithNSString:letterSpacing
                                     fontSize:fontSize]
        : parent->letterSpacing;
    }

    return data;
}


@end
