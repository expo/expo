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

#import "ZXRSSFinderPattern.h"

@implementation ZXRSSFinderPattern

- (id)initWithValue:(int)value startEnd:(ZXIntArray *)startEnd start:(int)start end:(int)end rowNumber:(int)rowNumber {
  if (self = [super init]) {
    _value = value;
    _startEnd = startEnd;
    _resultPoints = [@[[[ZXResultPoint alloc] initWithX:(float)start y:(float)rowNumber],
                       [[ZXResultPoint alloc] initWithX:(float)end y:(float)rowNumber]] mutableCopy];
  }

  return self;
}

- (BOOL)isEqual:(id)object {
  if (![object isKindOfClass:[ZXRSSFinderPattern class]]) {
    return NO;
  }

  ZXRSSFinderPattern *that = (ZXRSSFinderPattern *)object;
  return self.value == that.value;
}

- (NSUInteger)hash {
  return self.value;
}

@end
