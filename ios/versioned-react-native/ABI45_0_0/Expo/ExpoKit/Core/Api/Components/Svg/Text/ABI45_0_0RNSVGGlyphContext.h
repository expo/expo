#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import <CoreText/CoreText.h>
#import "ABI45_0_0RNSVGFontData.h"

@class ABI45_0_0RNSVGText;
@class ABI45_0_0RNSVGGroup;
@class ABI45_0_0RNSVGGlyphContext;

@interface ABI45_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (ABI45_0_0RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(ABI45_0_0RNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<ABI45_0_0RNSVGLength*>*)x
                  y:(NSArray<ABI45_0_0RNSVGLength*>*)y
             deltaX:(NSArray<ABI45_0_0RNSVGLength*>*)deltaX
             deltaY:(NSArray<ABI45_0_0RNSVGLength*>*)deltaY
             rotate:(NSArray<ABI45_0_0RNSVGLength*>*)rotate;

- (void)pushContext:(ABI45_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;

- (NSArray*)getFontContext;

@end
