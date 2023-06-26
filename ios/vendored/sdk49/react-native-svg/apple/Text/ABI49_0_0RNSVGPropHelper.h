#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "ABI49_0_0RNSVGLength.h"

#ifndef ABI49_0_0RNSVGPropHelper_h
#define ABI49_0_0RNSVGPropHelper_h

@interface ABI49_0_0RNSVGPropHelper : NSObject

+ (CGFloat)fromRelativeWithNSString:(NSString *)length relative:(CGFloat)relative fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI49_0_0RNSVGLength *)length relative:(CGFloat)relative fontSize:(CGFloat)fontSize;

+ (CGFloat)fromRelative:(ABI49_0_0RNSVGLength *)length relative:(CGFloat)relative;
@end

#endif
