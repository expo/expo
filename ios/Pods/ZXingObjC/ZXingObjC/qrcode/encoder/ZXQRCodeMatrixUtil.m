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

#import "ZXBitArray.h"
#import "ZXByteMatrix.h"
#import "ZXErrors.h"
#import "ZXQRCode.h"
#import "ZXQRCodeErrorCorrectionLevel.h"
#import "ZXQRCodeMaskUtil.h"
#import "ZXQRCodeMatrixUtil.h"
#import "ZXQRCodeVersion.h"

const int ZX_POSITION_DETECTION_PATTERN[][7] = {
  {1, 1, 1, 1, 1, 1, 1},
  {1, 0, 0, 0, 0, 0, 1},
  {1, 0, 1, 1, 1, 0, 1},
  {1, 0, 1, 1, 1, 0, 1},
  {1, 0, 1, 1, 1, 0, 1},
  {1, 0, 0, 0, 0, 0, 1},
  {1, 1, 1, 1, 1, 1, 1},
};

const int ZX_POSITION_ADJUSTMENT_PATTERN[][5] = {
  {1, 1, 1, 1, 1},
  {1, 0, 0, 0, 1},
  {1, 0, 1, 0, 1},
  {1, 0, 0, 0, 1},
  {1, 1, 1, 1, 1},
};

// From Appendix E. Table 1, JIS0510X:2004 (p 71). The table was double-checked by komatsu.
const int ZX_POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE[][7] = {
  {-1, -1, -1, -1,  -1,  -1,  -1},  // Version 1
  { 6, 18, -1, -1,  -1,  -1,  -1},  // Version 2
  { 6, 22, -1, -1,  -1,  -1,  -1},  // Version 3
  { 6, 26, -1, -1,  -1,  -1,  -1},  // Version 4
  { 6, 30, -1, -1,  -1,  -1,  -1},  // Version 5
  { 6, 34, -1, -1,  -1,  -1,  -1},  // Version 6
  { 6, 22, 38, -1,  -1,  -1,  -1},  // Version 7
  { 6, 24, 42, -1,  -1,  -1,  -1},  // Version 8
  { 6, 26, 46, -1,  -1,  -1,  -1},  // Version 9
  { 6, 28, 50, -1,  -1,  -1,  -1},  // Version 10
  { 6, 30, 54, -1,  -1,  -1,  -1},  // Version 11
  { 6, 32, 58, -1,  -1,  -1,  -1},  // Version 12
  { 6, 34, 62, -1,  -1,  -1,  -1},  // Version 13
  { 6, 26, 46, 66,  -1,  -1,  -1},  // Version 14
  { 6, 26, 48, 70,  -1,  -1,  -1},  // Version 15
  { 6, 26, 50, 74,  -1,  -1,  -1},  // Version 16
  { 6, 30, 54, 78,  -1,  -1,  -1},  // Version 17
  { 6, 30, 56, 82,  -1,  -1,  -1},  // Version 18
  { 6, 30, 58, 86,  -1,  -1,  -1},  // Version 19
  { 6, 34, 62, 90,  -1,  -1,  -1},  // Version 20
  { 6, 28, 50, 72,  94,  -1,  -1},  // Version 21
  { 6, 26, 50, 74,  98,  -1,  -1},  // Version 22
  { 6, 30, 54, 78, 102,  -1,  -1},  // Version 23
  { 6, 28, 54, 80, 106,  -1,  -1},  // Version 24
  { 6, 32, 58, 84, 110,  -1,  -1},  // Version 25
  { 6, 30, 58, 86, 114,  -1,  -1},  // Version 26
  { 6, 34, 62, 90, 118,  -1,  -1},  // Version 27
  { 6, 26, 50, 74,  98, 122,  -1},  // Version 28
  { 6, 30, 54, 78, 102, 126,  -1},  // Version 29
  { 6, 26, 52, 78, 104, 130,  -1},  // Version 30
  { 6, 30, 56, 82, 108, 134,  -1},  // Version 31
  { 6, 34, 60, 86, 112, 138,  -1},  // Version 32
  { 6, 30, 58, 86, 114, 142,  -1},  // Version 33
  { 6, 34, 62, 90, 118, 146,  -1},  // Version 34
  { 6, 30, 54, 78, 102, 126, 150},  // Version 35
  { 6, 24, 50, 76, 102, 128, 154},  // Version 36
  { 6, 28, 54, 80, 106, 132, 158},  // Version 37
  { 6, 32, 58, 84, 110, 136, 162},  // Version 38
  { 6, 26, 54, 82, 110, 138, 166},  // Version 39
  { 6, 30, 58, 86, 114, 142, 170},  // Version 40
};

// Type info cells at the left top corner.
const int ZX_TYPE_INFO_COORDINATES[][2] = {
  {8, 0},
  {8, 1},
  {8, 2},
  {8, 3},
  {8, 4},
  {8, 5},
  {8, 7},
  {8, 8},
  {7, 8},
  {5, 8},
  {4, 8},
  {3, 8},
  {2, 8},
  {1, 8},
  {0, 8},
};

// From Appendix D in JISX0510:2004 (p. 67)
const int ZX_VERSION_INFO_POLY = 0x1f25;  // 1 1111 0010 0101

// From Appendix C in JISX0510:2004 (p.65).
const int ZX_TYPE_INFO_POLY = 0x537;
const int ZX_TYPE_INFO_MASK_PATTERN = 0x5412;

@implementation ZXQRCodeMatrixUtil

+ (void)clearMatrix:(ZXByteMatrix *)matrix {
  [matrix clear:-1];
}

+ (BOOL)buildMatrix:(ZXBitArray *)dataBits ecLevel:(ZXQRCodeErrorCorrectionLevel *)ecLevel version:(ZXQRCodeVersion *)version maskPattern:(int)maskPattern matrix:(ZXByteMatrix *)matrix error:(NSError **)error {
  [self clearMatrix:matrix];
  if (![self embedBasicPatterns:version matrix:matrix error:error]) {
    return NO;
  }
  // Type information appear with any version.
  if (![self embedTypeInfo:ecLevel maskPattern:maskPattern matrix:matrix error:error]) {
    return NO;
  }
  // Version info appear if version >= 7.
  if (![self maybeEmbedVersionInfo:version matrix:matrix error:error]) {
    return NO;
  }
  // Data should be embedded at end.
  if (![self embedDataBits:dataBits maskPattern:maskPattern matrix:matrix error:error]) {
    return NO;
  }
  return YES;
}

+ (BOOL)embedBasicPatterns:(ZXQRCodeVersion *)version matrix:(ZXByteMatrix *)matrix error:(NSError **)error {
  // Let's get started with embedding big squares at corners.
  if (![self embedPositionDetectionPatternsAndSeparators:matrix]) {
    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXNotFoundError userInfo:nil];
    return NO;
  }
  // Then, embed the dark dot at the left bottom corner.
  if (![self embedDarkDotAtLeftBottomCorner:matrix]) {
    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXNotFoundError userInfo:nil];
    return NO;
  }

  // Position adjustment patterns appear if version >= 2.
  [self maybeEmbedPositionAdjustmentPatterns:version matrix:matrix];
  // Timing patterns should be embedded after position adj. patterns.
  [self embedTimingPatterns:matrix];

  return YES;
}

+ (BOOL)embedTypeInfo:(ZXQRCodeErrorCorrectionLevel *)ecLevel maskPattern:(int)maskPattern matrix:(ZXByteMatrix *)matrix error:(NSError **)error {
  ZXBitArray *typeInfoBits = [[ZXBitArray alloc] init];
  if (![self makeTypeInfoBits:ecLevel maskPattern:maskPattern bits:typeInfoBits error:error]) {
    return NO;
  }

  for (int i = 0; i < [typeInfoBits size]; ++i) {
    // Place bits in LSB to MSB order.  LSB (least significant bit) is the last value in
    // "typeInfoBits".
    BOOL bit = [typeInfoBits get:[typeInfoBits size] - 1 - i];

    // Type info bits at the left top corner. See 8.9 of JISX0510:2004 (p.46).
    int x1 = ZX_TYPE_INFO_COORDINATES[i][0];
    int y1 = ZX_TYPE_INFO_COORDINATES[i][1];
    [matrix setX:x1 y:y1 boolValue:bit];

    if (i < 8) {
      // Right top corner.
      int x2 = [matrix width] - i - 1;
      int y2 = 8;
      [matrix setX:x2 y:y2 boolValue:bit];
    } else {
      // Left bottom corner.
      int x2 = 8;
      int y2 = [matrix height] - 7 + (i - 8);
      [matrix setX:x2 y:y2 boolValue:bit];
    }
  }

  return YES;
}

+ (BOOL)maybeEmbedVersionInfo:(ZXQRCodeVersion *)version matrix:(ZXByteMatrix *)matrix error:(NSError **)error {
  if (version.versionNumber < 7) { // Version info is necessary if version >= 7.
    return YES; // Don't need version info.
  }
  ZXBitArray *versionInfoBits = [[ZXBitArray alloc] init];
  if (![self makeVersionInfoBits:version bits:versionInfoBits error:error]) {
    return NO;
  }

  int bitIndex = 6 * 3 - 1; // It will decrease from 17 to 0.
  for (int i = 0; i < 6; ++i) {
    for (int j = 0; j < 3; ++j) {
      // Place bits in LSB (least significant bit) to MSB order.
      BOOL bit = [versionInfoBits get:bitIndex];
      bitIndex--;
      // Left bottom corner.
      [matrix setX:i y:[matrix height] - 11 + j boolValue:bit];
      // Right bottom corner.
      [matrix setX:[matrix height] - 11 + j y:i boolValue:bit];
    }
  }

  return YES;
}

+ (BOOL)embedDataBits:(ZXBitArray *)dataBits maskPattern:(int)maskPattern matrix:(ZXByteMatrix *)matrix error:(NSError **)error {
  int bitIndex = 0;
  int direction = -1;
  // Start from the right bottom cell.
  int x = [matrix width] - 1;
  int y = [matrix height] - 1;
  while (x > 0) {
    // Skip the vertical timing pattern.
    if (x == 6) {
      x -= 1;
    }
    while (y >= 0 && y < [matrix height]) {
      for (int i = 0; i < 2; ++i) {
        int xx = x - i;
        // Skip the cell if it's not empty.
        if (![self isEmpty:[matrix getX:xx y:y]]) {
          continue;
        }
        BOOL bit;
        if (bitIndex < [dataBits size]) {
          bit = [dataBits get:bitIndex];
          ++bitIndex;
        } else {
          // Padding bit. If there is no bit left, we'll fill the left cells with 0, as described
          // in 8.4.9 of JISX0510:2004 (p. 24).
          bit = NO;
        }

        // Skip masking if mask_pattern is -1.
        if (maskPattern != -1 && [ZXQRCodeMaskUtil dataMaskBit:maskPattern x:xx y:y]) {
          bit = !bit;
        }
        [matrix setX:xx y:y boolValue:bit];
      }
      y += direction;
    }
    direction = -direction; // Reverse the direction.
    y += direction;
    x -= 2; // Move to the left.
  }
  // All bits should be consumed.
  if (bitIndex != [dataBits size]) {
    NSDictionary *userInfo = @{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Not all bits consumed: %d/%d", bitIndex, [dataBits size]]};

    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXNotFoundError userInfo:userInfo];
    return NO;
  }

  return YES;
}

+ (int)findMSBSet:(int)value {
  int numDigits = 0;
  while (value != 0) {
    value = (int)((unsigned int)value >> 1);
    ++numDigits;
  }
  return numDigits;
}

+ (int)calculateBCHCode:(int)value poly:(int)poly {
  // If poly is "1 1111 0010 0101" (version info poly), msbSetInPoly is 13. We'll subtract 1
  // from 13 to make it 12.
  int msbSetInPoly = [self findMSBSet:poly];
  value <<= msbSetInPoly - 1;
  // Do the division business using exclusive-or operations.
  while ([self findMSBSet:value] >= msbSetInPoly) {
    value ^= poly << ([self findMSBSet:value] - msbSetInPoly);
  }
  // Now the "value" is the remainder (i.e. the BCH code)
  return value;
}

+ (BOOL)makeTypeInfoBits:(ZXQRCodeErrorCorrectionLevel *)ecLevel maskPattern:(int)maskPattern bits:(ZXBitArray *)bits error:(NSError **)error {
  if (![ZXQRCode isValidMaskPattern:maskPattern]) {
    NSDictionary *userInfo = @{NSLocalizedDescriptionKey: @"Invalid mask pattern"};

    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXNotFoundError userInfo:userInfo];
    return NO;
  }
  int typeInfo = ([ecLevel bits] << 3) | maskPattern;
  [bits appendBits:typeInfo numBits:5];

  int bchCode = [self calculateBCHCode:typeInfo poly:ZX_TYPE_INFO_POLY];
  [bits appendBits:bchCode numBits:10];

  ZXBitArray *maskBits = [[ZXBitArray alloc] init];
  [maskBits appendBits:ZX_TYPE_INFO_MASK_PATTERN numBits:15];
  [bits xor:maskBits];

  if ([bits size] != 15) { // Just in case.
    NSDictionary *userInfo = @{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"should not happen but we got: %d", [bits size]]};

    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXNotFoundError userInfo:userInfo];
    return NO;
  }

  return YES;
}

+ (BOOL)makeVersionInfoBits:(ZXQRCodeVersion *)version bits:(ZXBitArray *)bits error:(NSError **)error {
  [bits appendBits:version.versionNumber numBits:6];
  int bchCode = [self calculateBCHCode:version.versionNumber poly:ZX_VERSION_INFO_POLY];
  [bits appendBits:bchCode numBits:12];

  if ([bits size] != 18) { // Just in case.
    NSDictionary *userInfo = @{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"should not happen but we got: %d", [bits size]]};

    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXNotFoundError userInfo:userInfo];
    return NO;
  }

  return YES;
}

// Check if "value" is empty.
+ (BOOL)isEmpty:(int)value {
  return value == -1;
}

+ (void)embedTimingPatterns:(ZXByteMatrix *)matrix {
  // -8 is for skipping position detection patterns (size 7), and two horizontal/vertical
  // separation patterns (size 1). Thus, 8 = 7 + 1.
  for (int i = 8; i < [matrix width] - 8; ++i) {
    int bit = (i + 1) % 2;
    // Horizontal line.
    if ([self isEmpty:[matrix getX:i y:6]]) {
      [matrix setX:i y:6 boolValue:bit];
    }
    // Vertical line.
    if ([self isEmpty:[matrix getX:6 y:i]]) {
      [matrix setX:6 y:i boolValue:bit];
    }
  }
}

// Embed the lonely dark dot at left bottom corner. JISX0510:2004 (p.46)
+ (BOOL)embedDarkDotAtLeftBottomCorner:(ZXByteMatrix *)matrix {
  if ([matrix getX:8 y:matrix.height - 8] == 0) {
    return NO;
  }
  [matrix setX:8 y:matrix.height - 8 intValue:1];

  return YES;
}

+ (BOOL)embedHorizontalSeparationPattern:(int)xStart yStart:(int)yStart matrix:(ZXByteMatrix *)matrix {
  for (int x = 0; x < 8; ++x) {
    if (![self isEmpty:[matrix getX:xStart + x y:yStart]]) {
      return NO;
    }
    [matrix setX:xStart + x y:yStart intValue:0];
  }

  return YES;
}

+ (BOOL)embedVerticalSeparationPattern:(int)xStart yStart:(int)yStart matrix:(ZXByteMatrix *)matrix {
  for (int y = 0; y < 7; ++y) {
    if (![self isEmpty:[matrix getX:xStart y:yStart + y]]) {
      return NO;
    }
    [matrix setX:xStart y:yStart + y intValue:0];
  }

  return YES;
}

// Note that we cannot unify the function with embedPositionDetectionPattern() despite they are
// almost identical, since we cannot write a function that takes 2D arrays in different sizes in
// C/C++. We should live with the fact.
+ (void)embedPositionAdjustmentPattern:(int)xStart yStart:(int)yStart matrix:(ZXByteMatrix *)matrix {
  for (int y = 0; y < 5; ++y) {
    for (int x = 0; x < 5; ++x) {
      [matrix setX:xStart + x y:yStart + y intValue:ZX_POSITION_ADJUSTMENT_PATTERN[y][x]];
    }
  }
}

+ (void)embedPositionDetectionPattern:(int)xStart yStart:(int)yStart matrix:(ZXByteMatrix *)matrix {
  for (int y = 0; y < 7; ++y) {
    for (int x = 0; x < 7; ++x) {
      [matrix setX:xStart + x y:yStart + y intValue:ZX_POSITION_DETECTION_PATTERN[y][x]];
    }
  }
}

// Embed position detection patterns and surrounding vertical/horizontal separators.
+ (BOOL)embedPositionDetectionPatternsAndSeparators:(ZXByteMatrix *)matrix {
  // Embed three big squares at corners.
  int pdpWidth = sizeof(ZX_POSITION_DETECTION_PATTERN[0]) / sizeof(int);
  // Left top corner.
  [self embedPositionDetectionPattern:0 yStart:0 matrix:matrix];
  // Right top corner.
  [self embedPositionDetectionPattern:[matrix width] - pdpWidth yStart:0 matrix:matrix];
  // Left bottom corner.
  [self embedPositionDetectionPattern:0 yStart:[matrix width] - pdpWidth matrix:matrix];

  // Embed horizontal separation patterns around the squares.
  int hspWidth = 8;
  // Left top corner.
  [self embedHorizontalSeparationPattern:0 yStart:hspWidth - 1 matrix:matrix];
  // Right top corner.
  [self embedHorizontalSeparationPattern:[matrix width] - hspWidth yStart:hspWidth - 1 matrix:matrix];
  // Left bottom corner.
  [self embedHorizontalSeparationPattern:0 yStart:[matrix width] - hspWidth matrix:matrix];

  // Embed vertical separation patterns around the squares.
  int vspSize = 7;
  // Left top corner.
  if (![self embedVerticalSeparationPattern:vspSize yStart:0 matrix:matrix]) {
    return NO;
  }
  // Right top corner.
  if (![self embedVerticalSeparationPattern:[matrix height] - vspSize - 1 yStart:0 matrix:matrix]) {
    return NO;
  }
  // Left bottom corner.
  if (![self embedVerticalSeparationPattern:vspSize yStart:[matrix height] - vspSize matrix:matrix]) {
    return NO;
  }

  return YES;
}

// Embed position adjustment patterns if need be.
+ (void)maybeEmbedPositionAdjustmentPatterns:(ZXQRCodeVersion *)version matrix:(ZXByteMatrix *)matrix {
  if (version.versionNumber < 2) { // The patterns appear if version >= 2
    return;
  }
  int index = version.versionNumber - 1;
  int numCoordinates = sizeof(ZX_POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE[index]) / sizeof(int);
  for (int i = 0; i < numCoordinates; ++i) {
    for (int j = 0; j < numCoordinates; ++j) {
      int y = ZX_POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE[index][i];
      int x = ZX_POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE[index][j];
      if (x == -1 || y == -1) {
        continue;
      }
      // If the cell is unset, we embed the position adjustment pattern here.
      if ([self isEmpty:[matrix getX:x y:y]]) {
        // -2 is necessary since the x/y coordinates point to the center of the pattern, not the
        // left top corner.
        [self embedPositionAdjustmentPattern:x - 2 yStart:y - 2 matrix:matrix];
      }
    }
  }
}

@end
