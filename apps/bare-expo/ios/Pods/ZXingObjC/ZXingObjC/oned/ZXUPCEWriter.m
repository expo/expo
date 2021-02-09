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

#import "ZXUPCEWriter.h"
#import "ZXUPCEANReader.h"
#import "ZXUPCEReader.h"
#import "ZXBoolArray.h"

// start guard 3
// bars 7 * 6
// end guard 6
const int ZX_UPCE_CODE_WIDTH = 3 + (7 * 6) + 6;

@implementation ZXUPCEWriter

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (format != kBarcodeFormatUPCE) {
    [NSException raise:NSInvalidArgumentException format:@"Can only encode UPC_E"];
  }
  return [super encode:contents format:format width:width height:height hints:hints error:error];
}

- (ZXBoolArray *)encode:(NSString *)contents {
  int length = (int) [contents length];
  switch (length) {
    case 7:
      // No check digit present, calculate it and add it
      contents = [contents stringByAppendingString:[NSString stringWithFormat:@"%d", [ZXUPCEANReader standardUPCEANChecksum:[ZXUPCEReader convertUPCEtoUPCA:contents]]]];
      break;
    case 8:
      if (![ZXUPCEReader checkStandardUPCEANChecksum:contents]) {
        @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                       reason:@"Contents do not pass checksum"
                                     userInfo:nil];
      }
      break;
    default:
      @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                     reason:[NSString stringWithFormat:@"Requested contents should be 7 or 8 digits long, but got %d", (int)[contents length]]
                                   userInfo:nil];
  }

  if (![self isNumeric:contents]) {
    @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                   reason:@"Input should only contain digits 0-9"
                                 userInfo:nil];
  }

  int firstDigit = [[contents substringWithRange:NSMakeRange(0, 1)] intValue];
  if (firstDigit != 0 && firstDigit != 1) {
    @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                   reason:@"Number system must be 0 or 1"
                                 userInfo:nil];
  }
  
  int checkDigit = [[contents substringWithRange:NSMakeRange(7, 1)] intValue];
  int parities = ZX_UCPE_NUMSYS_AND_CHECK_DIGIT_PATTERNS[firstDigit][checkDigit];
  ZXBoolArray *result = [[ZXBoolArray alloc] initWithLength:ZX_UPCE_CODE_WIDTH];
  int pos = 0;
  
  pos += [self appendPattern:result pos:pos pattern:ZX_UPC_EAN_START_END_PATTERN patternLen:ZX_UPC_EAN_START_END_PATTERN_LEN startColor:YES];
  
  for (int i = 1; i <= 6; i++) {
    int digit = [[contents substringWithRange:NSMakeRange(i, 1)] intValue];
    if ((parities >> (6 - i) & 1) == 1) {
      digit += 10;
    }
    pos += [self appendPattern:result pos:pos pattern:ZX_UPC_EAN_L_AND_G_PATTERNS[digit] patternLen:ZX_UPC_EAN_L_PATTERNS_SUB_LEN startColor:NO];
  }
  
  [self appendPattern:result pos:pos pattern:ZX_UPCE_MIDDLE_END_PATTERN patternLen:ZX_UPCE_MIDDLE_END_PATTERN_LEN startColor:NO];
  
  return result;
}

@end
