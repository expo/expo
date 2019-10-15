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

#import "ZXByteMatrix.h"
#import "ZXQRCode.h"
#import "ZXQRCodeMaskUtil.h"

// Penalty weights from section 6.8.2.1
const int ZX_N1 = 3;
const int ZX_N2 = 3;
const int ZX_N3 = 40;
const int ZX_N4 = 10;

@implementation ZXQRCodeMaskUtil

+ (int)applyMaskPenaltyRule1:(ZXByteMatrix *)matrix {
  return [self applyMaskPenaltyRule1Internal:matrix isHorizontal:YES] + [self applyMaskPenaltyRule1Internal:matrix isHorizontal:NO];
}

+ (int)applyMaskPenaltyRule2:(ZXByteMatrix *)matrix {
  int penalty = 0;
  int8_t **array = matrix.array;
  int width = matrix.width;
  int height = matrix.height;

  for (int y = 0; y < height - 1; y++) {
    for (int x = 0; x < width - 1; x++) {
      int value = array[y][x];
      if (value == array[y][x + 1] && value == array[y + 1][x] && value == array[y + 1][x + 1]) {
        penalty++;
      }
    }
  }

  return ZX_N2 * penalty;
}

+ (int)applyMaskPenaltyRule3:(ZXByteMatrix *)matrix {
  int numPenalties = 0;
  int8_t **array = matrix.array;
  int width = matrix.width;
  int height = matrix.height;
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < width; x++) {
      int8_t *arrayY = array[y];  // We can at least optimize this access
      if (x + 6 < width &&
          arrayY[x] == 1 &&
          arrayY[x +  1] == 0 &&
          arrayY[x +  2] == 1 &&
          arrayY[x +  3] == 1 &&
          arrayY[x +  4] == 1 &&
          arrayY[x +  5] == 0 &&
          arrayY[x +  6] == 1 &&
          ([self isWhiteHorizontal:arrayY length:width from:x - 4 to:x] || [self isWhiteHorizontal:arrayY length:width from:x + 7 to:x + 11])) {
        numPenalties++;
      }
      if (y + 6 < height &&
          array[y][x] == 1  &&
          array[y +  1][x] == 0  &&
          array[y +  2][x] == 1  &&
          array[y +  3][x] == 1  &&
          array[y +  4][x] == 1  &&
          array[y +  5][x] == 0  &&
          array[y +  6][x] == 1 &&
          ([self isWhiteVertical:array length:width col:x from:y - 4 to:y] || [self isWhiteVertical:array length:height col:x from:y + 7 to:y + 11])) {
        numPenalties++;
      }
    }
  }
  return numPenalties * ZX_N3;
}

+ (BOOL)isWhiteHorizontal:(int8_t *)rowArray length:(int)length from:(int)from to:(int)to {
  for (int i = from; i < to; i++) {
    if (i >= 0 && i < length && rowArray[i] == 1) {
      return NO;
    }
  }
  return YES;
}

+ (BOOL)isWhiteVertical:(int8_t **)array length:(int)length col:(int)col from:(int)from to:(int)to {
  for (int i = from; i < to; i++) {
    if (i >= 0 && i < length && array[i][col] == 1) {
      return NO;
    }
  }
  return YES;
}

+ (int)applyMaskPenaltyRule4:(ZXByteMatrix *)matrix {
  int numDarkCells = 0;
  int8_t **array = matrix.array;
  int width = matrix.width;
  int height = matrix.height;
  for (int y = 0; y < height; y++) {
    int8_t *arrayY = array[y];
    for (int x = 0; x < width; x++) {
      if (arrayY[x] == 1) {
        numDarkCells++;
      }
    }
  }
  int numTotalCells = [matrix height] * [matrix width];
  int fivePercentVariances = abs(numDarkCells * 2 - numTotalCells) * 10 / numTotalCells;
  return fivePercentVariances * ZX_N4;
}

+ (BOOL)dataMaskBit:(int)maskPattern x:(int)x y:(int)y {
  int intermediate;
  int temp;
  switch (maskPattern) {
  case 0:
    intermediate = (y + x) & 0x1;
    break;
  case 1:
    intermediate = y & 0x1;
    break;
  case 2:
    intermediate = x % 3;
    break;
  case 3:
    intermediate = (y + x) % 3;
    break;
  case 4:
    intermediate = ((y / 2) + (x / 3)) & 0x1;
    break;
  case 5:
    temp = y * x;
    intermediate = (temp & 0x1) + (temp % 3);
    break;
  case 6:
    temp = y * x;
    intermediate = ((temp & 0x1) + (temp % 3)) & 0x1;
    break;
  case 7:
    temp = y * x;
    intermediate = ((temp % 3) + ((y + x) & 0x1)) & 0x1;
    break;
  default:
      [NSException raise:NSInvalidArgumentException format:@"Invalid mask pattern: %d", maskPattern];
  }
  return intermediate == 0;
}

/**
 * Helper function for applyMaskPenaltyRule1. We need this for doing this calculation in both
 * vertical and horizontal orders respectively.
 */
+ (int)applyMaskPenaltyRule1Internal:(ZXByteMatrix *)matrix isHorizontal:(BOOL)isHorizontal {
  int penalty = 0;
  int iLimit = isHorizontal ? matrix.height : matrix.width;
  int jLimit = isHorizontal ? matrix.width : matrix.height;
  int8_t **array = matrix.array;
  for (int i = 0; i < iLimit; i++) {
    int numSameBitCells = 0;
    int prevBit = -1;
    for (int j = 0; j < jLimit; j++) {
      int bit = isHorizontal ? array[i][j] : array[j][i];
      if (bit == prevBit) {
        numSameBitCells++;
      } else {
        if (numSameBitCells >= 5) {
          penalty += ZX_N1 + (numSameBitCells - 5);
        }
        numSameBitCells = 1;  // Include the cell itself.
        prevBit = bit;
      }
    }
    if (numSameBitCells >= 5) {
      penalty += ZX_N1 + (numSameBitCells - 5);
    }
  }
  return penalty;
}

@end
