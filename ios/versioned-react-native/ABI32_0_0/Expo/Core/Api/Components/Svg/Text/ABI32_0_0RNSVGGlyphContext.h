#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>
#import <CoreText/CoreText.h>
#import "ABI32_0_0RNSVGFontData.h"

@class ABI32_0_0RNSVGText;
@class ABI32_0_0RNSVGGroup;
@class ABI32_0_0RNSVGGlyphContext;

@interface ABI32_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (ABI32_0_0RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(ABI32_0_0RNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<ABI32_0_0RNSVGLength*>*)x
                  y:(NSArray<ABI32_0_0RNSVGLength*>*)y
             deltaX:(NSArray<ABI32_0_0RNSVGLength*>*)deltaX
             deltaY:(NSArray<ABI32_0_0RNSVGLength*>*)deltaY
             rotate:(NSArray<ABI32_0_0RNSVGLength*>*)rotate;

- (void)pushContext:(ABI32_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;


@end
