#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI40_0_0RNSVGTextProperties.h"
#import "ABI40_0_0RNSVGPropHelper.h"

@interface ABI40_0_0RNSVGFontData : NSObject {
@public
    CGFloat fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum ABI40_0_0RNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum ABI40_0_0RNSVGFontWeight fontWeight;
    int absoluteFontWeight;
    NSString *fontFeatureSettings;
    enum ABI40_0_0RNSVGFontVariantLigatures fontVariantLigatures;
    enum ABI40_0_0RNSVGTextAnchor textAnchor;
    enum ABI40_0_0RNSVGTextDecoration textDecoration;
    CGFloat kerning;
    CGFloat wordSpacing;
    CGFloat letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(ABI40_0_0RNSVGFontData *)parent;

@end

#define ABI40_0_0RNSVGFontData_DEFAULT_FONT_SIZE 12.0
