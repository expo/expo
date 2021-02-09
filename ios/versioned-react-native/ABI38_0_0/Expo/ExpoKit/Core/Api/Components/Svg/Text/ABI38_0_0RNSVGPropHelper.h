#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ABI38_0_0RNSVGLength.h"

#ifndef ABI38_0_0RNSVGPropHelper_h
#define ABI38_0_0RNSVGPropHelper_h

@interface ABI38_0_0RNSVGPropHelper : NSObject

+ (CGFloat) fromRelativeWithNSString:(NSString *)length
                           relative:(CGFloat)relative
                           fontSize:(CGFloat)fontSize;

+ (CGFloat) fromRelative:(ABI38_0_0RNSVGLength*)length
               relative:(CGFloat)relative
               fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI38_0_0RNSVGLength*)length
              relative:(CGFloat)relative;
@end

#endif
