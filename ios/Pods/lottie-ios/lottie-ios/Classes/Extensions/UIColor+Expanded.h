#import "LOTPlatformCompat.h"

// From http://github.com/ars/uicolor-utilities
#define CLAMP(val,min,max)    MIN(MAX(val,min),max)

@interface UIColor (UIColor_Expanded)
@property (nonatomic, readonly) CGColorSpaceModel colorSpaceModel;
@property (nonatomic, readonly) BOOL canProvideRGBComponents;
@property (nonatomic, readonly) CGFloat red; // Only valid if canProvideRGBComponents is YES
@property (nonatomic, readonly) CGFloat green; // Only valid if canProvideRGBComponents is YES
@property (nonatomic, readonly) CGFloat blue; // Only valid if canProvideRGBComponents is YES
@property (nonatomic, readonly) CGFloat white; // Only valid if colorSpaceModel == kCGColorSpaceModelMonochrome
@property (nonatomic, readonly) CGFloat alpha;
@property (nonatomic, readonly) UInt32 rgbHex;

- (NSString *)LOT_colorSpaceString;

- (NSArray *)LOT_arrayFromRGBAComponents;

- (BOOL)LOT_red:(CGFloat *)r green:(CGFloat *)g blue:(CGFloat *)b alpha:(CGFloat *)a;

- (UIColor *)LOT_colorByLuminanceMapping;

- (UIColor *)LOT_colorByMultiplyingByRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha;
- (UIColor *)       LOT_colorByAddingRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha;
- (UIColor *) LOT_colorByLighteningToRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha;
- (UIColor *)  LOT_colorByDarkeningToRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha;

- (UIColor *)LOT_colorByMultiplyingBy:(CGFloat)f;
- (UIColor *)       LOT_colorByAdding:(CGFloat)f;
- (UIColor *) LOT_colorByLighteningTo:(CGFloat)f;
- (UIColor *)  LOT_colorByDarkeningTo:(CGFloat)f;

- (UIColor *)LOT_colorByMultiplyingByColor:(UIColor *)color;
- (UIColor *)       LOT_colorByAddingColor:(UIColor *)color;
- (UIColor *) LOT_colorByLighteningToColor:(UIColor *)color;
- (UIColor *)  LOT_colorByDarkeningToColor:(UIColor *)color;

- (NSString *)LOT_stringFromColor;
- (NSString *)LOT_hexStringValue;

+ (UIColor *)LOT_randomColor;
+ (UIColor *)LOT_colorWithString:(NSString *)stringToConvert;
+ (UIColor *)LOT_colorWithRGBHex:(UInt32)hex;
+ (UIColor *)LOT_colorWithHexString:(NSString *)stringToConvert;

+ (UIColor *)LOT_colorWithName:(NSString *)cssColorName;

+ (UIColor *)LOT_colorByLerpingFromColor:(UIColor *)fromColor toColor:(UIColor *)toColor amount:(CGFloat)amount;

@end
