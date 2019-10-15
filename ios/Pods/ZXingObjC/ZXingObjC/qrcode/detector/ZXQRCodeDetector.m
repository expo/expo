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

#import "ZXBitMatrix.h"
#import "ZXDecodeHints.h"
#import "ZXDetectorResult.h"
#import "ZXErrors.h"
#import "ZXGridSampler.h"
#import "ZXIntArray.h"
#import "ZXMathUtils.h"
#import "ZXPerspectiveTransform.h"
#import "ZXQRCodeAlignmentPattern.h"
#import "ZXQRCodeAlignmentPatternFinder.h"
#import "ZXQRCodeDetector.h"
#import "ZXQRCodeFinderPattern.h"
#import "ZXQRCodeFinderPatternFinder.h"
#import "ZXQRCodeFinderPatternInfo.h"
#import "ZXQRCodeVersion.h"
#import "ZXResultPoint.h"
#import "ZXResultPointCallback.h"

@interface ZXQRCodeDetector ()

@property (nonatomic, weak) id<ZXResultPointCallback> resultPointCallback;

@end

@implementation ZXQRCodeDetector

- (id)initWithImage:(ZXBitMatrix *)image {
  if (self = [super init]) {
    _image = image;
  }

  return self;
}

- (ZXDetectorResult *)detectWithError:(NSError **)error {
  return [self detect:nil error:error];
}

- (ZXDetectorResult *)detect:(ZXDecodeHints *)hints error:(NSError **)error {
  self.resultPointCallback = hints == nil ? nil : hints.resultPointCallback;

  ZXQRCodeFinderPatternFinder *finder = [[ZXQRCodeFinderPatternFinder alloc] initWithImage:self.image resultPointCallback:self.resultPointCallback];
  ZXQRCodeFinderPatternInfo *info = [finder find:hints error:error];
  if (!info) {
    return nil;
  }

  return [self processFinderPatternInfo:info error:error];
}

- (ZXDetectorResult *)processFinderPatternInfo:(ZXQRCodeFinderPatternInfo *)info error:(NSError **)error {
  ZXQRCodeFinderPattern *topLeft = info.topLeft;
  ZXQRCodeFinderPattern *topRight = info.topRight;
  ZXQRCodeFinderPattern *bottomLeft = info.bottomLeft;

  float moduleSize = [self calculateModuleSize:topLeft topRight:topRight bottomLeft:bottomLeft];
  if (moduleSize < 1.0f) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  int dimension = [ZXQRCodeDetector computeDimension:topLeft topRight:topRight bottomLeft:bottomLeft moduleSize:moduleSize error:error];
  if (dimension == -1) {
    return nil;
  }

  ZXQRCodeVersion *provisionalVersion = [ZXQRCodeVersion provisionalVersionForDimension:dimension];
  if (!provisionalVersion) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }
  int modulesBetweenFPCenters = [provisionalVersion dimensionForVersion] - 7;

  ZXQRCodeAlignmentPattern *alignmentPattern = nil;
  if (provisionalVersion.alignmentPatternCenters.length > 0) {
    float bottomRightX = [topRight x] - [topLeft x] + [bottomLeft x];
    float bottomRightY = [topRight y] - [topLeft y] + [bottomLeft y];

    float correctionToTopLeft = 1.0f - 3.0f / (float)modulesBetweenFPCenters;
    int estAlignmentX = (int)([topLeft x] + correctionToTopLeft * (bottomRightX - [topLeft x]));
    int estAlignmentY = (int)([topLeft y] + correctionToTopLeft * (bottomRightY - [topLeft y]));

    for (int i = 4; i <= 16; i <<= 1) {
      NSError *alignmentError = nil;
      alignmentPattern = [self findAlignmentInRegion:moduleSize estAlignmentX:estAlignmentX estAlignmentY:estAlignmentY allowanceFactor:(float)i error:&alignmentError];
      if (alignmentPattern) {
        break;
      } else if (alignmentError.code != ZXNotFoundError) {
        if (error) *error = alignmentError;
        return nil;
      }
    }
  }

  ZXPerspectiveTransform *transform = [ZXQRCodeDetector createTransform:topLeft topRight:topRight bottomLeft:bottomLeft alignmentPattern:alignmentPattern dimension:dimension];
  ZXBitMatrix *bits = [self sampleGrid:self.image transform:transform dimension:dimension error:error];
  if (!bits) {
    return nil;
  }
  NSArray *points;
  if (alignmentPattern == nil) {
    points = @[bottomLeft, topLeft, topRight];
  } else {
    points = @[bottomLeft, topLeft, topRight, alignmentPattern];
  }
  return [[ZXDetectorResult alloc] initWithBits:bits points:points];
}

+ (ZXPerspectiveTransform *)createTransform:(ZXResultPoint *)topLeft topRight:(ZXResultPoint *)topRight bottomLeft:(ZXResultPoint *)bottomLeft alignmentPattern:(ZXResultPoint *)alignmentPattern dimension:(int)dimension {
  float dimMinusThree = (float)dimension - 3.5f;
  float bottomRightX;
  float bottomRightY;
  float sourceBottomRightX;
  float sourceBottomRightY;
  if (alignmentPattern != nil) {
    bottomRightX = alignmentPattern.x;
    bottomRightY = alignmentPattern.y;
    sourceBottomRightX = dimMinusThree - 3.0f;
    sourceBottomRightY = sourceBottomRightX;
  } else {
    bottomRightX = (topRight.x - topLeft.x) + bottomLeft.x;
    bottomRightY = (topRight.y - topLeft.y) + bottomLeft.y;
    sourceBottomRightX = dimMinusThree;
    sourceBottomRightY = dimMinusThree;
  }

  return [ZXPerspectiveTransform quadrilateralToQuadrilateral:3.5f y0:3.5f
                                                           x1:dimMinusThree y1:3.5f
                                                           x2:sourceBottomRightX y2:sourceBottomRightY
                                                           x3:3.5f y3:dimMinusThree
                                                          x0p:topLeft.x y0p:topLeft.y
                                                          x1p:topRight.x y1p:topRight.y
                                                          x2p:bottomRightX y2p:bottomRightY
                                                          x3p:bottomLeft.x y3p:bottomLeft.y];
}

- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)anImage transform:(ZXPerspectiveTransform *)transform dimension:(int)dimension error:(NSError **)error {
  ZXGridSampler *sampler = [ZXGridSampler instance];
  return [sampler sampleGrid:anImage dimensionX:dimension dimensionY:dimension transform:transform error:error];
}

/**
 * Computes the dimension (number of modules on a size) of the QR Code based on the position
 * of the finder patterns and estimated module size. Returns -1 on an error.
 */
+ (int)computeDimension:(ZXResultPoint *)topLeft topRight:(ZXResultPoint *)topRight bottomLeft:(ZXResultPoint *)bottomLeft moduleSize:(float)moduleSize error:(NSError **)error {
  int tltrCentersDimension = [ZXMathUtils round:[ZXResultPoint distance:topLeft pattern2:topRight] / moduleSize];
  int tlblCentersDimension = [ZXMathUtils round:[ZXResultPoint distance:topLeft pattern2:bottomLeft] / moduleSize];
  int dimension = ((tltrCentersDimension + tlblCentersDimension) / 2) + 7;

  switch (dimension & 0x03) {
  case 0:
    dimension++;
    break;
  case 2:
    dimension--;
    break;
  case 3:
    if (error) *error = ZXNotFoundErrorInstance();
    return -1;
  }
  return dimension;
}

/**
 * Computes an average estimated module size based on estimated derived from the positions
 * of the three finder patterns.
 */
- (float)calculateModuleSize:(ZXResultPoint *)topLeft topRight:(ZXResultPoint *)topRight bottomLeft:(ZXResultPoint *)bottomLeft {
  return ([self calculateModuleSizeOneWay:topLeft otherPattern:topRight] + [self calculateModuleSizeOneWay:topLeft otherPattern:bottomLeft]) / 2.0f;
}

/**
 * Estimates module size based on two finder patterns -- it uses
 * sizeOfBlackWhiteBlackRunBothWays:fromY:toX:toY: to figure the
 * width of each, measuring along the axis between their centers.
 */
- (float)calculateModuleSizeOneWay:(ZXResultPoint *)pattern otherPattern:(ZXResultPoint *)otherPattern {
  float moduleSizeEst1 = [self sizeOfBlackWhiteBlackRunBothWays:(int)[pattern x] fromY:(int)[pattern y] toX:(int)[otherPattern x] toY:(int)[otherPattern y]];
  float moduleSizeEst2 = [self sizeOfBlackWhiteBlackRunBothWays:(int)[otherPattern x] fromY:(int)[otherPattern y] toX:(int)[pattern x] toY:(int)[pattern y]];
  if (isnan(moduleSizeEst1)) {
    return moduleSizeEst2 / 7.0f;
  }
  if (isnan(moduleSizeEst2)) {
    return moduleSizeEst1 / 7.0f;
  }
  return (moduleSizeEst1 + moduleSizeEst2) / 14.0f;
}

/**
 * See sizeOfBlackWhiteBlackRun:fromY:toX:toY: <p>computes the total width of
 * a finder pattern by looking for a black-white-black run from the center in the direction
 * of another point (another finder pattern center), and in the opposite direction too.</p>
 */
- (float)sizeOfBlackWhiteBlackRunBothWays:(int)fromX fromY:(int)fromY toX:(int)toX toY:(int)toY {
  float result = [self sizeOfBlackWhiteBlackRun:fromX fromY:fromY toX:toX toY:toY];

  // Now count other way -- don't run off image though of course
  float scale = 1.0f;
  int otherToX = fromX - (toX - fromX);
  if (otherToX < 0) {
    scale = (float)fromX / (float)(fromX - otherToX);
    otherToX = 0;
  } else if (otherToX >= self.image.width) {
    scale = (float)(self.image.width - 1 - fromX) / (float)(otherToX - fromX);
    otherToX = self.image.width - 1;
  }
  int otherToY = (int)(fromY - (toY - fromY) * scale);

  scale = 1.0f;
  if (otherToY < 0) {
    scale = (float)fromY / (float)(fromY - otherToY);
    otherToY = 0;
  } else if (otherToY >= self.image.height) {
    scale = (float)(self.image.height - 1 - fromY) / (float)(otherToY - fromY);
    otherToY = self.image.height - 1;
  }
  otherToX = (int)(fromX + (otherToX - fromX) * scale);

  result += [self sizeOfBlackWhiteBlackRun:fromX fromY:fromY toX:otherToX toY:otherToY];

  // Middle pixel is double-counted this way; subtract 1
  return result - 1.0f;
}

/**
 * This method traces a line from a point in the image, in the direction towards another point.
 * It begins in a black region, and keeps going until it finds white, then black, then white again.
 * It reports the distance from the start to this point.
 *
 * This is used when figuring out how wide a finder pattern is, when the finder pattern
 * may be skewed or rotated.
 */
- (float)sizeOfBlackWhiteBlackRun:(int)fromX fromY:(int)fromY toX:(int)toX toY:(int)toY {
  // Mild variant of Bresenham's algorithm;
  // see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
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
  int xstep = fromX < toX ? 1 : -1;
  int ystep = fromY < toY ? 1 : -1;

  // In black pixels, looking for white, first or second time.
  int state = 0;
  // Loop up until x == toX, but not beyond
  int xLimit = toX + xstep;
  for (int x = fromX, y = fromY; x != xLimit; x += xstep) {
    int realX = steep ? y : x;
    int realY = steep ? x : y;

    // Does current pixel mean we have moved white to black or vice versa?
    // Scanning black in state 0,2 and white in state 1, so if we find the wrong
    // color, advance to next state or end if we are in state 2 already
    if ((state == 1) == [self.image getX:realX y:realY]) {
      if (state == 2) {
        return [ZXMathUtils distanceInt:x aY:y bX:fromX bY:fromY];
      }
      state++;
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
  // Found black-white-black; give the benefit of the doubt that the next pixel outside the image
  // is "white" so this last point at (toX+xStep,toY) is the right ending. This is really a
  // small approximation; (toX+xStep,toY+yStep) might be really correct. Ignore this.
  if (state == 2) {
    return [ZXMathUtils distanceInt:toX + xstep aY:toY bX:fromX bY:fromY];
  }
  // else we didn't find even black-white-black; no estimate is really possible
  return NAN;
}

- (ZXQRCodeAlignmentPattern *)findAlignmentInRegion:(float)overallEstModuleSize estAlignmentX:(int)estAlignmentX estAlignmentY:(int)estAlignmentY allowanceFactor:(float)allowanceFactor error:(NSError **)error {
  int allowance = (int)(allowanceFactor * overallEstModuleSize);
  int alignmentAreaLeftX = MAX(0, estAlignmentX - allowance);
  int alignmentAreaRightX = MIN(self.image.width - 1, estAlignmentX + allowance);
  if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  int alignmentAreaTopY = MAX(0, estAlignmentY - allowance);
  int alignmentAreaBottomY = MIN(self.image.height - 1, estAlignmentY + allowance);
  if (alignmentAreaBottomY - alignmentAreaTopY < overallEstModuleSize * 3) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  ZXQRCodeAlignmentPatternFinder *alignmentFinder = [[ZXQRCodeAlignmentPatternFinder alloc] initWithImage:self.image
                                                                                       startX:alignmentAreaLeftX
                                                                                       startY:alignmentAreaTopY
                                                                                        width:alignmentAreaRightX - alignmentAreaLeftX
                                                                                       height:alignmentAreaBottomY - alignmentAreaTopY
                                                                                   moduleSize:overallEstModuleSize
                                                                          resultPointCallback:self.resultPointCallback];
  return [alignmentFinder findWithError:error];
}

@end
