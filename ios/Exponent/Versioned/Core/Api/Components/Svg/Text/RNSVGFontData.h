#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "RNSVGTextProperties.h"
#import "RNSVGPropHelper.h"

@interface RNSVGFontData : NSObject {
@public
    CGFloat fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum RNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum RNSVGFontWeight fontWeight;
    NSString *fontFeatureSettings;
    enum RNSVGFontVariantLigatures fontVariantLigatures;
    enum RNSVGTextAnchor textAnchor;
    enum RNSVGTextDecoration textDecoration;
    CGFloat kerning;
    CGFloat wordSpacing;
    CGFloat letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(RNSVGFontData *)parent;

@end

#define RNSVGFontData_DEFAULT_FONT_SIZE 12.0
