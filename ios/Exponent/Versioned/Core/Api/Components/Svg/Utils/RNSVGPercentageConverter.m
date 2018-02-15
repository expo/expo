/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGPercentageConverter.h"

@implementation RNSVGPercentageConverter

static NSRegularExpression* percentageRegExp;

+(void)initialize
{
    percentageRegExp = [[NSRegularExpression alloc] initWithPattern:@"^(\\-?\\d+(?:\\.\\d+)?)%$" options:0 error:nil];
}

+ (CGFloat)stringToFloat:(NSString *)string relative:(CGFloat)relative offset:(CGFloat)offset
{
    if (string == nil) {
        return offset;
    } else if (![self isPercentage:string]) {
        return [string floatValue] + offset;
    } else {
        return [self percentageToFloat:string relative:relative offset:offset];
    }
}

+ (CGFloat)percentageToFloat:(NSString *)percentage relative:(CGFloat)relative offset:(CGFloat)offset
{
    __block CGFloat matched;
    
    [percentageRegExp enumerateMatchesInString:percentage
                                                  options:0
                                                    range:NSMakeRange(0, percentage.length)
                                               usingBlock:^(NSTextCheckingResult *result, NSMatchingFlags flags, BOOL *stop)
     {
         
         matched = [[percentage substringWithRange:NSMakeRange(result.range.location, result.range.length)] floatValue];
         matched = matched / 100 * relative + offset;
     }];
    
    return matched;
}

+ (BOOL)isPercentage:(NSString *) string
{
    if (![string isKindOfClass:[NSString class]]) {
      return NO;
    }
    return [percentageRegExp firstMatchInString:string options:0 range:NSMakeRange(0, [string length])] != nil;
}

@end
