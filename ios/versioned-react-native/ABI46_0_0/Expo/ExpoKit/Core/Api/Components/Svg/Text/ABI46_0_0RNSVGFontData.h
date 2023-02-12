#import <Foundation/Foundation.h>

#import "ABI46_0_0RNSVGUIKit.h"

#import "ABI46_0_0RNSVGTextProperties.h"
#import "ABI46_0_0RNSVGPropHelper.h"

@interface ABI46_0_0RNSVGFontData : NSObject {
@public
    CGFloat fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum ABI46_0_0RNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum ABI46_0_0RNSVGFontWeight fontWeight;
    int absoluteFontWeight;
    NSString *fontFeatureSettings;
    enum ABI46_0_0RNSVGFontVariantLigatures fontVariantLigatures;
    enum ABI46_0_0RNSVGTextAnchor textAnchor;
    enum ABI46_0_0RNSVGTextDecoration textDecoration;
    CGFloat kerning;
    CGFloat wordSpacing;
    CGFloat letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(ABI46_0_0RNSVGFontData *)parent;

@end

#define ABI46_0_0RNSVGFontData_DEFAULT_FONT_SIZE 12.0
