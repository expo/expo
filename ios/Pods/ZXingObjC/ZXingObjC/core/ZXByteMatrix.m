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

#import "ZXByteMatrix.h"

@implementation ZXByteMatrix

- (id)initWithWidth:(int)width height:(int)height {
  if (self = [super init]) {
    _width = width;
    _height = height;

    _array = (int8_t **)malloc(height * sizeof(int8_t *));
    for (int i = 0; i < height; i++) {
      _array[i] = (int8_t *)malloc(width * sizeof(int8_t));
    }
    [self clear:0];
  }

  return self;
}

- (void)dealloc {
  if (_array != NULL) {
    for (int i = 0; i < self.height; i++) {
      free(_array[i]);
    }
    free(_array);
    _array = NULL;
  }
}

- (int8_t)getX:(int)x y:(int)y {
  return self.array[y][x];
}

- (void)setX:(int)x y:(int)y byteValue:(int8_t)value {
  self.array[y][x] = value;
}

- (void)setX:(int)x y:(int)y intValue:(int)value {
  self.array[y][x] = (int8_t)value;
}

- (void)setX:(int)x y:(int)y boolValue:(BOOL)value {
  self.array[y][x] = (int8_t)value;
}

- (void)clear:(int8_t)value {
  for (int y = 0; y < self.height; ++y) {
    for (int x = 0; x < self.width; ++x) {
      self.array[y][x] = value;
    }
  }
}

- (NSString *)description {
  NSMutableString *result = [NSMutableString string];

  for (int y = 0; y < self.height; ++y) {
    for (int x = 0; x < self.width; ++x) {
      switch (self.array[y][x]) {
      case 0:
        [result appendString:@" 0"];
        break;
      case 1:
        [result appendString:@" 1"];
        break;
      default:
        [result appendString:@"  "];
        break;
      }
    }

    [result appendString:@"\n"];
  }

  return result;
}

@end
