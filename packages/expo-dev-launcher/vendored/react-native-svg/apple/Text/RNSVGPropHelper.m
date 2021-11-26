#include "RNSVGPropHelper.h"
@implementation RNSVGPropHelper

+ (CGFloat)fromRelativeWithNSString:(NSString *)length
                          relative:(CGFloat)relative
                          fontSize:(CGFloat)fontSize {
    length = [length stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    NSUInteger stringLength = [length length];
    NSInteger percentIndex = stringLength - 1;
    if (stringLength == 0) {
        return 0;
    }
    else if ([length characterAtIndex:percentIndex] == '%') {
        return (CGFloat)[[length substringWithRange:NSMakeRange(0, percentIndex)] doubleValue] / 100 * relative;
    }
    else {
        NSInteger twoLetterUnitIndex = stringLength - 2;
        if (twoLetterUnitIndex > 0) {
            NSString *lastTwo = [length substringFromIndex:twoLetterUnitIndex];
            NSUInteger end = twoLetterUnitIndex;
            CGFloat unit = 1;
            if ([lastTwo isEqualToString:@"px"]) {

            } else if ([lastTwo isEqualToString:@"em"]) {
                unit = fontSize;
            } else if ([lastTwo isEqualToString:@"ex"]) {
                unit = fontSize / 2;
            } else if ([lastTwo isEqualToString:@"pt"]) {
                unit = 1.25;
            } else if ([lastTwo isEqualToString:@"pc"]) {
                unit = 15;
            } else if ([lastTwo isEqualToString:@"mm"]) {
                unit = (CGFloat)3.543307;
            } else if ([lastTwo isEqualToString:@"cm"]) {
                unit = (CGFloat)35.43307;
            } else if ([lastTwo isEqualToString:@"in"]) {
                unit = 90;
            } else {
                end = stringLength;
            }

            return (CGFloat)[[length substringWithRange:NSMakeRange(0, end)] doubleValue] * unit;
        } else {
            return (CGFloat)[length doubleValue];
        }
    }
}

+ (CGFloat)fromRelative:(RNSVGLength*)length
              relative:(CGFloat)relative
              fontSize:(CGFloat)fontSize {
    RNSVGLengthUnitType unitType = length.unit;
    CGFloat value = length.value;
    CGFloat unit = 1;
    switch (unitType) {
        case SVG_LENGTHTYPE_NUMBER:
        case SVG_LENGTHTYPE_PX:
            return value;
            break;

        case SVG_LENGTHTYPE_PERCENTAGE:
            return value / 100 * relative;

        case SVG_LENGTHTYPE_EMS:
            unit = fontSize;
            break;
        case SVG_LENGTHTYPE_EXS:
            unit = fontSize / 2;
            break;

        case SVG_LENGTHTYPE_CM:
            unit = (CGFloat)35.43307;
            break;
        case SVG_LENGTHTYPE_MM:
            unit = (CGFloat)3.543307;
            break;
        case SVG_LENGTHTYPE_IN:
            unit = 90;
            break;
        case SVG_LENGTHTYPE_PT:
            unit = 1.25;
            break;
        case SVG_LENGTHTYPE_PC:
            unit = 15;
            break;

        default:
        case SVG_LENGTHTYPE_UNKNOWN:
            return value;
    }
    return value * unit;
}

+ (CGFloat)fromRelative:(RNSVGLength*)length
              relative:(CGFloat)relative {
    RNSVGLengthUnitType unitType = length.unit;
    CGFloat value = length.value;
    CGFloat unit = 1;
    switch (unitType) {
        case SVG_LENGTHTYPE_NUMBER:
        case SVG_LENGTHTYPE_PX:
            return value;
            break;

        case SVG_LENGTHTYPE_PERCENTAGE:
            return value / 100 * relative;

        case SVG_LENGTHTYPE_EMS:
            unit = 12;
            break;
        case SVG_LENGTHTYPE_EXS:
            unit = 6;
            break;

        case SVG_LENGTHTYPE_CM:
            unit = (CGFloat)35.43307;
            break;
        case SVG_LENGTHTYPE_MM:
            unit = (CGFloat)3.543307;
            break;
        case SVG_LENGTHTYPE_IN:
            unit = 90;
            break;
        case SVG_LENGTHTYPE_PT:
            unit = 1.25;
            break;
        case SVG_LENGTHTYPE_PC:
            unit = 15;
            break;

        default:
        case SVG_LENGTHTYPE_UNKNOWN:
            return value;
    }
    return value * unit;
}

@end
