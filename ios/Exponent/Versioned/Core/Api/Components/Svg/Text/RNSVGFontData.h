#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "RNSVGTextProperties.h"
#import "RNSVGPropHelper.h"

@interface RNSVGFontData : NSObject {
@public
    double fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum RNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum RNSVGFontWeight fontWeight;
    NSString *fontFeatureSettings;
    enum RNSVGFontVariantLigatures fontVariantLigatures;
    enum RNSVGTextAnchor textAnchor;
    enum RNSVGTextDecoration textDecoration;
    double kerning;
    double wordSpacing;
    double letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (double)toAbsoluteWithNSString:(NSString *)string
                           scale:(double)scale
                        fontSize:(double)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(RNSVGFontData *)parent
                               scale:(double)scale;

@end

#define RNSVGFontData_DEFAULT_FONT_SIZE 12.0
