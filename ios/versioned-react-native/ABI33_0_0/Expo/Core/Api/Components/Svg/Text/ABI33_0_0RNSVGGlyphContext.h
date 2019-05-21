#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import <CoreText/CoreText.h>
#import "ABI33_0_0RNSVGFontData.h"

@class ABI33_0_0RNSVGText;
@class ABI33_0_0RNSVGGroup;
@class ABI33_0_0RNSVGGlyphContext;

@interface ABI33_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (ABI33_0_0RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(ABI33_0_0RNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<ABI33_0_0RNSVGLength*>*)x
                  y:(NSArray<ABI33_0_0RNSVGLength*>*)y
             deltaX:(NSArray<ABI33_0_0RNSVGLength*>*)deltaX
             deltaY:(NSArray<ABI33_0_0RNSVGLength*>*)deltaY
             rotate:(NSArray<ABI33_0_0RNSVGLength*>*)rotate;

- (void)pushContext:(ABI33_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;

- (NSArray*)getFontContext;

@end
