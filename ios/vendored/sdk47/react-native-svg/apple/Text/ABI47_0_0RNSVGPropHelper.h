#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ABI47_0_0RNSVGLength.h"

#ifndef ABI47_0_0RNSVGPropHelper_h
#define ABI47_0_0RNSVGPropHelper_h

@interface ABI47_0_0RNSVGPropHelper : NSObject

+ (CGFloat)fromRelativeWithNSString:(NSString *)length relative:(CGFloat)relative fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI47_0_0RNSVGLength *)length relative:(CGFloat)relative fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI47_0_0RNSVGLength *)length relative:(CGFloat)relative;
@end

#endif
