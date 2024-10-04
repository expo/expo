/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTConvert+Transform.h"

static const NSUInteger kMatrixArrayLength = 4 * 4;

@implementation ABI42_0_0RCTConvert (Transform)

+ (CGFloat)convertToRadians:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    if ([stringValue hasSuffix:@"deg"]) {
      CGFloat degrees = [[stringValue substringToIndex:stringValue.length - 3] floatValue];
      return degrees * M_PI / 180;
    }
    if ([stringValue hasSuffix:@"rad"]) {
      return [[stringValue substringToIndex:stringValue.length - 3] floatValue];
    }
  }
  return [json floatValue];
}

+ (CATransform3D)CATransform3DFromMatrix:(id)json
{
  CATransform3D transform = CATransform3DIdentity;
  if (!json) {
    return transform;
  }
  if (![json isKindOfClass:[NSArray class]]) {
    ABI42_0_0RCTLogConvertError(json, @"a CATransform3D. Expected array for transform matrix.");
    return transform;
  }
  if ([json count] != kMatrixArrayLength) {
    ABI42_0_0RCTLogConvertError(json, @"a CATransform3D. Expected 4x4 matrix array.");
    return transform;
  }
  for (NSUInteger i = 0; i < kMatrixArrayLength; i++) {
    ((CGFloat *)&transform)[i] = [ABI42_0_0RCTConvert CGFloat:json[i]];
  }
  return transform;
}

+ (CATransform3D)CATransform3D:(id)json
{
  CATransform3D transform = CATransform3DIdentity;
  if (!json) {
    return transform;
  }
  if (![json isKindOfClass:[NSArray class]]) {
    ABI42_0_0RCTLogConvertError(json, @"a CATransform3D. Did you pass something other than an array?");
    return transform;
  }
  // legacy matrix support
  if ([(NSArray *)json count] == kMatrixArrayLength && [json[0] isKindOfClass:[NSNumber class]]) {
    ABI42_0_0RCTLogWarn(
        @"[ABI42_0_0RCTConvert CATransform3D:] has deprecated a matrix as input. Pass an array of configs (which can contain a matrix key) instead.");
    return [self CATransform3DFromMatrix:json];
  }

  CGFloat zeroScaleThreshold = FLT_EPSILON;

  CATransform3D next;
  for (NSDictionary *transformConfig in (NSArray<NSDictionary *> *)json) {
    if (transformConfig.count != 1) {
      ABI42_0_0RCTLogConvertError(json, @"a CATransform3D. You must specify exactly one property per transform object.");
      return transform;
    }
    NSString *property = transformConfig.allKeys[0];
    id value = transformConfig[property];

    if ([property isEqualToString:@"matrix"]) {
      next = [self CATransform3DFromMatrix:value];
      transform = CATransform3DConcat(next, transform);

    } else if ([property isEqualToString:@"perspective"]) {
      next = CATransform3DIdentity;
      next.m34 = -1 / [value floatValue];
      transform = CATransform3DConcat(next, transform);

    } else if ([property isEqualToString:@"rotateX"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 1, 0, 0);

    } else if ([property isEqualToString:@"rotateY"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 0, 1, 0);

    } else if ([property isEqualToString:@"rotate"] || [property isEqualToString:@"rotateZ"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 0, 0, 1);

    } else if ([property isEqualToString:@"scale"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, scale, scale, 1);

    } else if ([property isEqualToString:@"scaleX"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, scale, 1, 1);

    } else if ([property isEqualToString:@"scaleY"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, 1, scale, 1);

    } else if ([property isEqualToString:@"translate"]) {
      NSArray *array = (NSArray<NSNumber *> *)value;
      CGFloat translateX = [array[0] floatValue];
      CGFloat translateY = [array[1] floatValue];
      CGFloat translateZ = array.count > 2 ? [array[2] floatValue] : 0;
      transform = CATransform3DTranslate(transform, translateX, translateY, translateZ);

    } else if ([property isEqualToString:@"translateX"]) {
      CGFloat translate = [value floatValue];
      transform = CATransform3DTranslate(transform, translate, 0, 0);

    } else if ([property isEqualToString:@"translateY"]) {
      CGFloat translate = [value floatValue];
      transform = CATransform3DTranslate(transform, 0, translate, 0);

    } else if ([property isEqualToString:@"skewX"]) {
      CGFloat skew = [self convertToRadians:value];
      next = CATransform3DIdentity;
      next.m21 = tanf(skew);
      transform = CATransform3DConcat(next, transform);

    } else if ([property isEqualToString:@"skewY"]) {
      CGFloat skew = [self convertToRadians:value];
      next = CATransform3DIdentity;
      next.m12 = tanf(skew);
      transform = CATransform3DConcat(next, transform);

    } else {
      ABI42_0_0RCTLogError(@"Unsupported transform type for a CATransform3D: %@.", property);
    }
  }
  return transform;
}

@end
