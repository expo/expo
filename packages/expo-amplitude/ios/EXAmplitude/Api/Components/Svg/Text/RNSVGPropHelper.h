#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "RNSVGLength.h"

#ifndef RNSVGPropHelper_h
#define RNSVGPropHelper_h

@interface RNSVGPropHelper : NSObject

+ (CGFloat) fromRelativeWithNSString:(NSString *)length
                           relative:(CGFloat)relative
                           fontSize:(CGFloat)fontSize;

+ (CGFloat) fromRelative:(RNSVGLength*)length
               relative:(CGFloat)relative
               fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(RNSVGLength*)length
              relative:(CGFloat)relative;
@end

#endif
