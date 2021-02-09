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

#import "ZXIntArray.h"

@implementation ZXIntArray

- (id)initWithLength:(unsigned int)length {
  if (self = [super init]) {
    if (length > 0) {
      _array = (int32_t *)calloc(length, sizeof(int32_t));
    } else {
      _array = NULL;
    }
    _length = length;
  }

  return self;
}

- (id)initWithInts:(int32_t)int1, ... {
  va_list args;
  va_start(args, int1);
  unsigned int length = 0;
  for (int32_t i = int1; i != -1; i = va_arg(args, int)) {
    length++;
  }
  va_end(args);

  if ((self = [self initWithLength:length]) && (length > 0)) {
    va_list args;
    va_start(args, int1);
    int i = 0;
    for (int32_t c = int1; c != -1; c = va_arg(args, int)) {
      _array[i++] = c;
    }
    va_end(args);
  }

  return self;
}

- (BOOL)isEqual:(id)o {
    if (![o isKindOfClass:[self class]]) {
        return NO;
    }
    ZXIntArray *other = (ZXIntArray *) o;
    if (other == self) {
        return YES;
    }
    if (other.length != self.length) {
        return NO;
    }
    for (int i = 0; i < self.length; i++) {
        if (other.array[i] != self.array[i]) {
            return NO;
        }
    }
    return YES;
}

- (id)copyWithZone:(NSZone *)zone {
  ZXIntArray *copy = [[ZXIntArray allocWithZone:zone] initWithLength:self.length];
  memcpy(copy.array, self.array, self.length * sizeof(int32_t));
  return copy;
}

- (void)dealloc {
  if (_array) {
    free(_array);
  }
}

- (void)clear {
  memset(self.array, 0, self.length * sizeof(int32_t));
}

- (int)sum {
  int sum = 0;
  int32_t *array = self.array;
  for (int i = 0; i < self.length; i++) {
    sum += array[i];
  }
  return sum;
}

- (NSString *)description {
  NSMutableString *s = [NSMutableString stringWithFormat:@"length=%u, array=(", self.length];

  for (int i = 0; i < self.length; i++) {
    [s appendFormat:@"%d", self.array[i]];
    if (i < self.length - 1) {
      [s appendString:@", "];
    }
  }

  [s appendString:@")"];
  return s;
}

@end
