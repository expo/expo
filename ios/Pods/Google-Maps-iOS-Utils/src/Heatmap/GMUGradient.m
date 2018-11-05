/* Copyright (c) 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GMUGradient.h"

@implementation GMUGradient

- (instancetype)initWithColors:(NSArray<UIColor *> *)colors
                   startPoints:(NSArray<NSNumber *> *)startPoints
                  colorMapSize:(NSUInteger)mapSize {
  if ((self = [super init])) {
    if (colors.count == 0 || colors.count != startPoints.count) {
      [NSException raise:NSInvalidArgumentException
                  format:@"colors' size: %lu is not equal to startPoints' size: %lu",
                         (unsigned long)colors.count, (unsigned long)startPoints.count];
    }
    for (int i = 1; i < startPoints.count; i++) {
      if ([startPoints[i - 1] floatValue] > [startPoints[i] floatValue]) {
        [NSException raise:NSInvalidArgumentException
                    format:@"startPoints' are not in non-descending order."];
        return nil;
      }
    }
    if ([startPoints[0] floatValue] < 0 || [startPoints[startPoints.count - 1] floatValue] > 1.0f) {
      [NSException raise:NSInvalidArgumentException
                  format:@"startPoints' are not all in the range [0,1]."];
      return nil;
    }
    if (mapSize < 2) {
      [NSException raise:NSInvalidArgumentException
                  format:@"mapSize is less than 2."];
      return nil;
    }
    _colors = [colors copy];
    _startPoints = [startPoints copy];
    _mapSize = mapSize;
  }
  return self;
}

- (NSArray<UIColor *> *)generateColorMap {
  NSMutableArray<UIColor *> *colorMap = [NSMutableArray arrayWithCapacity:_mapSize];
  int curStartPoint = 0;
  for (int i = 0; i < _mapSize; i++) {
    float targetValue = i * 1.0f / (_mapSize - 1);
    while (curStartPoint < _startPoints.count &&
           targetValue >= [_startPoints[curStartPoint] floatValue]) {
      curStartPoint++;
    }
    // Three cases.
    // curStartPoint is length - use the previous color
    // curStartPoint is 0 - interpolate between current color and transparent.
    // else interpolate between curStartPoint and curStartPoint - 1
    if (curStartPoint == _startPoints.count) {
      colorMap[i] = _colors[curStartPoint - 1];
      continue;
    }
    float curValue = [_startPoints[curStartPoint] floatValue];
    float prevValue = curStartPoint == 0 ? 0 : [_startPoints[curStartPoint - 1] floatValue];
    UIColor *curColor = _colors[curStartPoint];
    UIColor *prevColor = curStartPoint == 0 ? [UIColor clearColor] : _colors[curStartPoint - 1];
    colorMap[i] = [self interpolateColorFrom:prevColor
                                          to:curColor
                                       ratio:(targetValue - prevValue) / (curValue - prevValue)];
  }
  return colorMap;
}

// Perform HSB and alpha interpolation.
- (UIColor *)interpolateColorFrom:(UIColor *)fromColor to:(UIColor *)toColor ratio:(float)ratio {
  CGFloat fromHue = 0;
  CGFloat fromSaturation = 0;
  CGFloat fromBrightness = 0;
  CGFloat fromAlpha = 0;
  if (![fromColor getHue:&fromHue
              saturation:&fromSaturation
              brightness:&fromBrightness
                   alpha:&fromAlpha]) {
    // If color can't be converted, fallback to bands of color.
    // TODO: raise an error instead?
    return fromColor;
  }
  CGFloat toHue = 0;
  CGFloat toSaturation = 0;
  CGFloat toBrightness = 0;
  CGFloat toAlpha = 0;
  if (![toColor getHue:&toHue saturation:&toSaturation brightness:&toBrightness alpha:&toAlpha]) {
    // If color can't be converted, fallback to bands of color.
    // TODO: raise an error instead?
    return fromColor;
  }
  CGFloat targetHue = fromHue + (toHue - fromHue) * ratio;
  // Use 'shortest path' around the color wheel.
  // Note: this logic is nonsense in the presence of extended color spaces as the color wheel isn't
  // 0.0 to 1.0 in that case.
  if (toHue - fromHue > 0.5f) {
    targetHue = fmod((1.0f + fromHue) + (toHue - fromHue - 1.0f) * ratio, 1.0f);
  } else if (toHue - fromHue < -0.5f) {
    targetHue = fmod((fromHue) + (toHue + 1.0f - fromHue) * ratio, 1.0f);
  }
  CGFloat targetSaturation = fromSaturation + (toSaturation - fromSaturation) * ratio;
  CGFloat targetBrightness = fromBrightness + (toBrightness - fromBrightness) * ratio;
  CGFloat targetAlpha = fromAlpha + (toAlpha - fromAlpha) * ratio;
  return [UIColor colorWithHue:targetHue
                    saturation:targetSaturation
                    brightness:targetBrightness
                         alpha:targetAlpha];
}

@end
