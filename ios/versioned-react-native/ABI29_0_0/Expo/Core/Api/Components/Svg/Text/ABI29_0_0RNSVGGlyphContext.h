#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import <CoreText/CoreText.h>
#import "ABI29_0_0RNSVGFontData.h"

@class ABI29_0_0RNSVGText;
@class ABI29_0_0RNSVGGroup;
@class ABI29_0_0RNSVGGlyphContext;

@interface ABI29_0_0RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithScale:(float)scale_
                        width:(float)width
                       height:(float)height;

- (ABI29_0_0RNSVGFontData *)getFont;

- (double)getFontSize;

- (float)getHeight;

- (float)getWidth;

- (double)nextDeltaX;

- (double)nextDeltaY;

- (NSNumber*)nextRotation;

- (double)nextXWithDouble:(double)advance;

- (double)nextY;

- (void)popContext;

- (void)pushContext:(ABI29_0_0RNSVGText *)node
                            font:(NSDictionary *)font
                               x:(NSArray*)x
                               y:(NSArray*)y
                          deltaX:(NSArray*)deltaX
                          deltaY:(NSArray*)deltaY
                          rotate:(NSArray*)rotate;

- (void)pushContext:(ABI29_0_0RNSVGGroup*)node
                             font:(NSDictionary *)font;


@end
