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
#import "ZXDefaultGridSampler.h"
#import "ZXErrors.h"
#import "ZXGridSampler.h"
#import "ZXPerspectiveTransform.h"

static ZXGridSampler *gridSampler = nil;

@implementation ZXGridSampler

+ (void)setGridSampler:(ZXGridSampler *)newGridSampler {
  gridSampler = newGridSampler;
}

+ (ZXGridSampler *)instance {
  if (!gridSampler) {
    gridSampler = [[ZXDefaultGridSampler alloc] init];
  }

  return gridSampler;
}

- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)image
                 dimensionX:(int)dimensionX
                 dimensionY:(int)dimensionY
                      p1ToX:(float)p1ToX p1ToY:(float)p1ToY
                      p2ToX:(float)p2ToX p2ToY:(float)p2ToY
                      p3ToX:(float)p3ToX p3ToY:(float)p3ToY
                      p4ToX:(float)p4ToX p4ToY:(float)p4ToY
                    p1FromX:(float)p1FromX p1FromY:(float)p1FromY
                    p2FromX:(float)p2FromX p2FromY:(float)p2FromY
                    p3FromX:(float)p3FromX p3FromY:(float)p3FromY
                    p4FromX:(float)p4FromX p4FromY:(float)p4FromY
                      error:(NSError **)error {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)image
                 dimensionX:(int)dimensionX
                 dimensionY:(int)dimensionY
                  transform:(ZXPerspectiveTransform *)transform
                      error:(NSError **)error {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

+ (BOOL)checkAndNudgePoints:(ZXBitMatrix *)image points:(float *)points pointsLen:(int)pointsLen error:(NSError **)error {
  int width = image.width;
  int height = image.height;
  // Check and nudge points from start until we see some that are OK:
  BOOL nudged = YES;
  for (int offset = 0; offset < pointsLen && nudged; offset += 2) {
    int x = (int) points[offset];
    int y = (int) points[offset + 1];
    if (x < -1 || x > width || y < -1 || y > height) {
      if (error) *error = ZXNotFoundErrorInstance();
      return NO;
    }
    nudged = NO;
    if (x == -1) {
      points[offset] = 0.0f;
      nudged = YES;
    } else if (x == width) {
      points[offset] = width - 1;
      nudged = YES;
    }
    if (y == -1) {
      points[offset + 1] = 0.0f;
      nudged = YES;
    } else if (y == height) {
      points[offset + 1] = height - 1;
      nudged = YES;
    }
  }
  // Check and nudge points from end:
  nudged = YES;
  for (int offset = pointsLen - 2; offset >= 0 && nudged; offset -= 2) {
    int x = (int) points[offset];
    int y = (int) points[offset + 1];
    if (x < -1 || x > width || y < -1 || y > height) {
      if (error) *error = ZXNotFoundErrorInstance();
      return NO;
    }
    nudged = NO;
    if (x == -1) {
      points[offset] = 0.0f;
      nudged = YES;
    } else if (x == width) {
      points[offset] = width - 1;
      nudged = YES;
    }
    if (y == -1) {
      points[offset + 1] = 0.0f;
      nudged = YES;
    } else if (y == height) {
      points[offset + 1] = height - 1;
      nudged = YES;
    }
  }
  return YES;
}

@end
