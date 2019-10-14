#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI35_0_0RNSVGTextProperties.h"
#import "ABI35_0_0RNSVGPropHelper.h"

@interface ABI35_0_0RNSVGFontData : NSObject {
@public
    CGFloat fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum ABI35_0_0RNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum ABI35_0_0RNSVGFontWeight fontWeight;
    int absoluteFontWeight;
    NSString *fontFeatureSettings;
    enum ABI35_0_0RNSVGFontVariantLigatures fontVariantLigatures;
    enum ABI35_0_0RNSVGTextAnchor textAnchor;
    enum ABI35_0_0RNSVGTextDecoration textDecoration;
    CGFloat kerning;
    CGFloat wordSpacing;
    CGFloat letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(ABI35_0_0RNSVGFontData *)parent;

@end

#define ABI35_0_0RNSVGFontData_DEFAULT_FONT_SIZE 12.0
