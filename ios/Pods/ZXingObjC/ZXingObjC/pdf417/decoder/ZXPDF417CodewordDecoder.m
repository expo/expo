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

#import "ZXPDF417CodewordDecoder.h"
#import "ZXPDF417Common.h"

static float ZX_PDF417_RATIOS_TABLE[ZX_PDF417_SYMBOL_TABLE_LEN][ZX_PDF417_BARS_IN_MODULE];

@implementation ZXPDF417CodewordDecoder

+ (void)initialize {
  if ([self class] != [ZXPDF417CodewordDecoder class]) return;

  // Pre-computes the symbol ratio table.
  for (int i = 0; i < ZX_PDF417_SYMBOL_TABLE_LEN; i++) {
    int currentSymbol = ZX_PDF417_SYMBOL_TABLE[i];
    int currentBit = currentSymbol & 0x1;
    for (int j = 0; j < ZX_PDF417_BARS_IN_MODULE; j++) {
      float size = 0.0f;
      while ((currentSymbol & 0x1) == currentBit) {
        size += 1.0f;
        currentSymbol >>= 1;
      }
      currentBit = currentSymbol & 0x1;
      ZX_PDF417_RATIOS_TABLE[i][ZX_PDF417_BARS_IN_MODULE - j - 1] = size / ZX_PDF417_MODULES_IN_CODEWORD;
    }
  }
}

+ (int)decodedValue:(NSArray *)moduleBitCount {
  int decodedValue = [self decodedCodewordValue:[self sampleBitCounts:moduleBitCount]];
  if (decodedValue != -1) {
    return decodedValue;
  }
  return [self closestDecodedValue:moduleBitCount];
}

+ (NSArray *)sampleBitCounts:(NSArray *)moduleBitCount {
  float bitCountSum = [ZXPDF417Common bitCountSum:moduleBitCount];
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:ZX_PDF417_BARS_IN_MODULE];
  for (int i = 0; i < ZX_PDF417_BARS_IN_MODULE; i++) {
    [result addObject:@0];
  }

  int bitCountIndex = 0;
  int sumPreviousBits = 0;
  for (int i = 0; i < ZX_PDF417_MODULES_IN_CODEWORD; i++) {
    float sampleIndex =
      bitCountSum / (2 * ZX_PDF417_MODULES_IN_CODEWORD) +
      (i * bitCountSum) / ZX_PDF417_MODULES_IN_CODEWORD;
    if (sumPreviousBits + [moduleBitCount[bitCountIndex] intValue] <= sampleIndex) {
      sumPreviousBits += [moduleBitCount[bitCountIndex] intValue];
      bitCountIndex++;
    }
    result[bitCountIndex] = @([result[bitCountIndex] intValue] + 1);
  }
  return result;
}

+ (int)decodedCodewordValue:(NSArray *)moduleBitCount {
  int decodedValue = [self bitValue:moduleBitCount];
  return [ZXPDF417Common codeword:decodedValue] == -1 ? -1 : decodedValue;
}

+ (int)bitValue:(NSArray *)moduleBitCount {
  long result = 0;
  for (int i = 0; i < [moduleBitCount count]; i++) {
    for (int bit = 0; bit < [moduleBitCount[i] intValue]; bit++) {
      result = (result << 1) | (i % 2 == 0 ? 1 : 0);
    }
  }
  return (int) result;
}

+ (int)closestDecodedValue:(NSArray *)moduleBitCount {
  int bitCountSum = [ZXPDF417Common bitCountSum:moduleBitCount];
  float bitCountRatios[ZX_PDF417_BARS_IN_MODULE];
  if (bitCountSum > 1) {
    for (int i = 0; i < ZX_PDF417_BARS_IN_MODULE; i++) {
      bitCountRatios[i] = [moduleBitCount[i] intValue] / (float) bitCountSum;
    }
  }
  float bestMatchError = MAXFLOAT;
  int bestMatch = -1;
  for (int j = 0; j < ZX_PDF417_SYMBOL_TABLE_LEN; j++) {
    float error = 0.0f;
    float *ratioTableRow = ZX_PDF417_RATIOS_TABLE[j];
    for (int k = 0; k < ZX_PDF417_BARS_IN_MODULE; k++) {
      float diff = ratioTableRow[k] - bitCountRatios[k];
      error += diff * diff;
      if (error >= bestMatchError) {
        break;
      }
    }
    if (error < bestMatchError) {
      bestMatchError = error;
      bestMatch = ZX_PDF417_SYMBOL_TABLE[j];
    }
  }
  return bestMatch;
}

@end
