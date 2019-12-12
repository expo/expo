/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ZXMathUtils.h"
#import "ZXResultPoint.h"

@implementation ZXResultPoint

- (id)initWithX:(float)x y:(float)y {
  if (self = [super init]) {
    _x = x;
    _y = y;
  }

  return self;
}

+ (id)resultPointWithX:(float)x y:(float)y {
  return [[self alloc] initWithX:x y:y];
}

- (id)copyWithZone:(NSZone *)zone {
  return [[ZXResultPoint allocWithZone:zone] initWithX:self.x y:self.y];
}

- (BOOL)isEqual:(id)other {
  if ([other isKindOfClass:[ZXResultPoint class]]) {
    ZXResultPoint *otherPoint = (ZXResultPoint *)other;
    return self.x == otherPoint.x && self.y == otherPoint.y;
  }
  return NO;
}

- (NSUInteger)hash {
  return 31 * *((int *)(&_x)) + *((int *)(&_y));
}

- (NSString *)description {
  return [NSString stringWithFormat:@"(%f,%f)", self.x, self.y];
}

+ (void)orderBestPatterns:(NSMutableArray *)patterns {
  float zeroOneDistance = [self distance:patterns[0] pattern2:patterns[1]];
  float oneTwoDistance = [self distance:patterns[1] pattern2:patterns[2]];
  float zeroTwoDistance = [self distance:patterns[0] pattern2:patterns[2]];
  ZXResultPoint *pointA;
  ZXResultPoint *pointB;
  ZXResultPoint *pointC;
  if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance) {
    pointB = patterns[0];
    pointA = patterns[1];
    pointC = patterns[2];
  } else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance) {
    pointB = patterns[1];
    pointA = patterns[0];
    pointC = patterns[2];
  } else {
    pointB = patterns[2];
    pointA = patterns[0];
    pointC = patterns[1];
  }

  if ([self crossProductZ:pointA pointB:pointB pointC:pointC] < 0.0f) {
    ZXResultPoint *temp = pointA;
    pointA = pointC;
    pointC = temp;
  }
  patterns[0] = pointA;
  patterns[1] = pointB;
  patterns[2] = pointC;
}

+ (float)distance:(ZXResultPoint *)pattern1 pattern2:(ZXResultPoint *)pattern2 {
  return [ZXMathUtils distance:pattern1.x aY:pattern1.y bX:pattern2.x bY:pattern2.y];
}

/**
 * Returns the z component of the cross product between vectors BC and BA.
 */
+ (float)crossProductZ:(ZXResultPoint *)pointA pointB:(ZXResultPoint *)pointB pointC:(ZXResultPoint *)pointC {
  float bX = pointB.x;
  float bY = pointB.y;
  return ((pointC.x - bX) * (pointA.y - bY)) - ((pointC.y - bY) * (pointA.x - bX));
}

@end
