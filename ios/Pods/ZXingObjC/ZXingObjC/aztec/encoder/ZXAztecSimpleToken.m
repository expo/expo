/*
 * Copyright 2014 ZXing authors
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

#import "ZXAztecSimpleToken.h"
#import "ZXBitArray.h"

@interface ZXAztecSimpleToken ()

// For normal words, indicates value and bitCount
@property (nonatomic, assign, readonly) int16_t value;
@property (nonatomic, assign, readonly) int16_t bitCount;

@end

@implementation ZXAztecSimpleToken

- (id)initWithPrevious:(ZXAztecToken *)previous value:(int)value bitCount:(int)bitCount {
  if (self = [super initWithPrevious:previous]) {
    _value = (int16_t)value;
    _bitCount = (int16_t)bitCount;
  }

  return self;
}

- (void)appendTo:(ZXBitArray *)bitArray text:(ZXByteArray *)text {
  [bitArray appendBits:self.value numBits:self.bitCount];
}

- (NSString *)description {
  int value = self.value & ((1 << self.bitCount) - 1);
  value |= 1 << self.bitCount;

  NSMutableString *str = [NSMutableString string];
	for (int i = value | (1 << self.bitCount); i > 0; i >>= 1) {
    [str insertString:((i & 1) ? @"1" : @"0") atIndex:0];
	}

  return [NSString stringWithFormat:@"<%@>", [str substringFromIndex:1]];
}

@end
