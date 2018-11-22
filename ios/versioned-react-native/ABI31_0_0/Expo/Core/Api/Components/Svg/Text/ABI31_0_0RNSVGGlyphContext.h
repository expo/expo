#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>
#import <CoreText/CoreText.h>
#import "ABI31_0_0RNSVGFontData.h"

@class ABI31_0_0RNSVGText;
@class ABI31_0_0RNSVGGroup;
@class ABI31_0_0RNSVGGlyphContext;

@interface ABI31_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (ABI31_0_0RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(ABI31_0_0RNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<ABI31_0_0RNSVGLength*>*)x
                  y:(NSArray<ABI31_0_0RNSVGLength*>*)y
             deltaX:(NSArray<ABI31_0_0RNSVGLength*>*)deltaX
             deltaY:(NSArray<ABI31_0_0RNSVGLength*>*)deltaY
             rotate:(NSArray<ABI31_0_0RNSVGLength*>*)rotate;

- (void)pushContext:(ABI31_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;


@end
