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
#import "ZXEAN8Reader.h"
#import "ZXIntArray.h"

@interface ZXEAN8Reader ()

@property (nonatomic, strong, readonly) ZXIntArray *decodeMiddleCounters;

@end

@implementation ZXEAN8Reader

- (id)init {
  if (self = [super init]) {
    _decodeMiddleCounters = [[ZXIntArray alloc] initWithLength:4];
  }

  return self;
}

- (int)decodeMiddle:(ZXBitArray *)row startRange:(NSRange)startRange result:(NSMutableString *)result error:(NSError **)error {
  ZXIntArray *counters = self.decodeMiddleCounters;
  [counters clear];
  int end = row.size;
  int rowOffset = (int)NSMaxRange(startRange);

  for (int x = 0; x < 4 && rowOffset < end; x++) {
    int bestMatch = [ZXUPCEANReader decodeDigit:row counters:counters rowOffset:rowOffset patternType:ZX_UPC_EAN_PATTERNS_L_PATTERNS error:error];
    if (bestMatch == -1) {
      return -1;
    }
    [result appendFormat:@"%C", (unichar)('0' + bestMatch)];
    rowOffset += [counters sum];
  }

  NSRange middleRange = [[self class] findGuardPattern:row rowOffset:rowOffset whiteFirst:YES pattern:ZX_UPC_EAN_MIDDLE_PATTERN patternLen:ZX_UPC_EAN_MIDDLE_PATTERN_LEN error:error];
  if (middleRange.location == NSNotFound) {
    return -1;
  }
  rowOffset = (int)NSMaxRange(middleRange);

  for (int x = 0; x < 4 && rowOffset < end; x++) {
    int bestMatch = [ZXUPCEANReader decodeDigit:row counters:counters rowOffset:rowOffset patternType:ZX_UPC_EAN_PATTERNS_L_PATTERNS error:error];
    if (bestMatch == -1) {
      return -1;
    }
    [result appendFormat:@"%C", (unichar)('0' + bestMatch)];
    rowOffset += [counters sum];
  }

  return rowOffset;
}

- (ZXBarcodeFormat)barcodeFormat {
  return kBarcodeFormatEan8;
}

@end
