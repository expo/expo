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

#import "ZXQRCodeErrorCorrectionLevel.h"
#import "ZXQRCodeFormatInformation.h"

const int ZX_FORMAT_INFO_MASK_QR = 0x5412;

/**
 * See ISO 18004:2006, Annex C, Table C.1
 */
const int ZX_FORMAT_INFO_DECODE_LOOKUP_LEN = 32;
const int ZX_FORMAT_INFO_DECODE_LOOKUP[ZX_FORMAT_INFO_DECODE_LOOKUP_LEN][2] = {
  {0x5412, 0x00},
  {0x5125, 0x01},
  {0x5E7C, 0x02},
  {0x5B4B, 0x03},
  {0x45F9, 0x04},
  {0x40CE, 0x05},
  {0x4F97, 0x06},
  {0x4AA0, 0x07},
  {0x77C4, 0x08},
  {0x72F3, 0x09},
  {0x7DAA, 0x0A},
  {0x789D, 0x0B},
  {0x662F, 0x0C},
  {0x6318, 0x0D},
  {0x6C41, 0x0E},
  {0x6976, 0x0F},
  {0x1689, 0x10},
  {0x13BE, 0x11},
  {0x1CE7, 0x12},
  {0x19D0, 0x13},
  {0x0762, 0x14},
  {0x0255, 0x15},
  {0x0D0C, 0x16},
  {0x083B, 0x17},
  {0x355F, 0x18},
  {0x3068, 0x19},
  {0x3F31, 0x1A},
  {0x3A06, 0x1B},
  {0x24B4, 0x1C},
  {0x2183, 0x1D},
  {0x2EDA, 0x1E},
  {0x2BED, 0x1F},
};

/**
 * Offset i holds the number of 1 bits in the binary representation of i
 */
const int ZX_BITS_SET_IN_HALF_BYTE[] = {0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4};

@implementation ZXQRCodeFormatInformation

- (id)initWithFormatInfo:(int)formatInfo {
  if (self = [super init]) {
    _errorCorrectionLevel = [ZXQRCodeErrorCorrectionLevel forBits:(formatInfo >> 3) & 0x03];
    _dataMask = (int8_t)(formatInfo & 0x07);
  }

  return self;
}

+ (int)numBitsDiffering:(int)a b:(int)b {
  a ^= b;
  return ZX_BITS_SET_IN_HALF_BYTE[a & 0x0F] +
      ZX_BITS_SET_IN_HALF_BYTE[((int)((unsigned int)a) >> 4 & 0x0F)] +
      ZX_BITS_SET_IN_HALF_BYTE[((int)((unsigned int)a) >> 8 & 0x0F)] +
      ZX_BITS_SET_IN_HALF_BYTE[((int)((unsigned int)a) >> 12 & 0x0F)] +
      ZX_BITS_SET_IN_HALF_BYTE[((int)((unsigned int)a) >> 16 & 0x0F)] +
      ZX_BITS_SET_IN_HALF_BYTE[((int)((unsigned int)a) >> 20 & 0x0F)] +
      ZX_BITS_SET_IN_HALF_BYTE[((int)((unsigned int)a) >> 24 & 0x0F)] +
      ZX_BITS_SET_IN_HALF_BYTE[((int)((unsigned int)a) >> 28 & 0x0F)];
}

+ (ZXQRCodeFormatInformation *)decodeFormatInformation:(int)maskedFormatInfo1 maskedFormatInfo2:(int)maskedFormatInfo2 {
  ZXQRCodeFormatInformation *formatInfo = [self doDecodeFormatInformation:maskedFormatInfo1 maskedFormatInfo2:maskedFormatInfo2];
  if (formatInfo != nil) {
    return formatInfo;
  }
  return [self doDecodeFormatInformation:maskedFormatInfo1 ^ ZX_FORMAT_INFO_MASK_QR maskedFormatInfo2:maskedFormatInfo2 ^ ZX_FORMAT_INFO_MASK_QR];
}

+ (ZXQRCodeFormatInformation *)doDecodeFormatInformation:(int)maskedFormatInfo1 maskedFormatInfo2:(int)maskedFormatInfo2 {
  int bestDifference = INT_MAX;
  int bestFormatInfo = 0;

  for (int i = 0; i < ZX_FORMAT_INFO_DECODE_LOOKUP_LEN; i++) {
    int targetInfo = ZX_FORMAT_INFO_DECODE_LOOKUP[i][0];
    if (targetInfo == maskedFormatInfo1 || targetInfo == maskedFormatInfo2) {
      return [[ZXQRCodeFormatInformation alloc] initWithFormatInfo:ZX_FORMAT_INFO_DECODE_LOOKUP[i][1]];
    }
    int bitsDifference = [self numBitsDiffering:maskedFormatInfo1 b:targetInfo];
    if (bitsDifference < bestDifference) {
      bestFormatInfo = ZX_FORMAT_INFO_DECODE_LOOKUP[i][1];
      bestDifference = bitsDifference;
    }
    if (maskedFormatInfo1 != maskedFormatInfo2) {
      bitsDifference = [self numBitsDiffering:maskedFormatInfo2 b:targetInfo];
      if (bitsDifference < bestDifference) {
        bestFormatInfo = ZX_FORMAT_INFO_DECODE_LOOKUP[i][1];
        bestDifference = bitsDifference;
      }
    }
  }

  if (bestDifference <= 3) {
    return [[ZXQRCodeFormatInformation alloc] initWithFormatInfo:bestFormatInfo];
  }
  return nil;
}

- (NSUInteger)hash {
  return (self.errorCorrectionLevel.ordinal << 3) | (int)self.dataMask;
}

- (BOOL)isEqual:(id)o {
  if (![o isKindOfClass:[ZXQRCodeFormatInformation class]]) {
    return NO;
  }
  ZXQRCodeFormatInformation *other = (ZXQRCodeFormatInformation *)o;
  return self.errorCorrectionLevel == other.errorCorrectionLevel && self.dataMask == other.dataMask;
}

@end
