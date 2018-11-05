/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTConvert+ART.h"

#import <ReactABI30_0_0/ABI30_0_0RCTFont.h>
#import <ReactABI30_0_0/ABI30_0_0RCTLog.h>

#import "ABI30_0_0ARTLinearGradient.h"
#import "ABI30_0_0ARTPattern.h"
#import "ABI30_0_0ARTRadialGradient.h"
#import "ABI30_0_0ARTSolidColor.h"

@implementation ABI30_0_0RCTConvert (ABI30_0_0ART)

+ (CGPathRef)CGPath:(id)json
{
  NSArray *arr = [self NSNumberArray:json];

  NSUInteger count = [arr count];

#define NEXT_VALUE [self double:arr[i++]]

  CGMutablePathRef path = CGPathCreateMutable();
  CGPathMoveToPoint(path, NULL, 0, 0);

  @try {
    NSUInteger i = 0;
    while (i < count) {
      NSUInteger type = [arr[i++] unsignedIntegerValue];
      switch (type) {
        case 0:
          CGPathMoveToPoint(path, NULL, NEXT_VALUE, NEXT_VALUE);
          break;
        case 1:
          CGPathCloseSubpath(path);
          break;
        case 2:
          CGPathAddLineToPoint(path, NULL, NEXT_VALUE, NEXT_VALUE);
          break;
        case 3:
          CGPathAddCurveToPoint(path, NULL, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE);
          break;
        case 4:
          CGPathAddArc(path, NULL, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE, NEXT_VALUE == 0);
          break;
        default:
          ABI30_0_0RCTLogError(@"Invalid CGPath type %llu at element %llu of %@", (unsigned long long)type, (unsigned long long)i, arr);
          CGPathRelease(path);
          return NULL;
      }
    }
  }
  @catch (NSException *exception) {
    ABI30_0_0RCTLogError(@"Invalid CGPath format: %@", arr);
    CGPathRelease(path);
    return NULL;
  }

  return (CGPathRef)CFAutorelease(path);
}

ABI30_0_0RCT_ENUM_CONVERTER(CTTextAlignment, (@{
  @"auto": @(kCTTextAlignmentNatural),
  @"left": @(kCTTextAlignmentLeft),
  @"center": @(kCTTextAlignmentCenter),
  @"right": @(kCTTextAlignmentRight),
  @"justify": @(kCTTextAlignmentJustified),
}), kCTTextAlignmentNatural, integerValue)

// This takes a tuple of text lines and a font to generate a CTLine for each text line.
// This prepares everything for rendering a frame of text in ABI30_0_0ARTText.
+ (ABI30_0_0ARTTextFrame)ABI30_0_0ARTTextFrame:(id)json
{
  NSDictionary *dict = [self NSDictionary:json];
  ABI30_0_0ARTTextFrame frame;
  frame.count = 0;

  NSArray *lines = [self NSArray:dict[@"lines"]];
  NSUInteger lineCount = [lines count];
  if (lineCount == 0) {
    return frame;
  }

  CTFontRef font = (__bridge CTFontRef)[self UIFont:dict[@"font"]];
  if (!font) {
    return frame;
  }

  // Create a dictionary for this font
  CFDictionaryRef attributes = (__bridge CFDictionaryRef)@{
    (NSString *)kCTFontAttributeName:(__bridge id)font,
    (NSString *)kCTForegroundColorFromContextAttributeName: @YES
  };

  // Set up text frame with font metrics
  CGFloat size = CTFontGetSize(font);
  frame.count = lineCount;
  frame.baseLine = size; // estimate base line
  frame.lineHeight = size * 1.1; // Base on ABI30_0_0ART canvas line height estimate
  frame.lines = malloc(sizeof(CTLineRef) * lineCount);
  frame.widths = malloc(sizeof(CGFloat) * lineCount);

  [lines enumerateObjectsUsingBlock:^(NSString *text, NSUInteger i, BOOL *stop) {

    CFStringRef string = (__bridge CFStringRef)text;
    CFAttributedStringRef attrString = CFAttributedStringCreate(kCFAllocatorDefault, string, attributes);
    CTLineRef line = CTLineCreateWithAttributedString(attrString);
    CFRelease(attrString);

    frame.lines[i] = line;
    frame.widths[i] = CTLineGetTypographicBounds(line, NULL, NULL, NULL);
  }];

  return frame;
}

+ (ABI30_0_0ARTCGFloatArray)ABI30_0_0ARTCGFloatArray:(id)json
{
  NSArray *arr = [self NSNumberArray:json];
  NSUInteger count = arr.count;

  ABI30_0_0ARTCGFloatArray array;
  array.count = count;
  array.array = NULL;

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

+ (ABI30_0_0ARTBrush *)ABI30_0_0ARTBrush:(id)json
{
  NSArray *arr = [self NSArray:json];
  NSUInteger type = [self NSUInteger:arr.firstObject];
  switch (type) {
    case 0: // solid color
      // These are probably expensive allocations since it's often the same value.
      // We should memoize colors but look ups may be just as expensive.
      return [[ABI30_0_0ARTSolidColor alloc] initWithArray:arr];
    case 1: // linear gradient
      return [[ABI30_0_0ARTLinearGradient alloc] initWithArray:arr];
    case 2: // radial gradient
      return [[ABI30_0_0ARTRadialGradient alloc] initWithArray:arr];
    case 3: // pattern
      return [[ABI30_0_0ARTPattern alloc] initWithArray:arr];
    default:
      ABI30_0_0RCTLogError(@"Unknown brush type: %llu", (unsigned long long)type);
      return nil;
  }
}

+ (CGPoint)CGPoint:(id)json offset:(NSUInteger)offset
{
  NSArray *arr = [self NSArray:json];
  if (arr.count < offset + 2) {
    ABI30_0_0RCTLogError(@"Too few elements in array (expected at least %llu): %@", (unsigned long long)(2 + offset), arr);
    return CGPointZero;
  }
  return (CGPoint){
    [self CGFloat:arr[offset]],
    [self CGFloat:arr[offset + 1]],
  };
}

+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset
{
  NSArray *arr = [self NSArray:json];
  if (arr.count < offset + 4) {
    ABI30_0_0RCTLogError(@"Too few elements in array (expected at least %llu): %@", (unsigned long long)(4 + offset), arr);
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
    ABI30_0_0RCTLogError(@"Too few elements in array (expected at least %llu): %@", (unsigned long long)(4 + offset), arr);
    return NULL;
  }
  return [self CGColor:[arr subarrayWithRange:(NSRange){offset, 4}]];
}

+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset
{
  NSArray *arr = [self NSArray:json];
  if (arr.count < offset) {
    ABI30_0_0RCTLogError(@"Too few elements in array (expected at least %llu): %@", (unsigned long long)offset, arr);
    return NULL;
  }
  arr = [arr subarrayWithRange:(NSRange){offset, arr.count - offset}];
  ABI30_0_0ARTCGFloatArray colorsAndOffsets = [self ABI30_0_0ARTCGFloatArray:arr];
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
