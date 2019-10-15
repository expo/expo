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

#import "ZXDataMatrixDetector.h"
#import "ZXDetectorResult.h"
#import "ZXErrors.h"
#import "ZXGridSampler.h"
#import "ZXMathUtils.h"
#import "ZXResultPoint.h"
#import "ZXWhiteRectangleDetector.h"


@interface ZXDataMatrixDetector ()

@property (nonatomic, strong, readonly) ZXBitMatrix *image;
@property (nonatomic, strong, readonly) ZXWhiteRectangleDetector *rectangleDetector;

@end

@implementation ZXDataMatrixDetector

- (id)initWithImage:(ZXBitMatrix *)image error:(NSError **)error {
  if (self = [super init]) {
    _image = image;
    _rectangleDetector = [[ZXWhiteRectangleDetector alloc] initWithImage:_image error:error];
    if (!_rectangleDetector) {
      return nil;
    }
  }

  return self;
}

- (ZXDetectorResult *)detectWithError:(NSError **)error {
  NSArray *cornerPoints = [self.rectangleDetector detectWithError:error];
  if (!cornerPoints) {
    return nil;
  }

  NSMutableArray *points = [self detectSolid1:[cornerPoints mutableCopy]];
  points = [self detectSolid2:points];
  ZXResultPoint *correctedTopRight = [self correctTopRight:points];
  if (!correctedTopRight) {
    return nil;
  }
  points[3] = correctedTopRight;
  points = [self shiftToModuleCenter:points];

  ZXResultPoint *topLeft = points[0];
  ZXResultPoint *bottomLeft = points[1];
  ZXResultPoint *bottomRight = points[2];
  ZXResultPoint *topRight = points[3];

  int dimensionTop = [self transitionsBetween:topLeft to:topRight] + 1;
  int dimensionRight = [self transitionsBetween:bottomRight to:topRight] + 1;

  if ((dimensionTop & 0x01) == 1) {
    dimensionTop += 1;
  }
  if ((dimensionRight & 0x01) == 1) {
    dimensionRight += 1;
  }

  if (4 * dimensionTop < 7 * dimensionRight && 4 * dimensionRight < 7 * dimensionTop) {
    // The matrix is square
    dimensionTop = dimensionRight = MAX(dimensionTop, dimensionRight);
  }

  ZXBitMatrix *bits = [self sampleGrid:self.image topLeft:topLeft bottomLeft:bottomLeft bottomRight:bottomRight topRight:topRight dimensionX:dimensionTop dimensionY:dimensionRight error:error];

  return [[ZXDetectorResult alloc] initWithBits:bits points:@[topLeft, bottomLeft, bottomRight, topRight]];
}

- (ZXResultPoint *)shiftPoint:(ZXResultPoint *)point to:(ZXResultPoint *)to div:(int)div {
  float x = (to.x - point.x) / (div + 1);
  float y = (to.y - point.y) / (div + 1);
  return [[ZXResultPoint alloc] initWithX:point.x + x y:point.y + y];
}

- (ZXResultPoint *)moveAway:(ZXResultPoint *)point fromX:(float)fromX fromY:(float)fromY {
  float x = point.x;
  float y = point.y;

  if (x < fromX) {
    x -= 1;
  } else {
    x += 1;
  }

  if (y < fromY) {
    y -= 1;
  } else {
    y += 1;
  }

  return [[ZXResultPoint alloc] initWithX:x y:y];
}

/**
 * Detect a solid side which has minimum transition.
 */
- (NSMutableArray *)detectSolid1:(NSMutableArray *)cornerPoints {
  // 0  2
  // 1  3
  ZXResultPoint *pointA = cornerPoints[0];
  ZXResultPoint *pointB = cornerPoints[1];
  ZXResultPoint *pointC = cornerPoints[3];
  ZXResultPoint *pointD = cornerPoints[2];

  int trAB = [self transitionsBetween:pointA to:pointB];
  int trBC = [self transitionsBetween:pointB to:pointC];
  int trCD = [self transitionsBetween:pointC to:pointD];
  int trDA = [self transitionsBetween:pointD to:pointA];

  // 0..3
  // :  :
  // 1--2
  int min = trAB;
  NSMutableArray *points = [@[pointD, pointA, pointB, pointC] mutableCopy];
  if (min > trBC) {
    min = trBC;
    points[0] = pointA;
    points[1] = pointB;
    points[2] = pointC;
    points[3] = pointD;
  }
  if (min > trCD) {
    min = trCD;
    points[0] = pointB;
    points[1] = pointC;
    points[2] = pointD;
    points[3] = pointA;
  }
  if (min > trDA) {
    points[0] = pointC;
    points[1] = pointD;
    points[2] = pointA;
    points[3] = pointB;
  }

  return points;
}

/**
 * Detect a second solid side next to first solid side.
 */
- (NSMutableArray *)detectSolid2:(NSMutableArray *)points {
  // A..D
  // :  :
  // B--C
  ZXResultPoint *pointA = points[0];
  ZXResultPoint *pointB = points[1];
  ZXResultPoint *pointC = points[2];
  ZXResultPoint *pointD = points[3];

  // Transition detection on the edge is not stable.
  // To safely detect, shift the points to the module center.
  int tr = [self transitionsBetween:pointA to:pointD];
  ZXResultPoint *pointBs = [self shiftPoint:pointB to:pointC div:(tr + 1) * 4];
  ZXResultPoint *pointCs = [self shiftPoint:pointC to:pointB div:(tr + 1) * 4];
  int trBA = [self transitionsBetween:pointBs to:pointA];
  int trCD = [self transitionsBetween:pointCs to:pointD];

  // 0..3
  // |  :
  // 1--2
  if (trBA < trCD) {
    // solid sides: A-B-C
    points[0] = pointA;
    points[1] = pointB;
    points[2] = pointC;
    points[3] = pointD;
  } else {
    // solid sides: B-C-D
    points[0] = pointB;
    points[1] = pointC;
    points[2] = pointD;
    points[3] = pointA;
  }

  return points;
}

/**
 * Calculates the corner position of the white top right module.
 */
- (ZXResultPoint *)correctTopRight:(NSMutableArray *)points {
  // A..D
  // |  :
  // B--C
  ZXResultPoint *pointA = points[0];
  ZXResultPoint *pointB = points[1];
  ZXResultPoint *pointC = points[2];
  ZXResultPoint *pointD = points[3];

  // shift points for safe transition detection.
  int trTop = [self transitionsBetween:pointA to:pointD];
  int trRight = [self transitionsBetween:pointB to:pointD];
  ZXResultPoint *pointAs = [self shiftPoint:pointA to:pointB div:(trRight + 1) * 4];
  ZXResultPoint *pointCs = [self shiftPoint:pointC to:pointB div:(trTop + 1) * 4];

  trTop = [self transitionsBetween:pointAs to:pointD];
  trRight = [self transitionsBetween:pointCs to:pointD];

  ZXResultPoint *candidate1 = [[ZXResultPoint alloc] initWithX:pointD.x + (pointC.x - pointB.x) / (trTop + 1)
                                                             y:pointD.y + (pointC.y - pointB.y) / (trTop + 1)];

  ZXResultPoint *candidate2 = [[ZXResultPoint alloc] initWithX:pointD.x + (pointA.x - pointB.x) / (trRight + 1)
                                                             y:pointD.y + (pointA.y - pointB.y) / (trRight + 1)];

  if (![self isValid:candidate1]) {
    if ([self isValid:candidate2]) {
      return candidate2;
    }
    return nil;
  }
  if (![self isValid:candidate2]) {
    return candidate1;
  }

  int sumc1 = [self transitionsBetween:pointAs to:candidate1] + [self transitionsBetween:pointCs to:candidate1];
  int sumc2 = [self transitionsBetween:pointAs to:candidate2] + [self transitionsBetween:pointCs to:candidate2];

  if (sumc1 > sumc2) {
    return candidate1;
  } else {
    return candidate2;
  }
}

- (BOOL) isValid:(ZXResultPoint *)p {
  return [p x] >= 0 && [p x] < self.image.width && [p y] > 0 && [p y] < self.image.height;
}

/**
 * Shift the edge points to the module center.
 */
- (NSMutableArray *)shiftToModuleCenter:(NSMutableArray *)points {
  // A..D
  // |  :
  // B--C
  ZXResultPoint *pointA = points[0];
  ZXResultPoint *pointB = points[1];
  ZXResultPoint *pointC = points[2];
  ZXResultPoint *pointD = points[3];

  // calculate pseudo dimensions
  int dimH = [self transitionsBetween:pointA to:pointD] + 1;
  int dimV = [self transitionsBetween:pointC to:pointD] + 1;

  // shift points for safe dimension detection
  ZXResultPoint *pointAs = [self shiftPoint:pointA to:pointB div:dimV * 4];
  ZXResultPoint *pointCs = [self shiftPoint:pointC to:pointB div:dimH * 4];

  //  calculate more precise dimensions
  dimH = [self transitionsBetween:pointAs to:pointD] + 1;
  dimV = [self transitionsBetween:pointCs to:pointD] + 1;
  if ((dimH & 0x01) == 1) {
    dimH += 1;
  }
  if ((dimV & 0x01) == 1) {
    dimV += 1;
  }

  // WhiteRectangleDetector returns points inside of the rectangle.
  // I want points on the edges.
  float centerX = (pointA.x + pointB.x + pointC.x + pointD.x) / 4;
  float centerY = (pointA.y + pointB.y + pointC.y + pointD.y) / 4;
  pointA = [self moveAway:pointA fromX:centerX fromY:centerY];
  pointB = [self moveAway:pointB fromX:centerX fromY:centerY];
  pointC = [self moveAway:pointC fromX:centerX fromY:centerY];
  pointD = [self moveAway:pointD fromX:centerX fromY:centerY];

  ZXResultPoint *pointBs;
  ZXResultPoint *pointDs;

  // shift points to the center of each modules
  pointAs = [self shiftPoint:pointA to:pointB div:dimV * 4];
  pointAs = [self shiftPoint:pointAs to:pointD div:dimH * 4];
  pointBs = [self shiftPoint:pointB to:pointA div:dimV * 4];
  pointBs = [self shiftPoint:pointBs to:pointC div:dimH * 4];
  pointCs = [self shiftPoint:pointC to:pointD div:dimV * 4];
  pointCs = [self shiftPoint:pointCs to:pointB div:dimH * 4];
  pointDs = [self shiftPoint:pointD to:pointC div:dimV * 4];
  pointDs = [self shiftPoint:pointDs to:pointA div:dimH * 4];

  return [@[pointAs, pointBs, pointCs, pointDs] mutableCopy];
}

- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)image
                    topLeft:(ZXResultPoint *)topLeft
                 bottomLeft:(ZXResultPoint *)bottomLeft
                bottomRight:(ZXResultPoint *)bottomRight
                   topRight:(ZXResultPoint *)topRight
                 dimensionX:(int)dimensionX
                 dimensionY:(int)dimensionY
                      error:(NSError **)error {
  ZXGridSampler *sampler = [ZXGridSampler instance];
  return [sampler sampleGrid:image
                  dimensionX:dimensionX dimensionY:dimensionY
                       p1ToX:0.5f p1ToY:0.5f
                       p2ToX:dimensionX - 0.5f p2ToY:0.5f
                       p3ToX:dimensionX - 0.5f p3ToY:dimensionY - 0.5f
                       p4ToX:0.5f p4ToY:dimensionY - 0.5f
                     p1FromX:[topLeft x] p1FromY:[topLeft y]
                     p2FromX:[topRight x] p2FromY:[topRight y]
                     p3FromX:[bottomRight x] p3FromY:[bottomRight y]
                     p4FromX:[bottomLeft x] p4FromY:[bottomLeft y]
                       error:error];
}

/**
 * Counts the number of black/white transitions between two points, using something like Bresenham's algorithm.
 */
- (int)transitionsBetween:(ZXResultPoint *)from to:(ZXResultPoint *)to {
  int fromX = (int)[from x];
  int fromY = (int)[from y];
  int toX = (int)[to x];
  int toY = (int)[to y];
  BOOL steep = abs(toY - fromY) > abs(toX - fromX);
  if (steep) {
    int temp = fromX;
    fromX = fromY;
    fromY = temp;
    temp = toX;
    toX = toY;
    toY = temp;
  }

  int dx = abs(toX - fromX);
  int dy = abs(toY - fromY);
  int error = -dx / 2;
  int ystep = fromY < toY ? 1 : -1;
  int xstep = fromX < toX ? 1 : -1;
  int transitions = 0;
  BOOL inBlack = [self.image getX:steep ? fromY : fromX y:steep ? fromX : fromY];
  for (int x = fromX, y = fromY; x != toX; x += xstep) {
    BOOL isBlack = [self.image getX:steep ? y : x y:steep ? x : y];
    if (isBlack != inBlack) {
      transitions++;
      inBlack = isBlack;
    }
    error += dy;
    if (error > 0) {
      if (y == toY) {
        break;
      }
      y += ystep;
      error -= dx;
    }
  }
  return transitions;
}

@end
