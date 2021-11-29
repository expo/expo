#import <Foundation/Foundation.h>

#import "DevLauncherRNSVGUIKit.h"

#import "DevLauncherRNSVGTextProperties.h"
#import "DevLauncherRNSVGPropHelper.h"

@interface DevLauncherRNSVGFontData : NSObject {
@public
    CGFloat fontSize;
    NSString * fontSize_;
    NSString *fontFamily;
    enum DevLauncherRNSVGFontStyle fontStyle;
    NSDictionary * fontData;
    enum DevLauncherRNSVGFontWeight fontWeight;
    int absoluteFontWeight;
    NSString *fontFeatureSettings;
    enum DevLauncherRNSVGFontVariantLigatures fontVariantLigatures;
    enum DevLauncherRNSVGTextAnchor textAnchor;
    enum DevLauncherRNSVGTextDecoration textDecoration;
    CGFloat kerning;
    CGFloat wordSpacing;
    CGFloat letterSpacing;
    bool manualKerning;
}

+ (instancetype)Defaults;

+ (CGFloat)toAbsoluteWithNSString:(NSString *)string
                        fontSize:(CGFloat)fontSize;

+ (instancetype)initWithNSDictionary:(NSDictionary *)font
                              parent:(DevLauncherRNSVGFontData *)parent;

@end

#define DevLauncherRNSVGFontData_DEFAULT_FONT_SIZE 12.0
