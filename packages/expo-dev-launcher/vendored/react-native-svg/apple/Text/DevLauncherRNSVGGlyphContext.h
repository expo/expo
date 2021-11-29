#import <React/UIView+React.h>
#import <CoreText/CoreText.h>
#import "DevLauncherRNSVGFontData.h"

@class DevLauncherRNSVGText;
@class DevLauncherRNSVGGroup;
@class DevLauncherRNSVGGlyphContext;

@interface DevLauncherRNSVGGlyphContext : NSObject

- (CTFontRef)getGlyphFont;

- (instancetype)initWithWidth:(CGFloat)width
                       height:(CGFloat)height;

- (DevLauncherRNSVGFontData *)getFont;

- (CGFloat)getFontSize;

- (CGFloat)getHeight;

- (CGFloat)getWidth;

- (CGFloat)nextDeltaX;

- (CGFloat)nextDeltaY;

- (CGFloat)nextRotation;

- (CGFloat)nextXWithDouble:(CGFloat)advance;

- (CGFloat)nextY;

- (void)popContext;

- (void)pushContext:(DevLauncherRNSVGText*)node
               font:(NSDictionary*)font
                  x:(NSArray<DevLauncherRNSVGLength*>*)x
                  y:(NSArray<DevLauncherRNSVGLength*>*)y
             deltaX:(NSArray<DevLauncherRNSVGLength*>*)deltaX
             deltaY:(NSArray<DevLauncherRNSVGLength*>*)deltaY
             rotate:(NSArray<DevLauncherRNSVGLength*>*)rotate;

- (void)pushContext:(DevLauncherRNSVGGroup*)node
                             font:(NSDictionary *)font;

- (NSArray*)getFontContext;

@end
