#import <React/UIView+React.h>
#import <CoreText/CoreText.h>
#import "RNSVGFontData.h"

@class RNSVGText;
@class RNSVGGroup;
@class RNSVGGlyphContext;

@interface RNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (RNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(RNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<RNSVGLength*>*)x
                  y:(NSArray<RNSVGLength*>*)y
             deltaX:(NSArray<RNSVGLength*>*)deltaX
             deltaY:(NSArray<RNSVGLength*>*)deltaY
             rotate:(NSArray<RNSVGLength*>*)rotate;

- (void)pushContext:(RNSVGGroup*)node
                             font:(NSDictionary *)font;

- (NSArray*)getFontContext;

@end
