/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTConvert+RNSVG.h"

#import "ABI31_0_0RNSVGPainterBrush.h"
#import "ABI31_0_0RNSVGSolidColorBrush.h"
#import <ReactABI31_0_0/ABI31_0_0RCTLog.h>
#import <ReactABI31_0_0/ABI31_0_0RCTFont.h>

NSRegularExpression *ABI31_0_0RNSVGDigitRegEx;

@implementation ABI31_0_0RCTConvert (ABI31_0_0RNSVG)

ABI31_0_0RCT_ENUM_CONVERTER(ABI31_0_0RNSVGCGFCRule, (@{
                                     @"evenodd": @(kRNSVGCGFCRuleEvenodd),
                                     @"nonzero": @(kRNSVGCGFCRuleNonzero),
                                     }), kRNSVGCGFCRuleNonzero, intValue)

ABI31_0_0RCT_ENUM_CONVERTER(ABI31_0_0RNSVGVBMOS, (@{
                                  @"meet": @(kRNSVGVBMOSMeet),
                                  @"slice": @(kRNSVGVBMOSSlice),
                                  @"none": @(kRNSVGVBMOSNone)
                                  }), kRNSVGVBMOSMeet, intValue)

ABI31_0_0RCT_ENUM_CONVERTER(ABI31_0_0RNSVGUnits, (@{
                                  @"objectBoundingBox": @(kRNSVGUnitsObjectBoundingBox),
                                  @"userSpaceOnUse": @(kRNSVGUnitsUserSpaceOnUse),
                                  }), kRNSVGUnitsObjectBoundingBox, intValue)

+ (CGFloat*)ABI31_0_0RNSVGCGFloatArray:(id)json
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

+ (ABI31_0_0RNSVGBrush *)ABI31_0_0RNSVGBrush:(id)json
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *value = [self NSString:json];
        if (!ABI31_0_0RNSVGDigitRegEx) {
            ABI31_0_0RNSVGDigitRegEx = [NSRegularExpression regularExpressionWithPattern:@"[0-9.-]+" options:NSRegularExpressionCaseInsensitive error:nil];
        }
        NSArray<NSTextCheckingResult*> *_matches = [ABI31_0_0RNSVGDigitRegEx matchesInString:value options:0 range:NSMakeRange(0, [value length])];
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
        return [[ABI31_0_0RNSVGSolidColorBrush alloc] initWithArray:output];
    }
    NSArray *arr = [self NSArray:json];
    NSUInteger type = [self NSUInteger:arr.firstObject];

    switch (type) {
        case 0: // solid color
            // These are probably expensive allocations since it's often the same value.
            // We should memoize colors but look ups may be just as expensive.
            return [[ABI31_0_0RNSVGSolidColorBrush alloc] initWithArray:arr];
        case 1: // brush
            return [[ABI31_0_0RNSVGPainterBrush alloc] initWithArray:arr];
        case 2: // currentColor
            return [[ABI31_0_0RNSVGBrush alloc] initWithArray:nil];
        default:
            ABI31_0_0RCTLogError(@"Unknown brush type: %zd", (unsigned long)type);
            return nil;
    }
}

+ (ABI31_0_0RNSVGPathParser *)ABI31_0_0RNSVGCGPath:(NSString *)d
{
    return [[ABI31_0_0RNSVGPathParser alloc] initWithPathString: d];
}

+ (ABI31_0_0RNSVGLength *)ABI31_0_0RNSVGLength:(id)json
{
    if ([json isKindOfClass:[NSNumber class]]) {
        return [ABI31_0_0RNSVGLength lengthWithNumber:(CGFloat)[json doubleValue]];
    } else if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        return [ABI31_0_0RNSVGLength lengthWithString:stringValue];
    } else {
        return [[ABI31_0_0RNSVGLength alloc] init];
    }
}

+ (NSArray<ABI31_0_0RNSVGLength *>*)ABI31_0_0RNSVGLengthArray:(id)json
{
    if ([json isKindOfClass:[NSNumber class]]) {
        ABI31_0_0RNSVGLength* length = [ABI31_0_0RNSVGLength lengthWithNumber:(CGFloat)[json doubleValue]];
        return [NSArray arrayWithObject:length];
    } else if ([json isKindOfClass:[NSArray class]]) {
        NSArray *arrayValue = (NSArray*)json;
        NSMutableArray<ABI31_0_0RNSVGLength*>* lengths = [NSMutableArray arrayWithCapacity:[arrayValue count]];
        for (id obj in arrayValue) {
            [lengths addObject:[self ABI31_0_0RNSVGLength:obj]];
        }
        return lengths;
    }  else if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        ABI31_0_0RNSVGLength* length = [ABI31_0_0RNSVGLength lengthWithString:stringValue];
        return [NSArray arrayWithObject:length];
    } else {
        return nil;
    }
}

+ (CGRect)ABI31_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset + 4) {
        ABI31_0_0RCTLogError(@"Too few elements in array (expected at least %zd): %@", (ssize_t)(4 + offset), arr);
        return CGRectZero;
    }
    return (CGRect){
        {[self CGFloat:arr[offset]], [self CGFloat:arr[offset + 1]]},
        {[self CGFloat:arr[offset + 2]], [self CGFloat:arr[offset + 3]]},
    };
}

+ (CGColorRef)ABI31_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset + 4) {
        ABI31_0_0RCTLogError(@"Too few elements in array (expected at least %zd): %@", (ssize_t)(4 + offset), arr);
        return nil;
    }
    return [self CGColor:[arr subarrayWithRange:(NSRange){offset, 4}]];
}

+ (CGGradientRef)ABI31_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset) {
        ABI31_0_0RCTLogError(@"Too few elements in array (expected at least %zd): %@", (unsigned long)offset, arr);
        return nil;
    }
    arr = [arr subarrayWithRange:(NSRange){offset, arr.count - offset}];
    CGFloat* colorsAndOffsets = [self ABI31_0_0RNSVGCGFloatArray:arr];
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

