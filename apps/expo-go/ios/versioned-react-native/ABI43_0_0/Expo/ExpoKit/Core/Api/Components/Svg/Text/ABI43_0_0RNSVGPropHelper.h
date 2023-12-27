#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ABI43_0_0RNSVGLength.h"

#ifndef ABI43_0_0RNSVGPropHelper_h
#define ABI43_0_0RNSVGPropHelper_h

@interface ABI43_0_0RNSVGPropHelper : NSObject

+ (CGFloat) fromRelativeWithNSString:(NSString *)length
                           relative:(CGFloat)relative
                           fontSize:(CGFloat)fontSize;

+ (CGFloat) fromRelative:(ABI43_0_0RNSVGLength*)length
               relative:(CGFloat)relative
               fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI43_0_0RNSVGLength*)length
              relative:(CGFloat)relative;
@end

#endif
