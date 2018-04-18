#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>
#import <CoreText/CoreText.h>
#import "ABI27_0_0RNSVGFontData.h"

@class ABI27_0_0RNSVGText;
@class ABI27_0_0RNSVGGroup;
@class ABI27_0_0RNSVGGlyphContext;

@interface ABI27_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithScale:(float)scale_
                        width:(float)width
                       height:(float)height;

- (ABI27_0_0RNSVGFontData *)getFont;

- (double)getFontSize;

- (float)getHeight;

- (float)getWidth;

- (double)nextDeltaX;

- (double)nextDeltaY;

- (NSNumber*)nextRotation;

- (double)nextXWithDouble:(double)advance;

- (double)nextY;

- (void)popContext;

- (void)pushContext:(ABI27_0_0RNSVGText *)node
                            font:(NSDictionary *)font
                               x:(NSArray*)x
                               y:(NSArray*)y
                          deltaX:(NSArray*)deltaX
                          deltaY:(NSArray*)deltaY
                          rotate:(NSArray*)rotate;

- (void)pushContext:(ABI27_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;


@end
