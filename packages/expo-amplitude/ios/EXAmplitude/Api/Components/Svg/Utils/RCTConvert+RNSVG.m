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

NSRegularExpression *RNSVGDigitRegEx;

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

+ (CGFloat*)RNSVGCGFloatArray:(id)json
{
    NSArray *arr = [self NSNumberArray:json];
    NSUInteger count = arr.count;

    CGFloat* array = nil;

    if (count) {
        // Ideally, these arrays should already use the same memory layout.
        // In that case we shouldn't need this new malloc.
        array = malloc(sizeof(CGFloat) * count);
        for (NSUInteger i = 0; i < count; i++) {
            array[i] = (CGFloat)[arr[i] doubleValue];
        }
    }

    return array;
}

+ (RNSVGBrush *)RNSVGBrush:(id)json
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *value = [self NSString:json];
        if (!RNSVGDigitRegEx) {
            RNSVGDigitRegEx = [NSRegularExpression regularExpressionWithPattern:@"[0-9.-]+" options:NSRegularExpressionCaseInsensitive error:nil];
        }
        NSArray<NSTextCheckingResult*> *_matches = [RNSVGDigitRegEx matchesInString:value options:0 range:NSMakeRange(0, [value length])];
        NSMutableArray<NSNumber*> *output = [NSMutableArray array];
        NSUInteger i = 0;
        [output addObject:[NSNumber numberWithInteger:0]];
        for (NSTextCheckingResult *match in _matches) {
            NSString* strNumber = [value substringWithRange:match.range];
            [output addObject:[NSNumber numberWithDouble:(i++ < 3 ? strNumber.doubleValue / 255 : strNumber.doubleValue)]];
        }
        if ([output count] < 5) {
            [output addObject:[NSNumber numberWithDouble:1]];
        }
        return [[RNSVGSolidColorBrush alloc] initWithArray:output];
    }
    NSArray *arr = [self NSArray:json];
    NSUInteger type = [self NSUInteger:arr.firstObject];

    switch (type) {
        case 0: // solid color
            // These are probably expensive allocations since it's often the same value.
            // We should memoize colors but look ups may be just as expensive.
            return [[RNSVGSolidColorBrush alloc] initWithArray:arr];
        case 1: // brush
            return [[RNSVGPainterBrush alloc] initWithArray:arr];
        case 2: // currentColor
            return [[RNSVGBrush alloc] initWithArray:nil];
        default:
            RCTLogError(@"Unknown brush type: %zd", (unsigned long)type);
            return nil;
    }
}

+ (RNSVGPathParser *)RNSVGCGPath:(NSString *)d
{
    return [[RNSVGPathParser alloc] initWithPathString: d];
}

+ (RNSVGLength *)RNSVGLength:(id)json
{
    if ([json isKindOfClass:[NSNumber class]]) {
        return [RNSVGLength lengthWithNumber:(CGFloat)[json doubleValue]];
    } else if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        return [RNSVGLength lengthWithString:stringValue];
    } else {
        return [[RNSVGLength alloc] init];
    }
}

+ (NSArray<RNSVGLength *>*)RNSVGLengthArray:(id)json
{
    if ([json isKindOfClass:[NSNumber class]]) {
        RNSVGLength* length = [RNSVGLength lengthWithNumber:(CGFloat)[json doubleValue]];
        return [NSArray arrayWithObject:length];
    } else if ([json isKindOfClass:[NSArray class]]) {
        NSArray *arrayValue = (NSArray*)json;
        NSMutableArray<RNSVGLength*>* lengths = [NSMutableArray arrayWithCapacity:[arrayValue count]];
        for (id obj in arrayValue) {
            [lengths addObject:[self RNSVGLength:obj]];
        }
        return lengths;
    }  else if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        RNSVGLength* length = [RNSVGLength lengthWithString:stringValue];
        return [NSArray arrayWithObject:length];
    } else {
        return nil;
    }
}

+ (CGRect)RNSVGCGRect:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset + 4) {
        RCTLogError(@"Too few elements in array (expected at least %zd): %@", (ssize_t)(4 + offset), arr);
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
        RCTLogError(@"Too few elements in array (expected at least %zd): %@", (ssize_t)(4 + offset), arr);
        return nil;
    }
    return [self CGColor:[arr subarrayWithRange:(NSRange){offset, 4}]];
}

+ (CGGradientRef)RNSVGCGGradient:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset) {
        RCTLogError(@"Too few elements in array (expected at least %zd): %@", (unsigned long)offset, arr);
        return nil;
    }
    arr = [arr subarrayWithRange:(NSRange){offset, arr.count - offset}];
    CGFloat* colorsAndOffsets = [self RNSVGCGFloatArray:arr];
    size_t stops = arr.count / 5;
    CGColorSpaceRef rgb = CGColorSpaceCreateDeviceRGB();


    CGGradientRef gradient = CGGradientCreateWithColorComponents(
                                                                 rgb,
                                                                 colorsAndOffsets,
                                                                 colorsAndOffsets + stops * 4,
                                                                 stops
                                                                 );

    CGColorSpaceRelease(rgb);
    free(colorsAndOffsets);
    return (CGGradientRef)CFAutorelease(gradient);
}

@end

