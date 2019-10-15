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

#import "ZXQRCodeFinderPattern.h"

@implementation ZXQRCodeFinderPattern

- (id)initWithPosX:(float)posX posY:(float)posY estimatedModuleSize:(float)estimatedModuleSize {
  return [self initWithPosX:posX posY:posY estimatedModuleSize:estimatedModuleSize count:1];
}

- (id)initWithPosX:(float)posX posY:(float)posY estimatedModuleSize:(float)estimatedModuleSize count:(int)count {
  if (self = [super initWithX:posX y:posY]) {
    _estimatedModuleSize = estimatedModuleSize;
    _count = count;
  }

  return self;
}

/*
- (void)incrementCount {
  self.count++;
}
*/

- (BOOL)aboutEquals:(float)moduleSize i:(float)i j:(float)j {
  if (fabsf(i - [self y]) <= moduleSize && fabsf(j - [self x]) <= moduleSize) {
    float moduleSizeDiff = fabsf(moduleSize - self.estimatedModuleSize);
    return moduleSizeDiff <= 1.0f || moduleSizeDiff <= self.estimatedModuleSize;
  }
  return NO;
}

- (ZXQRCodeFinderPattern *)combineEstimateI:(float)i j:(float)j newModuleSize:(float)newModuleSize {
  int combinedCount = self.count + 1;
  float combinedX = (self.count * self.x + j) / combinedCount;
  float combinedY = (self.count * self.y + i) / combinedCount;
  float combinedModuleSize = (self.count * self.estimatedModuleSize + newModuleSize) / combinedCount;
  return [[ZXQRCodeFinderPattern alloc] initWithPosX:combinedX
                                                 posY:combinedY
                                  estimatedModuleSize:combinedModuleSize
                                                count:combinedCount];
}

@end
