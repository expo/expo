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

#import "ZXGenericGF.h"
#import "ZXGenericGFPoly.h"
#import "ZXIntArray.h"
#import "ZXReedSolomonEncoder.h"

@interface ZXReedSolomonEncoder ()

@property (nonatomic, strong, readonly) NSMutableArray *cachedGenerators;
@property (nonatomic, strong, readonly) ZXGenericGF *field;

@end

@implementation ZXReedSolomonEncoder

- (id)initWithField:(ZXGenericGF *)field {
  if (self = [super init]) {
    _field = field;
    ZXIntArray *one = [[ZXIntArray alloc] initWithLength:1];
    one.array[0] = 1;
    _cachedGenerators = [NSMutableArray arrayWithObject:[[ZXGenericGFPoly alloc] initWithField:field coefficients:one]];
  }

  return self;
}

- (ZXGenericGFPoly *)buildGenerator:(int)degree {
  if (degree >= self.cachedGenerators.count) {
    ZXGenericGFPoly *lastGenerator = self.cachedGenerators[[self.cachedGenerators count] - 1];
    for (NSUInteger d = [self.cachedGenerators count]; d <= degree; d++) {
      ZXIntArray *next = [[ZXIntArray alloc] initWithLength:2];
      next.array[0] = 1;
      next.array[1] = [self.field exp:(int)d - 1 + self.field.generatorBase];
      ZXGenericGFPoly *nextGenerator = [lastGenerator multiply:[[ZXGenericGFPoly alloc] initWithField:self.field coefficients:next]];
      [self.cachedGenerators addObject:nextGenerator];
      lastGenerator = nextGenerator;
    }
  }

  return (ZXGenericGFPoly *)self.cachedGenerators[degree];
}

- (void)encode:(ZXIntArray *)toEncode ecBytes:(int)ecBytes {
  if (ecBytes == 0) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"No error correction bytes"
                                 userInfo:nil];
  }
  int dataBytes = toEncode.length - ecBytes;
  if (dataBytes <= 0) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"No data bytes provided"
                                 userInfo:nil];
  }
  ZXGenericGFPoly *generator = [self buildGenerator:ecBytes];
  ZXIntArray *infoCoefficients = [[ZXIntArray alloc] initWithLength:dataBytes];
  for (int i = 0; i < dataBytes; i++) {
    infoCoefficients.array[i] = toEncode.array[i];
  }
  ZXGenericGFPoly *info = [[ZXGenericGFPoly alloc] initWithField:self.field coefficients:infoCoefficients];
  info = [info multiplyByMonomial:ecBytes coefficient:1];
  ZXGenericGFPoly *remainder = [info divide:generator][1];
  ZXIntArray *coefficients = remainder.coefficients;
  int numZeroCoefficients = ecBytes - coefficients.length;
  for (int i = 0; i < numZeroCoefficients; i++) {
    toEncode.array[dataBytes + i] = 0;
  }
  for (int i = 0; i < coefficients.length; i++) {
    toEncode.array[dataBytes + numZeroCoefficients + i] = coefficients.array[i];
  }
}

@end
