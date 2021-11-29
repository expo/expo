#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "DevLauncherRNSVGLength.h"

#ifndef DevLauncherRNSVGPropHelper_h
#define DevLauncherRNSVGPropHelper_h

@interface DevLauncherRNSVGPropHelper : NSObject

+ (CGFloat) fromRelativeWithNSString:(NSString *)length
                           relative:(CGFloat)relative
                           fontSize:(CGFloat)fontSize;

+ (CGFloat) fromRelative:(DevLauncherRNSVGLength*)length
               relative:(CGFloat)relative
               fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(DevLauncherRNSVGLength*)length
              relative:(CGFloat)relative;
@end

#endif
