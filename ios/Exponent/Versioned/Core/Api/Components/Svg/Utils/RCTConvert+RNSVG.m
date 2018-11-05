/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert+RNSVG.h"

#import "RNSVGPainterBrush.h"
#import "RNSVGSolidColorBrush.h"
#import <React/RCTLog.h>
#import <React/RCTFont.h>

@implementation RCTConvert (RNSVG)

RCT_ENUM_CONVERTER(RNSVGCGFCRule, (@{
                                     @"evenodd": @(kRNSVGCGFCRuleEvenodd),
                                     @"nonzero": @(kRNSVGCGFCRuleNonzero),
                                     }), kRNSVGCGFCRuleNonzero, intValue)

RCT_ENUM_CONVERTER(RNSVGVBMOS, (@{
                                  @"meet": @(kRNSVGVBMOSMeet),
                                  @"slice": @(kRNSVGVBMOSSlice),
                                  @"none": @(kRNSVGVBMOSNone)
                                  }), kRNSVGVBMOSMeet, intValue)

RCT_ENUM_CONVERTER(RNSVGUnits, (@{
                                     @"objectBoundingBox": @(kRNSVGUnitsObjectBoundingBox),
                                     @"userSpaceOnUse": @(kRNSVGUnitsUserSpaceOnUse),
                                     }), kRNSVGUnitsObjectBoundingBox, intValue)

+ (RNSVGCGFloatArray)RNSVGCGFloatArray:(id)json
{
    NSArray *arr = [self NSNumberArray:json];
    NSUInteger count = arr.count;

    RNSVGCGFloatArray array;
    array.count = count;
    array.array = nil;

    if (count) {
        // Ideally, these arrays should already use the same memory layout.
        // In that case we shouldn't need this new malloc.
        array.array = malloc(sizeof(CGFloat) * count);
        for (NSUInteger i = 0; i < count; i++) {
            array.array[i] = [arr[i] doubleValue];
        }
    }

    return array;
}

+ (RNSVGBrush *)RNSVGBrush:(id)json
{
    NSArray *arr = [self NSArray:json];
    NSUInteger type = [self NSUInteger:arr.firstObject];

    switch (type) {
        case 0: // solid color
            // These are probably expensive allocations since it's often the same value.
            // We should memoize colors but look ups may be just as expensive.
            return [[RNSVGSolidColorBrush alloc] initWithArray:arr];
        case 1: // brush
            return [[RNSVGPainterBrush alloc] initWithArray:arr];
        default:
            RCTLogError(@"Unknown brush type: %zd", type);
            return nil;
    }
}

+ (RNSVGPathParser *)RNSVGCGPath:(NSString *)d
{
    return [[RNSVGPathParser alloc] initWithPathString: d];
}

+ (CGRect)RNSVGCGRect:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset + 4) {
        RCTLogError(@"Too few elements in array (expected at least %zd): %@", 4 + offset, arr);
        return CGRectZero;
    }
    return (CGRect){
        {[self CGFloat:arr[offset]], [self CGFloat:arr[offset + 1]]},
        {[self CGFloat:arr[offset + 2]], [self CGFloat:arr[offset + 3]]},
    };
}

+ (CGColorRef)RNSVGCGColor:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset + 4) {
        RCTLogError(@"Too few elements in array (expected at least %zd): %@", 4 + offset, arr);
        return nil;
    }
    return [self CGColor:[arr subarrayWithRange:(NSRange){offset, 4}]];
}

+ (CGGradientRef)RNSVGCGGradient:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset) {
        RCTLogError(@"Too few elements in array (expected at least %zd): %@", offset, arr);
        return nil;
    }
    arr = [arr subarrayWithRange:(NSRange){offset, arr.count - offset}];
    RNSVGCGFloatArray colorsAndOffsets = [self RNSVGCGFloatArray:arr];
    size_t stops = colorsAndOffsets.count / 5;
    CGColorSpaceRef rgb = CGColorSpaceCreateDeviceRGB();


    CGGradientRef gradient = CGGradientCreateWithColorComponents(
                                                                 rgb,
                                                                 colorsAndOffsets.array,
                                                                 colorsAndOffsets.array + stops * 4,
                                                                 stops
                                                                 );

    CGColorSpaceRelease(rgb);
    free(colorsAndOffsets.array);
    return (CGGradientRef)CFAutorelease(gradient);
}

@end
