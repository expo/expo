#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI31_0_0RNSVGTextProperties.h"
#import "ABI31_0_0RNSVGPropHelper.h"

@interface ABI31_0_0RNSVGFontData : NSObject {
@public
    CGFloat fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum ABI31_0_0RNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum ABI31_0_0RNSVGFontWeight fontWeight;
    NSString *fontFeatureSettings;
    enum ABI31_0_0RNSVGFontVariantLigatures fontVariantLigatures;
    enum ABI31_0_0RNSVGTextAnchor textAnchor;
    enum ABI31_0_0RNSVGTextDecoration textDecoration;
    CGFloat kerning;
    CGFloat wordSpacing;
    CGFloat letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(ABI31_0_0RNSVGFontData *)parent;

@end

#define ABI31_0_0RNSVGFontData_DEFAULT_FONT_SIZE 12.0
