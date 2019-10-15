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
#import "ZXByteArray.h"
#import "ZXDecodeHints.h"
#import "ZXDecoderResult.h"
#import "ZXErrors.h"
#import "ZXGenericGF.h"
#import "ZXIntArray.h"
#import "ZXMaxiCodeBitMatrixParser.h"
#import "ZXMaxiCodeDecodedBitStreamParser.h"
#import "ZXMaxiCodeDecoder.h"
#import "ZXReedSolomonDecoder.h"

const int ZX_MAXI_CODE_ALL = 0;
const int ZX_MAXI_CODE_EVEN = 1;
const int ZX_MAXI_CODE_ODD = 2;

@interface ZXMaxiCodeDecoder ()

@property (nonatomic, strong, readonly) ZXReedSolomonDecoder *rsDecoder;

@end

@implementation ZXMaxiCodeDecoder

- (id)init {
  if (self = [super init]) {
    _rsDecoder = [[ZXReedSolomonDecoder alloc] initWithField:[ZXGenericGF MaxiCodeField64]];
  }

  return self;
}

- (ZXDecoderResult *)decode:(ZXBitMatrix *)bits error:(NSError **)error {
  return [self decode:bits hints:nil error:error];
}

- (ZXDecoderResult *)decode:(ZXBitMatrix *)bits hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXMaxiCodeBitMatrixParser *parser = [[ZXMaxiCodeBitMatrixParser alloc] initWithBitMatrix:bits error:error];
  if (!parser) {
    return nil;
  }
  ZXByteArray *codewords = [parser readCodewords];

  if (![self correctErrors:codewords start:0 dataCodewords:10 ecCodewords:10 mode:ZX_MAXI_CODE_ALL error:error]) {
    return nil;
  }
  int mode = codewords.array[0] & 0x0F;
  ZXByteArray *datawords;
  switch (mode) {
    case 2:
    case 3:
    case 4:
      if (![self correctErrors:codewords start:20 dataCodewords:84 ecCodewords:40 mode:ZX_MAXI_CODE_EVEN error:error]) {
        return nil;
      }
      if (![self correctErrors:codewords start:20 dataCodewords:84 ecCodewords:40 mode:ZX_MAXI_CODE_ODD error:error]) {
        return nil;
      }
      datawords = [[ZXByteArray alloc] initWithLength:94];
      break;
    case 5:
      if (![self correctErrors:codewords start:20 dataCodewords:68 ecCodewords:56 mode:ZX_MAXI_CODE_EVEN error:error]) {
        return nil;
      }
      if (![self correctErrors:codewords start:20 dataCodewords:68 ecCodewords:56 mode:ZX_MAXI_CODE_ODD error:error]) {
        return nil;
      }
      datawords = [[ZXByteArray alloc] initWithLength:78];
      break;
    default:
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
  }

  for (int i = 0; i < 10; i++) {
    datawords.array[i] = codewords.array[i];
  }
  for (int i = 20; i < datawords.length + 10; i++) {
    datawords.array[i - 10] = codewords.array[i];
  }

  return [ZXMaxiCodeDecodedBitStreamParser decode:datawords mode:mode];
}

- (BOOL)correctErrors:(ZXByteArray *)codewordBytes start:(int)start dataCodewords:(int)dataCodewords
          ecCodewords:(int)ecCodewords mode:(int)mode error:(NSError **)error {
  int codewords = dataCodewords + ecCodewords;

  // in EVEN or ODD mode only half the codewords
  int divisor = mode == ZX_MAXI_CODE_ALL ? 1 : 2;

  // First read into an array of ints
  ZXIntArray *codewordsInts = [[ZXIntArray alloc] initWithLength:codewords / divisor];
  for (int i = 0; i < codewords; i++) {
    if ((mode == ZX_MAXI_CODE_ALL) || (i % 2 == (mode - 1))) {
      codewordsInts.array[i / divisor] = codewordBytes.array[i + start] & 0xFF;
    }
  }

  NSError *decodeError = nil;
  if (![self.rsDecoder decode:codewordsInts twoS:ecCodewords / divisor error:&decodeError]) {
    if (decodeError.code == ZXReedSolomonError && error) {
      *error = ZXChecksumErrorInstance();
    }
    return NO;
  }
  // Copy back into array of bytes -- only need to worry about the bytes that were data
  // We don't care about errors in the error-correction codewords
  for (int i = 0; i < dataCodewords; i++) {
    if ((mode == ZX_MAXI_CODE_ALL) || (i % 2 == (mode - 1))) {
      codewordBytes.array[i + start] = (int8_t) codewordsInts.array[i / divisor];
    }
  }

  return YES;
}

@end
