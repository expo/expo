#import <Foundation/Foundation.h>

#import "ABI45_0_0RNSVGUIKit.h"

#import "ABI45_0_0RNSVGTextProperties.h"
#import "ABI45_0_0RNSVGPropHelper.h"

@interface ABI45_0_0RNSVGFontData : NSObject {
@public
    CGFloat fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum ABI45_0_0RNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum ABI45_0_0RNSVGFontWeight fontWeight;
    int absoluteFontWeight;
    NSString *fontFeatureSettings;
    enum ABI45_0_0RNSVGFontVariantLigatures fontVariantLigatures;
    enum ABI45_0_0RNSVGTextAnchor textAnchor;
    enum ABI45_0_0RNSVGTextDecoration textDecoration;
    CGFloat kerning;
    CGFloat wordSpacing;
    CGFloat letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(ABI45_0_0RNSVGFontData *)parent;

@end

#define ABI45_0_0RNSVGFontData_DEFAULT_FONT_SIZE 12.0
