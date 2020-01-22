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

#import "ZXPDF417BarcodeValue.h"
#import "ZXPDF417Common.h"

@interface ZXPDF417BarcodeValue ()

@property (nonatomic, strong, readonly) NSMutableDictionary *values;

@end

@implementation ZXPDF417BarcodeValue

- (id)init {
  self = [super init];
  if (self) {
    _values = [NSMutableDictionary dictionary];
  }

  return self;
}

- (void)setValue:(int)value {
  NSNumber *confidence = self.values[@(value)];
  if (!confidence) {
    confidence = @0;
  }
  confidence = @([confidence intValue] + 1);
  self.values[@(value)] = confidence;
}

- (ZXIntArray *)value {
  int maxConfidence = -1;
  NSMutableArray *result = [NSMutableArray array];
  for (NSNumber *key in [self.values allKeys]) {
    NSNumber *value = self.values[key];
    if ([value intValue] > maxConfidence) {
      maxConfidence = [value intValue];
      [result removeAllObjects];
      [result addObject:key];
    } else if ([value intValue] == maxConfidence) {
      [result addObject:key];
    }
  }
  NSArray *array = [[[result sortedArrayUsingSelector:@selector(compare:)] reverseObjectEnumerator] allObjects];
  return [ZXPDF417Common toIntArray:array];
}

- (NSNumber *)confidence:(int)value {
  return self.values[@(value)];
}

@end
