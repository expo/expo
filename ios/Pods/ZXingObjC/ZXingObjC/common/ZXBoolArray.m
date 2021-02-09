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

#import "ZXBoolArray.h"

@implementation ZXBoolArray

- (id)initWithLength:(unsigned int)length {
  if (self = [super init]) {
    _array = (BOOL *)calloc(length, sizeof(BOOL));
    _length = length;
  }

  return self;
}

- (id)initWithLength:(unsigned int)length values:(int)value1, ... {
  if ((self = [self initWithLength:length]) && (length > 0)) {
    va_list args;
    va_start(args, value1);
    _array[0] = value1 == 1 ? true : false;
    for (int i = 1; i < length; i++) {
      int value = va_arg(args, int);
      _array[i] = value == 1 ? true : false;
    }
    va_end(args);
  }

  return self;
}

- (void)dealloc {
  if (_array) {
    free(_array);
  }
}

@end
