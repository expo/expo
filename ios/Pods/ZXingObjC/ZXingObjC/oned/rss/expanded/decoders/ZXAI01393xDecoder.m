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

#import "ZXAI01393xDecoder.h"
#import "ZXBitArray.h"
#import "ZXErrors.h"
#import "ZXRSSExpandedDecodedInformation.h"
#import "ZXRSSExpandedGeneralAppIdDecoder.h"

@implementation ZXAI01393xDecoder

const int ZX_AI01393xDecoder_HEADER_SIZE = 5 + 1 + 2;
const int ZX_AI01393xDecoder_LAST_DIGIT_SIZE = 2;
const int ZX_AI01393xDecoder_FIRST_THREE_DIGITS_SIZE = 10;

- (NSString *)parseInformationWithError:(NSError **)error {
  if (self.information.size < ZX_AI01393xDecoder_HEADER_SIZE + ZX_AI01_GTIN_SIZE) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  NSMutableString *buf = [NSMutableString string];

  [self encodeCompressedGtin:buf currentPos:ZX_AI01393xDecoder_HEADER_SIZE];

  int lastAIdigit = [self.generalDecoder extractNumericValueFromBitArray:ZX_AI01393xDecoder_HEADER_SIZE + ZX_AI01_GTIN_SIZE
                                                                    bits:ZX_AI01393xDecoder_LAST_DIGIT_SIZE];

  [buf appendFormat:@"(393%d)", lastAIdigit];

  int firstThreeDigits = [self.generalDecoder extractNumericValueFromBitArray:ZX_AI01393xDecoder_HEADER_SIZE + ZX_AI01_GTIN_SIZE + ZX_AI01393xDecoder_LAST_DIGIT_SIZE
                                                                         bits:ZX_AI01393xDecoder_FIRST_THREE_DIGITS_SIZE];
  if (firstThreeDigits / 100 == 0) {
    [buf appendString:@"0"];
  }
  if (firstThreeDigits / 10 == 0) {
    [buf appendString:@"0"];
  }
  [buf appendFormat:@"%d", firstThreeDigits];

  ZXRSSExpandedDecodedInformation *generalInformation = [self.generalDecoder decodeGeneralPurposeField:ZX_AI01393xDecoder_HEADER_SIZE + ZX_AI01_GTIN_SIZE + ZX_AI01393xDecoder_LAST_DIGIT_SIZE + ZX_AI01393xDecoder_FIRST_THREE_DIGITS_SIZE
                                                                                  remaining:nil];
  [buf appendString:generalInformation.theNewString];

  return buf;
}

@end
