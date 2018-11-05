#import <React/UIView+React.h>
#import <CoreText/CoreText.h>
#import "RNSVGFontData.h"

@class RNSVGText;
@class RNSVGGroup;
@class RNSVGGlyphContext;

@interface RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithScale:(float)scale_
                        width:(float)width
                       height:(float)height;

- (RNSVGFontData *)getFont;

- (double)getFontSize;

- (float)getHeight;

- (float)getWidth;

- (double)nextDeltaX;

- (double)nextDeltaY;

- (NSNumber*)nextRotation;

- (double)nextXWithDouble:(double)advance;

- (double)nextY;

- (void)popContext;

- (void)pushContext:(RNSVGText *)node
                            font:(NSDictionary *)font
                               x:(NSArray*)x
                               y:(NSArray*)y
                          deltaX:(NSArray*)deltaX
                          deltaY:(NSArray*)deltaY
                          rotate:(NSArray*)rotate;

- (void)pushContext:(RNSVGGroup*)node
                             font:(NSDictionary *)font;


@end
