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

#import "ZXRSSExpandedRow.h"

@implementation ZXRSSExpandedRow

- (id)initWithPairs:(NSArray *)pairs rowNumber:(int)rowNumber wasReversed:(BOOL)wasReversed {
  if (self = [super init]) {
    _pairs = [NSArray arrayWithArray:pairs];
    _rowNumber = rowNumber;
    _wasReversed = wasReversed;
  }

  return self;
}

- (BOOL)isReversed {
  return self.wasReversed;
}

- (BOOL)isEquivalent:(NSArray *)otherPairs {
  return [self.pairs isEqualToArray:otherPairs];
}

- (NSString *)description {
  return [NSString stringWithFormat:@"{%@}", self.pairs];
}

/**
 * Two rows are equal if they contain the same pairs in the same order.
 */
- (BOOL)isEqual:(id)object {
  if (![object isKindOfClass:[ZXRSSExpandedRow class]]) {
    return NO;
  }
  ZXRSSExpandedRow *that = (ZXRSSExpandedRow *)object;
  return [self.pairs isEqual:that.pairs] && (self.wasReversed == that.wasReversed);
}

- (NSUInteger)hash {
  return self.pairs.hash ^ @(self.wasReversed).hash;
}

@end
