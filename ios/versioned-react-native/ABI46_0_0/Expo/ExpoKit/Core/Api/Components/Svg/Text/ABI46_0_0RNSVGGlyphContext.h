#import <ABI46_0_0React/ABI46_0_0UIView+React.h>
#import <CoreText/CoreText.h>
#import "ABI46_0_0RNSVGFontData.h"

@class ABI46_0_0RNSVGText;
@class ABI46_0_0RNSVGGroup;
@class ABI46_0_0RNSVGGlyphContext;

@interface ABI46_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (ABI46_0_0RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(ABI46_0_0RNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<ABI46_0_0RNSVGLength*>*)x
                  y:(NSArray<ABI46_0_0RNSVGLength*>*)y
             deltaX:(NSArray<ABI46_0_0RNSVGLength*>*)deltaX
             deltaY:(NSArray<ABI46_0_0RNSVGLength*>*)deltaY
             rotate:(NSArray<ABI46_0_0RNSVGLength*>*)rotate;

- (void)pushContext:(ABI46_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;

- (NSArray*)getFontContext;

@end
