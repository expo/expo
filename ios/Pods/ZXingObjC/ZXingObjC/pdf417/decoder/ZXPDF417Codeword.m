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

#import "ZXPDF417Codeword.h"

const int ZX_PDF417_BARCODE_ROW_UNKNOWN = -1;

@implementation ZXPDF417Codeword

- (id)initWithStartX:(int)startX endX:(int)endX bucket:(int)bucket value:(int)value {
  self = [super init];
  if (self) {
    _startX = startX;
    _endX = endX;
    _bucket = bucket;
    _value = value;
    _rowNumber = ZX_PDF417_BARCODE_ROW_UNKNOWN;
  }

  return self;
}

- (BOOL)hasValidRowNumber {
  return [self isValidRowNumber:self.rowNumber];
}

- (BOOL)isValidRowNumber:(int)rowNumber {
  return rowNumber != ZX_PDF417_BARCODE_ROW_UNKNOWN && self.bucket == (rowNumber % 3) * 3;
}

- (void)setRowNumberAsRowIndicatorColumn {
  self.rowNumber = (self.value / 30) * 3 + self.bucket / 3;
}

- (int)width {
  return self.endX - self.startX;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%d|%d", self.rowNumber, self.value];
}

@end
