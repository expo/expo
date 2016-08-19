/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert+RNSVG.h"

#import "RNSVGBaseBrush.h"
#import "RNSVGPattern.h"
#import "RNSVGSolidColorBrush.h"
#import "RCTLog.h"
#import "RNSVGCGFCRule.h"
#import "RNSVGVBMOS.h"

@implementation RCTConvert (RNSVG)

+ (CGPathRef)CGPath:(id)json
{
    NSArray *arr = [self NSNumberArray:json];
    
    NSUInteger count = [arr count];
    
#define NEXT_VALUE [self double:arr[i++]]
    
    CGMutablePathRef path = CGPathCreateMutable();
    CGPathMoveToPoint(path, nil, 0, 0);
    
    @try {
        NSUInteger i = 0;
        while (i < count) {
            NSUInteger type = [arr[i++] unsignedIntegerValue];
            switch (type) {
                case 0:
                    CGPathMoveToPoint(path, nil, NEXT_VALUE, NEXT_VALUE);
                    break;
                case 1:
                    CGPathCloseSubpath(path);
                    break;
                case 2:
                    CGPathAddLineToPoint(path, nil, NEXT_VALUE, NEXT_VALUE);
                    break;
                case 3:
                    CGPathAddCurveToPoint(path, nil, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE);
                    break;
                case 4:
                    CGPathAddArc(path, NULL, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE == 0);
                    break;
                default:
                    RCTLogError(@"Invalid CGPath type %zd at element %zd of %@", type, i, arr);
                    CGPathRelease(path);
                    return nil;
            }
        }
    }
    @catch (NSException *exception) {
        RCTLogError(@"Invalid CGPath format: %@", arr);
        CGPathRelease(path);
        return nil;
    }
    
    return (CGPathRef)CFAutorelease(path);
}

RCT_ENUM_CONVERTER(CTTextAlignment, (@{
                                       @"auto": @(kCTTextAlignmentNatural),
                                       @"left": @(kCTTextAlignmentLeft),
                                       @"center": @(kCTTextAlignmentCenter),
                                       @"right": @(kCTTextAlignmentRight),
                                       @"justify": @(kCTTextAlignmentJustified),
                                       }), kCTTextAlignmentNatural, integerValue)

RCT_ENUM_CONVERTER(RNSVGCGFCRule, (@{
                                     @"evenodd": @(kRNSVGCGFCRuleEvenodd),
                                     @"nonzero": @(kRNSVGCGFCRuleNonzero),
                                     }), kRNSVGCGFCRuleNonzero, intValue)

RCT_ENUM_CONVERTER(RNSVGVBMOS, (@{
                                  @"meet": @(kRNSVGVBMOSMeet),
                                  @"slice": @(kRNSVGVBMOSSlice),
                                  @"none": @(kRNSVGVBMOSNone)
                                  }), kRNSVGVBMOSMeet, intValue)


// This takes a tuple of text lines and a font to generate a CTLine for each text line.
// This prepares everything for rendering a frame of text in RNSVGText.
+ (RNSVGTextFrame)RNSVGTextFrame:(id)json
{
    NSDictionary *dict = [self NSDictionary:json];
    RNSVGTextFrame frame;
    frame.count = 0;
    
    NSArray *lines = [self NSArray:dict[@"lines"]];
    NSUInteger lineCount = [lines count];
    if (lineCount == 0) {
        return frame;
    }
    
    NSDictionary *fontDict = dict[@"font"];
    NSString *fontFamily = fontDict[@"fontFamily"];
    
    if (![[UIFont familyNames] containsObject:fontFamily]) {
        fontFamily = nil;
    }
    
    CTFontRef font = (__bridge CTFontRef)[self UIFont:nil withFamily:fontFamily size:fontDict[@"fontSize"] weight:fontDict[@"fontWeight"] style:fontDict[@"fontStyle"] scaleMultiplier:1.0];
    if (!font) {
        return frame;
    }
    
    // Create a dictionary for this font
    CFDictionaryRef attributes = (__bridge CFDictionaryRef)@{
                                                             (NSString *)kCTFontAttributeName: (__bridge id)font,
                                                             (NSString *)kCTForegroundColorFromContextAttributeName: @YES
                                                             };
    
    // Set up text frame with font metrics
    CGFloat size = CTFontGetSize(font);
    frame.count = lineCount;
    frame.baseLine = size; // estimate base line
    frame.lineHeight = size * 1.1; // Base on RNSVG canvas line height estimate
    frame.lines = malloc(sizeof(CTLineRef) * lineCount);
    frame.widths = malloc(sizeof(CGFloat) * lineCount);
    
    [lines enumerateObjectsUsingBlock:^(NSString *text, NSUInteger i, BOOL *stop) {
        
        CFStringRef string = (__bridge CFStringRef)text;
        CFAttributedStringRef attrString = CFAttributedStringCreate(kCFAllocatorDefault, string, attributes);
        CTLineRef line = CTLineCreateWithAttributedString(attrString);
        CFRelease(attrString);
        
        frame.lines[i] = line;
        frame.widths[i] = CTLineGetTypographicBounds(line, nil, nil, nil);
    }];
    
    return frame;
}

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
            return [[RNSVGBaseBrush alloc] initWithArray:arr];
        default:
            RCTLogError(@"Unknown brush type: %zd", type);
            return nil;
    }
}

+ (NSArray *)RNSVGBezier:(id)json
{
    NSArray *arr = [self NSNumberArray:json];
    
    NSMutableArray<NSArray *> *beziers = [[NSMutableArray alloc] init];
    
    NSUInteger count = [arr count];
    
#define NEXT_VALUE [self double:arr[i++]]
    @try {
        NSValue *startPoint = [NSValue valueWithCGPoint: CGPointMake(0, 0)];
        NSUInteger i = 0;
        while (i < count) {
            NSUInteger type = [arr[i++] unsignedIntegerValue];
            switch (type) {
                case 0:
                {
                    startPoint = [NSValue valueWithCGPoint: CGPointMake(NEXT_VALUE, NEXT_VALUE)];
                    [beziers addObject: @[startPoint]];
                    break;
                }
                case 1:
                    [beziers addObject: @[]];
                    break;
                case 2:
                {
                    double x = NEXT_VALUE;
                    double y = NEXT_VALUE;
                    NSValue * destination = [NSValue valueWithCGPoint:CGPointMake(x, y)];
                    [beziers addObject: @[
                                          destination,
                                          startPoint,
                                          destination
                                          ]];
                    break;
                }
                case 3:
                    [beziers addObject: @[
                                          [NSValue valueWithCGPoint:CGPointMake(NEXT_VALUE, NEXT_VALUE)],
                                          [NSValue valueWithCGPoint:CGPointMake(NEXT_VALUE, NEXT_VALUE)],
                                          [NSValue valueWithCGPoint:CGPointMake(NEXT_VALUE, NEXT_VALUE)],
                                          ]];
                    break;
                default:
                    RCTLogError(@"Invalid RNSVGBezier type %zd at element %zd of %@", type, i, arr);
                    return nil;
            }
        }
    }
    @catch (NSException *exception) {
        RCTLogError(@"Invalid RNSVGBezier format: %@", arr);
        return nil;
    }
    
    return beziers;
}

+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset
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

+ (CGColorRef)CGColor:(id)json offset:(NSUInteger)offset
{
    NSArray *arr = [self NSArray:json];
    if (arr.count < offset + 4) {
        RCTLogError(@"Too few elements in array (expected at least %zd): %@", 4 + offset, arr);
        return nil;
    }
    return [self CGColor:[arr subarrayWithRange:(NSRange){offset, 4}]];
}

+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset
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
