#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

#ifndef RNSVGPropHelper_h
#define RNSVGPropHelper_h

@interface RNSVGPropHelper : NSObject

+ (double) fromRelativeWithNSString:(NSString *)length
                           relative:(double)relative
                             offset:(double)offset
                              scale:(double)scale
                           fontSize:(double)fontSize;

@end

#endif
