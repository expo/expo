#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ABI31_0_0RNSVGLength.h"

#ifndef ABI31_0_0RNSVGPropHelper_h
#define ABI31_0_0RNSVGPropHelper_h

@interface ABI31_0_0RNSVGPropHelper : NSObject

+ (CGFloat) fromRelativeWithNSString:(NSString *)length
                           relative:(CGFloat)relative
                           fontSize:(CGFloat)fontSize;

+ (CGFloat) fromRelative:(ABI31_0_0RNSVGLength*)length
               relative:(CGFloat)relative
               fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI31_0_0RNSVGLength*)length
              relative:(CGFloat)relative;
@end

#endif
