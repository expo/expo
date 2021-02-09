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
#import "ZXPerspectiveTransform.h"

@implementation ZXDefaultGridSampler

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
  ZXPerspectiveTransform *transform =
    [ZXPerspectiveTransform quadrilateralToQuadrilateral:p1ToX y0:p1ToY
                                                      x1:p2ToX y1:p2ToY
                                                      x2:p3ToX y2:p3ToY
                                                      x3:p4ToX y3:p4ToY
                                                     x0p:p1FromX y0p:p1FromY
                                                     x1p:p2FromX y1p:p2FromY
                                                     x2p:p3FromX y2p:p3FromY
                                                     x3p:p4FromX y3p:p4FromY];
  return [self sampleGrid:image dimensionX:dimensionX dimensionY:dimensionY transform:transform error:error];
}

- (ZXBitMatrix *)sampleGrid:(ZXBitMatrix *)image
                 dimensionX:(int)dimensionX
                 dimensionY:(int)dimensionY
                  transform:(ZXPerspectiveTransform *)transform
                      error:(NSError **)error {
  if (dimensionX <= 0 || dimensionY <= 0) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  ZXBitMatrix *bits = [[ZXBitMatrix alloc] initWithWidth:dimensionX height:dimensionY];
  int pointsLen = 2 * dimensionX;
  float pointsf[pointsLen];
  memset(pointsf, 0, pointsLen * sizeof(float));

  for (int y = 0; y < dimensionY; y++) {
    int max = dimensionX << 1;
    float iValue = (float)y + 0.5f;
    for (int x = 0; x < max; x += 2) {
      pointsf[x] = (float) (x / 2) + 0.5f;
      pointsf[x + 1] = iValue;
    }
    [transform transformPoints:pointsf pointsLen:pointsLen];

    if (![ZXGridSampler checkAndNudgePoints:image points:pointsf pointsLen:pointsLen error:error]) {
      return nil;
    }
    for (int x = 0; x < max; x += 2) {
      int xx = (int)pointsf[x];
      int yy = (int)pointsf[x + 1];
      if (xx < 0 || yy < 0 || xx >= image.width || yy >= image.height) {
        if (error) *error = ZXNotFoundErrorInstance();
        return nil;
      }

      if ([image getX:xx y:yy]) {
        [bits setX:x / 2 y:y];
      }
    }
  }

  return bits;
}

@end
