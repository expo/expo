#include "RNSVGPropHelper.h"
@implementation RNSVGPropHelper

+ (double)fromRelativeWithNSString:(NSString *)length
                          relative:(double)relative
                            offset:(double)offset
                             scale:(double)scale
                          fontSize:(double)fontSize {
    length = [length stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    NSUInteger stringLength = [length length];
    NSInteger percentIndex = stringLength - 1;
    if (stringLength == 0) {
        return offset;
    }
    else if ([length characterAtIndex:percentIndex] == '%') {
        return [[length substringWithRange:NSMakeRange(0, percentIndex)] doubleValue] / 100 * relative + offset;
    }
    else {
        NSInteger twoLetterUnitIndex = stringLength - 2;
        if (twoLetterUnitIndex > 0) {
            NSString *lastTwo = [length substringFromIndex:twoLetterUnitIndex];
            NSUInteger end = twoLetterUnitIndex;
            double unit = 1;
            if ([lastTwo isEqualToString:@"px"]) {
                
            } else if ([lastTwo isEqualToString:@"em"]) {
                unit = fontSize;
            } else if ([lastTwo isEqualToString:@"pt"]) {
                unit = 1.25;
            } else if ([lastTwo isEqualToString:@"pc"]) {
                unit = 15;
            } else if ([lastTwo isEqualToString:@"mm"]) {
                unit = 3.543307;
            } else if ([lastTwo isEqualToString:@"cm"]) {
                unit = 35.43307;
            } else if ([lastTwo isEqualToString:@"in"]) {
                unit = 90;
            } else {
                end = stringLength;
            }
            
            return [[length substringWithRange:NSMakeRange(0, end)] doubleValue] * unit * scale + offset;
        } else {
            return [length doubleValue] * scale + offset;
        }
    }
}

@end
