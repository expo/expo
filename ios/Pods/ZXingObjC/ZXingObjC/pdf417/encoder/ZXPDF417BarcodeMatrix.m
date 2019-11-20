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

#import "ZXPDF417BarcodeMatrix.h"
#import "ZXPDF417BarcodeRow.h"

@interface ZXPDF417BarcodeMatrix ()

@property (nonatomic, assign) int currentRowIndex;
@property (nonatomic, strong, readonly) NSArray *rowMatrix;

@end

@implementation ZXPDF417BarcodeMatrix

- (id)initWithHeight:(int)height width:(int)width {
  if (self = [super init]) {
    NSMutableArray *matrix = [NSMutableArray array];
    for (int i = 0, matrixLength = height; i < matrixLength; i++) {
      [matrix addObject:[ZXPDF417BarcodeRow barcodeRowWithWidth:(width + 4) * 17 + 1]];
    }
    _rowMatrix = matrix;
    _width = width * 17;
    _height = height;
    _currentRowIndex = -1;
  }

  return self;
}

- (void)setX:(int)x y:(int)y value:(int8_t)value {
  [self.rowMatrix[y] setX:x value:value];
}

/*
- (void)setMatrixX:(int)x y:(int)y black:(BOOL)black {
  [self setX:x y:y value:(int8_t)(black ? 1 : 0)];
}
*/

- (void)startRow {
  ++self.currentRowIndex;
}

- (ZXPDF417BarcodeRow *)currentRow {
  return self.rowMatrix[self.currentRowIndex];
}

- (NSArray *)matrix {
  return [self scaledMatrixWithXScale:1 yScale:1];
}

/*
- (NSArray *)scaledMatrix:(int)scale {
  return [self scaledMatrixWithXScale:scale yScale:scale];
}
*/

- (NSArray *)scaledMatrixWithXScale:(int)xScale yScale:(int)yScale {
  int yMax = self.height * yScale;
  NSMutableArray *matrixOut = [NSMutableArray array];
  for (int i = 0; i < yMax; i++) {
    [matrixOut addObject:[NSNull null]];
  }

  for (int i = 0; i < yMax; i++) {
    matrixOut[yMax - i - 1] = [(ZXPDF417BarcodeRow *)self.rowMatrix[i / yScale] scaledRow:xScale];
  }

  return matrixOut;
}

@end
