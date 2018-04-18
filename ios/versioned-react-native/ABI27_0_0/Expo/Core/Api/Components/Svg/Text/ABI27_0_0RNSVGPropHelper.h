#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

#ifndef ABI27_0_0RNSVGPropHelper_h
#define ABI27_0_0RNSVGPropHelper_h

@interface ABI27_0_0RNSVGPropHelper : NSObject

+ (double) fromRelativeWithNSString:(NSString *)length
                           relative:(double)relative
                             offset:(double)offset
                              scale:(double)scale
                           fontSize:(double)fontSize;

@end

#endif
