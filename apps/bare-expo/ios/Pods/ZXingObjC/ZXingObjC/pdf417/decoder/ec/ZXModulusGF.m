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

#import "ZXIntArray.h"
#import "ZXModulusGF.h"
#import "ZXModulusPoly.h"
#import "ZXPDF417Common.h"

@interface ZXModulusGF ()

@property (nonatomic, assign, readonly) int32_t *expTable;
@property (nonatomic, assign, readonly) int32_t *logTable;
@property (nonatomic, assign, readonly) int modulus;

@end

@implementation ZXModulusGF

+ (ZXModulusGF *)PDF417_GF {
  static dispatch_once_t pred = 0;
  __strong static id _mod = nil;
  dispatch_once(&pred, ^{
    @autoreleasepool {
      _mod = [[ZXModulusGF alloc] initWithModulus:ZX_PDF417_NUMBER_OF_CODEWORDS generator:3];
    }
  });
  return _mod;
}

- (id)initWithModulus:(int)modulus generator:(int)generator {
  if (self = [super init]) {
    _modulus = modulus;
    _expTable = (int32_t *)calloc(self.modulus, sizeof(int32_t));
    _logTable = (int32_t *)calloc(self.modulus, sizeof(int32_t));
    int32_t x = 1;
    for (int i = 0; i < modulus; i++) {
      _expTable[i] = x;
      x = (x * generator) % modulus;
    }
    for (int i = 0; i < self.size - 1; i++) {
      _logTable[_expTable[i]] = i;
    }
    // logTable[0] == 0 but this should never be used
    _zero = [[ZXModulusPoly alloc] initWithField:self coefficients:[[ZXIntArray alloc] initWithLength:1]];
    _one = [[ZXModulusPoly alloc] initWithField:self coefficients:[[ZXIntArray alloc] initWithInts:1, -1]];
  }

  return self;
}

- (ZXModulusPoly *)buildMonomial:(int)degree coefficient:(int)coefficient {
  if (degree < 0) {
    [NSException raise:NSInvalidArgumentException format:@"Degree must be greater than 0."];
  }
  if (coefficient == 0) {
    return self.zero;
  }
  ZXIntArray *coefficients = [[ZXIntArray alloc] initWithLength:degree + 1];
  coefficients.array[0] = coefficient;
  return [[ZXModulusPoly alloc] initWithField:self coefficients:coefficients];
}

- (int)add:(int)a b:(int)b {
  return (a + b) % self.modulus;
}

- (int)subtract:(int)a b:(int)b {
  return (self.modulus + a - b) % self.modulus;
}

- (int)exp:(int)a {
  return _expTable[a];
}

- (int)log:(int)a {
  if (a == 0) {
    [NSException raise:NSInvalidArgumentException format:@"Argument must be non-zero."];
  }
  return _logTable[a];
}

- (int)inverse:(int)a {
  if (a == 0) {
    [NSException raise:NSInvalidArgumentException format:@"Argument must be non-zero."];
  }

  return _expTable[_modulus - _logTable[a] - 1];
}

- (int)multiply:(int)a b:(int)b {
  if (a == 0 || b == 0) {
    return 0;
  }

  return _expTable[(_logTable[a] + _logTable[b]) % (_modulus - 1)];
}

- (int)size {
  return self.modulus;
}

@end
