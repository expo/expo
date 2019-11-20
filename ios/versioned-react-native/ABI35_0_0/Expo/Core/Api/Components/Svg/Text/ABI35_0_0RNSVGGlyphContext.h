#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>
#import <CoreText/CoreText.h>
#import "ABI35_0_0RNSVGFontData.h"

@class ABI35_0_0RNSVGText;
@class ABI35_0_0RNSVGGroup;
@class ABI35_0_0RNSVGGlyphContext;

@interface ABI35_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (ABI35_0_0RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(ABI35_0_0RNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<ABI35_0_0RNSVGLength*>*)x
                  y:(NSArray<ABI35_0_0RNSVGLength*>*)y
             deltaX:(NSArray<ABI35_0_0RNSVGLength*>*)deltaX
             deltaY:(NSArray<ABI35_0_0RNSVGLength*>*)deltaY
             rotate:(NSArray<ABI35_0_0RNSVGLength*>*)rotate;

- (void)pushContext:(ABI35_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;

- (NSArray*)getFontContext;

@end
