#import "DevLauncherRNSVGFontData.h"
#import "DevLauncherRNSVGPropHelper.h"
#import "DevLauncherRNSVGTextProperties.h"
#import "DevLauncherRNSVGNode.h"

#define DevLauncherRNSVG_DEFAULT_KERNING 0.0
#define DevLauncherRNSVG_DEFAULT_WORD_SPACING 0.0
#define DevLauncherRNSVG_DEFAULT_LETTER_SPACING 0.0
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

DevLauncherRNSVGFontData *DevLauncherRNSVGFontData_Defaults;

@implementation DevLauncherRNSVGFontData

+ (instancetype)Defaults {
    if (!DevLauncherRNSVGFontData_Defaults) {
        DevLauncherRNSVGFontData *self = [DevLauncherRNSVGFontData alloc];
        self->fontData = nil;
        self->fontFamily = @"";
        self->fontStyle = DevLauncherRNSVGFontStyleNormal;
        self->fontWeight = DevLauncherRNSVGFontWeightNormal;
        self->absoluteFontWeight = 400;
        self->fontFeatureSettings = @"";
        self->fontVariantLigatures = DevLauncherRNSVGFontVariantLigaturesNormal;
        self->textAnchor = DevLauncherRNSVGTextAnchorStart;
        self->textDecoration = DevLauncherRNSVGTextDecorationNone;
        self->manualKerning = false;
        self->kerning = DevLauncherRNSVG_DEFAULT_KERNING;
        self->fontSize = DevLauncherRNSVG_DEFAULT_FONT_SIZE;
        self->wordSpacing = DevLauncherRNSVG_DEFAULT_WORD_SPACING;
        self->letterSpacing = DevLauncherRNSVG_DEFAULT_LETTER_SPACING;
        DevLauncherRNSVGFontData_Defaults = self;
    }
    return DevLauncherRNSVGFontData_Defaults;
}

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize {
    return [DevLauncherRNSVGPropHelper fromRelativeWithNSString:string
                                         relative:0
                                         fontSize:fontSize];
}

- (void)setInheritedWeight:(DevLauncherRNSVGFontData*) parent {
    absoluteFontWeight = parent->absoluteFontWeight;
    fontWeight = parent->fontWeight;
}

DevLauncherRNSVGFontWeight nearestFontWeight(int absoluteFontWeight) {
    return DevLauncherRNSVGFontWeights[(int)round(absoluteFontWeight / 100.0)];
}

- (void)handleNumericWeight:(DevLauncherRNSVGFontData*)parent weight:(double)weight {
    long roundWeight = round(weight);
    if (roundWeight >= 1 && roundWeight <= 1000) {
        absoluteFontWeight = (int)roundWeight;
        fontWeight = nearestFontWeight(absoluteFontWeight);
    } else {
        [self setInheritedWeight:parent];
    }
}

// https://drafts.csswg.org/css-fonts-4/#relative-weights
int AbsoluteFontWeight(DevLauncherRNSVGFontWeight fontWeight, DevLauncherRNSVGFontData* parent) {
    if (fontWeight == DevLauncherRNSVGFontWeightBolder) {
        return bolder(parent->absoluteFontWeight);
    } else if (fontWeight == DevLauncherRNSVGFontWeightLighter) {
        return lighter(parent->absoluteFontWeight);
    } else {
        return DevLauncherRNSVGAbsoluteFontWeights[fontWeight];
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
                              parent:(DevLauncherRNSVGFontData *)parent {
    DevLauncherRNSVGFontData *data = [DevLauncherRNSVGFontData alloc];
    CGFloat parentFontSize = parent->fontSize;
    if ([font objectForKey:FONT_SIZE]) {
        id fontSize = [font objectForKey:FONT_SIZE];
        if ([fontSize isKindOfClass:NSNumber.class]) {
            NSNumber* fs = fontSize;
            data->fontSize = (CGFloat)[fs doubleValue];
        } else {
            data->fontSize = [DevLauncherRNSVGPropHelper fromRelativeWithNSString:fontSize
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
            NSInteger fw = DevLauncherRNSVGFontWeightFromString(weight);
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
    data->fontStyle = style ? DevLauncherRNSVGFontStyleFromString(style) : parent->fontStyle;
    NSString* feature = [font objectForKey:FONT_FEATURE_SETTINGS];
    data->fontFeatureSettings = feature ? [font objectForKey:FONT_FEATURE_SETTINGS] : parent->fontFeatureSettings;
    NSString* variant = [font objectForKey:FONT_VARIANT_LIGATURES];
    data->fontVariantLigatures = variant ? DevLauncherRNSVGFontVariantLigaturesFromString(variant) : parent->fontVariantLigatures;
    NSString* anchor = [font objectForKey:TEXT_ANCHOR];
    data->textAnchor = anchor ? DevLauncherRNSVGTextAnchorFromString(anchor) : parent->textAnchor;
    NSString* decoration = [font objectForKey:TEXT_DECORATION];
    data->textDecoration = decoration ? DevLauncherRNSVGTextDecorationFromString(decoration) : parent->textDecoration;

    CGFloat fontSize = data->fontSize;
    id kerning = [font objectForKey:KERNING];
    data->manualKerning = (kerning || parent->manualKerning );
    if ([kerning isKindOfClass:NSNumber.class]) {
        NSNumber* kern = kerning;
        data->kerning = (CGFloat)[kern doubleValue];
    } else {
        data->kerning = kerning ?
        [DevLauncherRNSVGFontData toAbsoluteWithNSString:kerning
                                     fontSize:fontSize]
        : parent->kerning;
    }

    id wordSpacing = [font objectForKey:WORD_SPACING];
    if ([wordSpacing isKindOfClass:NSNumber.class]) {
        NSNumber* ws = wordSpacing;
        data->wordSpacing = (CGFloat)[ws doubleValue];
    } else {
        data->wordSpacing = wordSpacing ?
        [DevLauncherRNSVGFontData toAbsoluteWithNSString:wordSpacing
                                     fontSize:fontSize]
        : parent->wordSpacing;
    }

    id letterSpacing = [font objectForKey:LETTER_SPACING];
    if ([letterSpacing isKindOfClass:NSNumber.class]) {
        NSNumber* ls = letterSpacing;
        data->wordSpacing = (CGFloat)[ls doubleValue];
    } else {
        data->letterSpacing = letterSpacing ?
        [DevLauncherRNSVGFontData toAbsoluteWithNSString:letterSpacing
                                     fontSize:fontSize]
        : parent->letterSpacing;
    }

    return data;
}


@end
