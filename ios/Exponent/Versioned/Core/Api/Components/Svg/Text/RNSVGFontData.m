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

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(RNSVGFontData *)parent {
    RNSVGFontData *data = [RNSVGFontData alloc];
    CGFloat parentFontSize = parent->fontSize;
    if ([font objectForKey:FONT_SIZE]) {
        NSString *string = [font objectForKey:FONT_SIZE];
        data->fontSize = [RNSVGPropHelper fromRelativeWithNSString:string
                                                       relative:parentFontSize
                                                       fontSize:parentFontSize];
    }
    else {
        data->fontSize = parentFontSize;
    }
    data->fontData = [font objectForKey:FONT_DATA] ? [font objectForKey:FONT_DATA] : parent->fontData;
    data->fontFamily = [font objectForKey:FONT_FAMILY] ? [font objectForKey:FONT_FAMILY] : parent->fontFamily;
    NSString* style = [font objectForKey:FONT_STYLE];
    data->fontStyle = style ? RNSVGFontStyleFromString(style) : parent->fontStyle;
    NSString* weight = [font objectForKey:FONT_WEIGHT];
    data->fontWeight = weight ? RNSVGFontWeightFromString(weight) : parent->fontWeight;
    NSString* feature = [font objectForKey:FONT_FEATURE_SETTINGS];
    data->fontFeatureSettings = feature ? [font objectForKey:FONT_FEATURE_SETTINGS] : parent->fontFeatureSettings;
    NSString* variant = [font objectForKey:FONT_VARIANT_LIGATURES];
    data->fontVariantLigatures = variant ? RNSVGFontVariantLigaturesFromString(variant) : parent->fontVariantLigatures;
    NSString* anchor = [font objectForKey:TEXT_ANCHOR];
    data->textAnchor = anchor ? RNSVGTextAnchorFromString(anchor) : parent->textAnchor;
    NSString* decoration = [font objectForKey:TEXT_DECORATION];
    data->textDecoration = decoration ? RNSVGTextDecorationFromString(decoration) : parent->textDecoration;

    NSString* kerning = [font objectForKey:KERNING];
    data->manualKerning = (kerning || parent->manualKerning );
    CGFloat fontSize = data->fontSize;
    data->kerning = kerning ?
    [RNSVGFontData toAbsoluteWithNSString:kerning
                                 fontSize:fontSize]
    : parent->kerning;

    NSString* wordSpacing = [font objectForKey:WORD_SPACING];
    data->wordSpacing = wordSpacing ?
    [RNSVGFontData toAbsoluteWithNSString:wordSpacing
                                 fontSize:fontSize]
    : parent->wordSpacing;

    NSString* letterSpacing = [font objectForKey:LETTER_SPACING];
    data->letterSpacing = letterSpacing ?
    [RNSVGFontData toAbsoluteWithNSString:letterSpacing
                                 fontSize:fontSize]
    : parent->letterSpacing;

    return data;
}


@end
