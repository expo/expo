#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

#ifndef ABI29_0_0RNSVGPropHelper_h
#define ABI29_0_0RNSVGPropHelper_h

@interface ABI29_0_0RNSVGPropHelper : NSObject

+ (double) fromRelativeWithNSString:(NSString *)length
                           relative:(double)relative
                             offset:(double)offset
                              scale:(double)scale
                           fontSize:(double)fontSize;

@end

#endif
