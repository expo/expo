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

#import "ZXBoolArray.h"
#import "ZXITFReader.h"
#import "ZXITFWriter.h"

const int ZX_ITF_WRITER_START_PATTERN[] = {1, 1, 1, 1};
const int ZX_ITF_WRITER_END_PATTERN[] = {3, 1, 1};

static const int ZX_ITF_W3 = 3; // Pixel width of a 3x wide line
static const int ZX_ITF_N = 1; // Pixel width of a narrow line

/**
 * Patterns of Wide / Narrow lines to indicate each digit
 */
const int ZX_ITF_WRITER_PATTERNS_LEN = 10;
const int ZX_ITF_WRITER_PATTERNS[ZX_ITF_WRITER_PATTERNS_LEN][5] = {
  {ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_W3, ZX_ITF_N},  // 0
  {ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_W3}, // 1
  {ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_W3}, // 2
  {ZX_ITF_W3, ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_N},  // 3
  {ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_W3}, // 4
  {ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_N},  // 5
  {ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_N},  // 6
  {ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_W3}, // 7
  {ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_N},  // 8
  {ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_N,  ZX_ITF_W3, ZX_ITF_N}   // 9
};

@implementation ZXITFWriter

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (format != kBarcodeFormatITF) {
    [NSException raise:NSInvalidArgumentException format:@"Can only encode ITF"];
  }

  return [super encode:contents format:format width:width height:height hints:hints error:error];
}

- (ZXBoolArray *)encode:(NSString *)contents {
  int length = (int)[contents length];
  if (length % 2 != 0) {
    [NSException raise:NSInvalidArgumentException format:@"The length of the input should be even"];
  }
  if (length > 80) {
    [NSException raise:NSInvalidArgumentException format:@"Requested contents should be less than 80 digits long, but got %d", length];
  }

  if (![self isNumeric:contents]) {
    @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                   reason:@"Input should only contain digits 0-9"
                                 userInfo:nil];
  }

  ZXBoolArray *result = [[ZXBoolArray alloc] initWithLength:9 + 9 * length];
  int pos = [self appendPattern:result pos:0 pattern:ZX_ITF_WRITER_START_PATTERN patternLen:sizeof(ZX_ITF_WRITER_START_PATTERN)/sizeof(int) startColor:YES];
  for (int i = 0; i < length; i += 2) {
    int one = [[contents substringWithRange:NSMakeRange(i, 1)] intValue];
    int two = [[contents substringWithRange:NSMakeRange(i + 1, 1)] intValue];
    const int encodingLen = 10;
    int encoding[encodingLen];
    memset(encoding, 0, encodingLen * sizeof(int));
    for (int j = 0; j < 5; j++) {
      encoding[2 * j] = ZX_ITF_WRITER_PATTERNS[one][j];
      encoding[2 * j + 1] = ZX_ITF_WRITER_PATTERNS[two][j];
    }
    pos += [super appendPattern:result pos:pos pattern:encoding patternLen:encodingLen startColor:YES];
  }
  [self appendPattern:result pos:pos pattern:ZX_ITF_WRITER_END_PATTERN patternLen:sizeof(ZX_ITF_WRITER_END_PATTERN)/sizeof(int) startColor:YES];

  return result;
}

@end
