/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGPercentageConverter.h"

@implementation RNSVGPercentageConverter
{
    CGFloat _relative;
    CGFloat _offset;
    NSRegularExpression *percentageRegularExpression;
}

- (instancetype) initWithRelativeAndOffset:(CGFloat)relative offset:(CGFloat)offset
{
    if (self = [super init]) {
        _relative = relative;
        _offset = offset;
        percentageRegularExpression = [[NSRegularExpression alloc] initWithPattern:@"^(\\-?\\d+(?:\\.\\d+)?)%$" options:0 error:nil];
    }
    return self;
}

- (id)init
{
    if (self = [super init]) {
        percentageRegularExpression = [[NSRegularExpression alloc] initWithPattern:@"^(\\-?\\d+(?:\\.\\d+)?)%$" options:0 error:nil];
    }
    return self;
}

- (NSRegularExpression *) getPercentageRegularExpression
{
    return percentageRegularExpression;
}

- (CGFloat) stringToFloat:(NSString *)string
{
    return [self stringToFloat:string relative:_relative offset:_offset];
}

- (CGFloat) stringToFloat:(NSString *)string relative:(CGFloat)relative offset:(CGFloat)offset
{
    if ([self isPercentage:string] == NO) {
        return [string floatValue];
    } else {
        return [self percentageToFloat:string relative:relative offset:offset];
    }
}

- (CGFloat) percentageToFloat:(NSString *)percentage
{
    return [self percentageToFloat:percentage relative:_relative offset:_offset];
}

- (CGFloat) percentageToFloat:(NSString *)percentage relative:(CGFloat)relative offset:(CGFloat)offset
{
    __block CGFloat matched;
    
    [percentageRegularExpression enumerateMatchesInString:percentage
                                                  options:0
                                                    range:NSMakeRange(0, percentage.length)
                                               usingBlock:^(NSTextCheckingResult *result, NSMatchingFlags flags, BOOL *stop)
     {
         
         matched = [[percentage substringWithRange:NSMakeRange(result.range.location, result.range.length)] floatValue];
         matched = matched / 100 * relative + offset;
     }];
    
    return matched;
}

- (BOOL) isPercentage:(NSString *) string
{
    return [percentageRegularExpression firstMatchInString:string options:0 range:NSMakeRange(0, [string length])] != nil;
}

@end
