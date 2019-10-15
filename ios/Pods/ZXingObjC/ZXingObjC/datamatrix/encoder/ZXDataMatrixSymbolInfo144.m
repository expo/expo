/*
 * Copyright 2013 ZXing authors
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

#import "ZXDataMatrixSymbolInfo144.h"

@implementation ZXDataMatrixSymbolInfo144

- (id)init {
  return [super initWithRectangular:NO dataCapacity:1558 errorCodewords:620 matrixWidth:22 matrixHeight:22 dataRegions:36 rsBlockData:-1 rsBlockError:62];
}

- (int)interleavedBlockCount {
  return 10;
}

- (int)dataLengthForInterleavedBlock:(int)index {
  return (index <= 8) ? 156 : 155;
}

@end
