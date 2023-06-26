#import <CoreText/CoreText.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import "ABI49_0_0RNSVGFontData.h"

@class ABI49_0_0RNSVGText;
@class ABI49_0_0RNSVGGroup;
@class ABI49_0_0RNSVGGlyphContext;

@interface ABI49_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width height:(CGFloat)height;

- (ABI49_0_0RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(ABI49_0_0RNSVGText *)node
               font:(NSDictionary *)font
                  x:(NSArray<ABI49_0_0RNSVGLength *> *)x
                  y:(NSArray<ABI49_0_0RNSVGLength *> *)y
             deltaX:(NSArray<ABI49_0_0RNSVGLength *> *)deltaX
             deltaY:(NSArray<ABI49_0_0RNSVGLength *> *)deltaY
             rotate:(NSArray<ABI49_0_0RNSVGLength *> *)rotate;

- (void)pushContext:(ABI49_0_0RNSVGGroup *)node font:(NSDictionary *)font;

- (NSArray *)getFontContext;

@end
