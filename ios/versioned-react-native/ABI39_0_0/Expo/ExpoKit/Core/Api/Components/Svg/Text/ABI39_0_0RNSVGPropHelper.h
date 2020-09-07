#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ABI39_0_0RNSVGLength.h"

#ifndef ABI39_0_0RNSVGPropHelper_h
#define ABI39_0_0RNSVGPropHelper_h

@interface ABI39_0_0RNSVGPropHelper : NSObject

+ (CGFloat) fromRelativeWithNSString:(NSString *)length
                           relative:(CGFloat)relative
                           fontSize:(CGFloat)fontSize;

+ (CGFloat) fromRelative:(ABI39_0_0RNSVGLength*)length
               relative:(CGFloat)relative
               fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI39_0_0RNSVGLength*)length
              relative:(CGFloat)relative;
@end

#endif
