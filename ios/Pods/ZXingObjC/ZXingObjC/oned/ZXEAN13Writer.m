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

#import "ZXBarcodeFormat.h"
#import "ZXBoolArray.h"
#import "ZXEAN13Reader.h"
#import "ZXEAN13Writer.h"
#import "ZXUPCEANReader.h"

const int ZX_EAN13_CODE_WIDTH = 3 + // start guard
  (7 * 6) + // left bars
  5 + // middle guard
  (7 * 6) + // right bars
  3; // end guard

@implementation ZXEAN13Writer

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (format != kBarcodeFormatEan13) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:[NSString stringWithFormat:@"Can only encode EAN_13, but got %d", format]
                                 userInfo:nil];
  }

  return [super encode:contents format:format width:width height:height hints:hints error:error];
}

- (ZXBoolArray *)encode:(NSString *)contents {
  int length = (int) [contents length];
  switch (length) {
    case 12:
      // No check digit present, calculate it and add it
      contents = [contents stringByAppendingString:[NSString stringWithFormat:@"%d", [ZXUPCEANReader standardUPCEANChecksum:contents]]];
      break;
    case 13:
      if (![ZXUPCEANReader checkStandardUPCEANChecksum:contents]) {
        @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                       reason:@"Contents do not pass checksum"
                                     userInfo:nil];
      }
      break;
    default:
      @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                     reason:[NSString stringWithFormat:@"Requested contents should be 12 or 13 digits long, but got %d", (int)[contents length]]
                                   userInfo:nil];
  }

  if (![self isNumeric:contents]) {
    @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                   reason:@"Input should only contain digits 0-9"
                                 userInfo:nil];
  }

  int firstDigit = [[contents substringToIndex:1] intValue];
  int parities = ZX_EAN13_FIRST_DIGIT_ENCODINGS[firstDigit];
  ZXBoolArray *result = [[ZXBoolArray alloc] initWithLength:ZX_EAN13_CODE_WIDTH];
  int pos = 0;

  pos += [self appendPattern:result pos:pos pattern:ZX_UPC_EAN_START_END_PATTERN patternLen:ZX_UPC_EAN_START_END_PATTERN_LEN startColor:YES];

  for (int i = 1; i <= 6; i++) {
    int digit = [[contents substringWithRange:NSMakeRange(i, 1)] intValue];
    if ((parities >> (6 - i) & 1) == 1) {
      digit += 10;
    }
    pos += [self appendPattern:result pos:pos pattern:ZX_UPC_EAN_L_AND_G_PATTERNS[digit] patternLen:ZX_UPC_EAN_L_PATTERNS_SUB_LEN startColor:FALSE];
  }

  pos += [self appendPattern:result pos:pos pattern:ZX_UPC_EAN_MIDDLE_PATTERN patternLen:ZX_UPC_EAN_MIDDLE_PATTERN_LEN startColor:FALSE];

  for (int i = 7; i <= 12; i++) {
    int digit = [[contents substringWithRange:NSMakeRange(i, 1)] intValue];
    pos += [self appendPattern:result pos:pos pattern:ZX_UPC_EAN_L_PATTERNS[digit] patternLen:ZX_UPC_EAN_L_PATTERNS_SUB_LEN startColor:YES];
  }
  [self appendPattern:result pos:pos pattern:ZX_UPC_EAN_START_END_PATTERN patternLen:ZX_UPC_EAN_START_END_PATTERN_LEN startColor:YES];

  return result;
}

@end
