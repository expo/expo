#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ABI32_0_0RNSVGLength.h"

#ifndef ABI32_0_0RNSVGPropHelper_h
#define ABI32_0_0RNSVGPropHelper_h

@interface ABI32_0_0RNSVGPropHelper : NSObject

+ (CGFloat) fromRelativeWithNSString:(NSString *)length
                           relative:(CGFloat)relative
                           fontSize:(CGFloat)fontSize;

+ (CGFloat) fromRelative:(ABI32_0_0RNSVGLength*)length
               relative:(CGFloat)relative
               fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI32_0_0RNSVGLength*)length
              relative:(CGFloat)relative;
@end

#endif
