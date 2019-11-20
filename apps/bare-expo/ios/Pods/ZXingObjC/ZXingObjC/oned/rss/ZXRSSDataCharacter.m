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

#import "ZXRSSDataCharacter.h"

@implementation ZXRSSDataCharacter

- (id)initWithValue:(int)value checksumPortion:(int)checksumPortion {
  if (self = [super init]) {
    _value = value;
    _checksumPortion = checksumPortion;
  }

  return self;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%d(%d)", self.value, self.checksumPortion];
}

- (BOOL)isEqual:(id)object {
  if (![object isKindOfClass:[ZXRSSDataCharacter class]]) {
    return NO;
  }

  ZXRSSDataCharacter *that = (ZXRSSDataCharacter *)object;
  return (self.value == that.value) && (self.checksumPortion == that.checksumPortion);
}

- (NSUInteger)hash {
  return self.value ^ self.checksumPortion;
}

@end
