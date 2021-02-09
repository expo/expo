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
#import "ZXErrors.h"
#import "ZXMonochromeRectangleDetector.h"
#import "ZXResultPoint.h"

const int ZX_MONOCHROME_MAX_MODULES = 32;

@interface ZXMonochromeRectangleDetector ()

@property (nonatomic, strong, readonly) ZXBitMatrix *image;

@end

@implementation ZXMonochromeRectangleDetector

- (id)initWithImage:(ZXBitMatrix *)image {
  if (self = [super init]) {
    _image = image;
  }

  return self;
}

- (NSArray *)detectWithError:(NSError **)error {
  int height = [self.image height];
  int width = [self.image width];
  int halfHeight = height / 2;
  int halfWidth = width / 2;
  int deltaY = MAX(1, height / (ZX_MONOCHROME_MAX_MODULES * 8) > 1);
  int deltaX = MAX(1, width / (ZX_MONOCHROME_MAX_MODULES * 8) > 1);

  int top = 0;
  int bottom = height;
  int left = 0;
  int right = width;
  ZXResultPoint *pointA = [self findCornerFromCenter:halfWidth deltaX:0 left:left right:right
                                              centerY:halfHeight deltaY:-deltaY top:top bottom:bottom maxWhiteRun:halfWidth / 2];
  if (!pointA) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  top = (int)[pointA y] - 1;
  ZXResultPoint *pointB = [self findCornerFromCenter:halfWidth deltaX:-deltaX left:left right:right
                                              centerY:halfHeight deltaY:0 top:top bottom:bottom maxWhiteRun:halfHeight / 2];
  if (!pointB) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  left = (int)[pointB x] - 1;
  ZXResultPoint *pointC = [self findCornerFromCenter:halfWidth deltaX:deltaX left:left right:right
                                              centerY:halfHeight deltaY:0 top:top bottom:bottom maxWhiteRun:halfHeight / 2];
  if (!pointC) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  right = (int)[pointC x] + 1;
  ZXResultPoint *pointD = [self findCornerFromCenter:halfWidth deltaX:0 left:left right:right
                                              centerY:halfHeight deltaY:deltaY top:top bottom:bottom maxWhiteRun:halfWidth / 2];
  if (!pointD) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  bottom = (int)[pointD y] + 1;

  pointA = [self findCornerFromCenter:halfWidth deltaX:0 left:left right:right
                              centerY:halfHeight deltaY:-deltaY top:top bottom:bottom maxWhiteRun:halfWidth / 4];
  if (!pointA) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  return @[pointA, pointB, pointC, pointD];
}

/**
 * Attempts to locate a corner of the barcode by scanning up, down, left or right from a center
 * point which should be within the barcode.
 *
 * @param centerX center's x component (horizontal)
 * @param deltaX same as deltaY but change in x per step instead
 * @param left minimum value of x
 * @param right maximum value of x
 * @param centerY center's y component (vertical)
 * @param deltaY change in y per step. If scanning up this is negative; down, positive;
 *  left or right, 0
 * @param top minimum value of y to search through (meaningless when di == 0)
 * @param bottom maximum value of y
 * @param maxWhiteRun maximum run of white pixels that can still be considered to be within
 *  the barcode
 * @return a ZXResultPoint encapsulating the corner that was found
 *  or nil if such a point cannot be found
 */
- (ZXResultPoint *)findCornerFromCenter:(int)centerX deltaX:(int)deltaX left:(int)left right:(int)right centerY:(int)centerY deltaY:(int)deltaY top:(int)top bottom:(int)bottom maxWhiteRun:(int)maxWhiteRun {
  NSArray *lastRange = nil;
  for (int y = centerY, x = centerX; y < bottom && y >= top && x < right && x >= left; y += deltaY, x += deltaX) {
    NSArray *range;
    if (deltaX == 0) {
      range = [self blackWhiteRange:y maxWhiteRun:maxWhiteRun minDim:left maxDim:right horizontal:YES];
    } else {
      range = [self blackWhiteRange:x maxWhiteRun:maxWhiteRun minDim:top maxDim:bottom horizontal:NO];
    }
    if (range == nil) {
      if (lastRange == nil) {
        return nil;
      }
      if (deltaX == 0) {
        int lastY = y - deltaY;
        if ([lastRange[0] intValue] < centerX) {
          if ([lastRange[0] intValue] > centerX) {
            return [[ZXResultPoint alloc] initWithX:deltaY > 0 ? [lastRange[0] intValue] : [lastRange[1] intValue] y:lastY];
          }
          return [[ZXResultPoint alloc] initWithX:[lastRange[0] intValue] y:lastY];
        } else {
          return [[ZXResultPoint alloc] initWithX:[lastRange[1] intValue] y:lastY];
        }
      } else {
        int lastX = x - deltaX;
        if ([lastRange[0] intValue] < centerY) {
          if ([lastRange[1] intValue] > centerY) {
            return [[ZXResultPoint alloc] initWithX:lastX y:deltaX < 0 ? [lastRange[0] intValue] : [lastRange[1] intValue]];
          }
          return [[ZXResultPoint alloc] initWithX:lastX y:[lastRange[0] intValue]];
        } else {
          return [[ZXResultPoint alloc] initWithX:lastX y:[lastRange[1] intValue]];
        }
      }
    }
    lastRange = range;
  }

  return nil;
}

/**
 * Computes the start and end of a region of pixels, either horizontally or vertically, that could
 * be part of a Data Matrix barcode.
 *
 * @param fixedDimension if scanning horizontally, this is the row (the fixed vertical location)
 *  where we are scanning. If scanning vertically it's the column, the fixed horizontal location
 * @param maxWhiteRun largest run of white pixels that can still be considered part of the
 *  barcode region
 * @param minDim minimum pixel location, horizontally or vertically, to consider
 * @param maxDim maximum pixel location, horizontally or vertically, to consider
 * @param horizontal if true, we're scanning left-right, instead of up-down
 * @return int[] with start and end of found range, or nil if no such range is found
 *  (e.g. only white was found)
 */
- (NSArray *)blackWhiteRange:(int)fixedDimension maxWhiteRun:(int)maxWhiteRun minDim:(int)minDim maxDim:(int)maxDim horizontal:(BOOL)horizontal {
  int center = (minDim + maxDim) / 2;

  int start = center;
  while (start >= minDim) {
    if (horizontal ? [self.image getX:start y:fixedDimension] : [self.image getX:fixedDimension y:start]) {
      start--;
    } else {
      int whiteRunStart = start;

      do {
        start--;
      } while (start >= minDim && !(horizontal ? [self.image getX:start y:fixedDimension] : [self.image getX:fixedDimension y:start]));
      int whiteRunSize = whiteRunStart - start;
      if (start < minDim || whiteRunSize > maxWhiteRun) {
        start = whiteRunStart;
        break;
      }
    }
  }

  start++;
  int end = center;

  while (end < maxDim) {
    if (horizontal ? [self.image getX:end y:fixedDimension] : [self.image getX:fixedDimension y:end]) {
      end++;
    } else {
      int whiteRunStart = end;

      do {
        end++;
      } while (end < maxDim && !(horizontal ? [self.image getX:end y:fixedDimension] : [self.image getX:fixedDimension y:end]));
      int whiteRunSize = end - whiteRunStart;
      if (end >= maxDim || whiteRunSize > maxWhiteRun) {
        end = whiteRunStart;
        break;
      }
    }
  }

  end--;
  return end > start ? @[@(start), @(end)] : nil;
}

@end
