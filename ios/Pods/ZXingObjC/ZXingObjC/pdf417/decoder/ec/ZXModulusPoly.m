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

@interface ZXModulusPoly ()

@property (nonatomic, strong, readonly) ZXIntArray *coefficients;
@property (nonatomic, weak, readonly) ZXModulusGF *field;

@end

@implementation ZXModulusPoly

- (id)initWithField:(ZXModulusGF *)field coefficients:(ZXIntArray *)coefficients {
  if (self = [super init]) {
    if (coefficients.length == 0) {
      @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                     reason:@"coefficients must have at least one element"
                                   userInfo:nil];
    }
    _field = field;
    int coefficientsLength = coefficients.length;
    if (coefficientsLength > 1 && coefficients.array[0] == 0) {
      // Leading term must be non-zero for anything except the constant polynomial "0"
      int firstNonZero = 1;
      while (firstNonZero < coefficientsLength && coefficients.array[firstNonZero] == 0) {
        firstNonZero++;
      }
      if (firstNonZero == coefficientsLength) {
        _coefficients = [[ZXIntArray alloc] initWithLength:1];
      } else {
        _coefficients = [[ZXIntArray alloc] initWithLength:coefficientsLength - firstNonZero];
        for (int i = 0; i < _coefficients.length; i++) {
          _coefficients.array[i] = coefficients.array[firstNonZero + i];
        }
      }
    } else {
      _coefficients = coefficients;
    }
  }

  return self;
}

/**
 * @return degree of this polynomial
 */
- (int)degree {
  return self.coefficients.length - 1;
}

/**
 * @return true iff this polynomial is the monomial "0"
 */
- (BOOL)zero {
  return self.coefficients.array[0] == 0;
}

/**
 * @return coefficient of x^degree term in this polynomial
 */
- (int)coefficient:(int)degree {
  return self.coefficients.array[self.coefficients.length - 1 - degree];
}

/**
 * @return evaluation of this polynomial at a given point
 */
- (int)evaluateAt:(int)a {
  if (a == 0) {
    return [self coefficient:0];
  }
  int size = self.coefficients.length;
  if (a == 1) {
    // Just the sum of the coefficients
    int result = 0;
    for (int i = 0; i < size; i++) {
      result = [self.field add:result b:self.coefficients.array[i]];
    }
    return result;
  }
  int result = self.coefficients.array[0];
  for (int i = 1; i < size; i++) {
    result = [self.field add:[self.field multiply:a b:result] b:self.coefficients.array[i]];
  }
  return result;
}

- (ZXModulusPoly *)add:(ZXModulusPoly *)other {
  if (![self.field isEqual:other.field]) {
    [NSException raise:NSInvalidArgumentException format:@"ZXModulusPolys do not have same ZXModulusGF field"];
  }
  if (self.zero) {
    return other;
  }
  if (other.zero) {
    return self;
  }

  ZXIntArray *smallerCoefficients = self.coefficients;
  ZXIntArray *largerCoefficients = other.coefficients;
  if (smallerCoefficients.length > largerCoefficients.length) {
    ZXIntArray *temp = smallerCoefficients;
    smallerCoefficients = largerCoefficients;
    largerCoefficients = temp;
  }
  ZXIntArray *sumDiff = [[ZXIntArray alloc] initWithLength:largerCoefficients.length];
  int lengthDiff = largerCoefficients.length - smallerCoefficients.length;
  // Copy high-order terms only found in higher-degree polynomial's coefficients
  memcpy(sumDiff.array, largerCoefficients.array, lengthDiff * sizeof(int32_t));

  for (int i = lengthDiff; i < largerCoefficients.length; i++) {
    sumDiff.array[i] = [self.field add:smallerCoefficients.array[i - lengthDiff] b:largerCoefficients.array[i]];
  }

  return [[ZXModulusPoly alloc] initWithField:self.field coefficients:sumDiff];
}

- (ZXModulusPoly *)subtract:(ZXModulusPoly *)other {
  if (![self.field isEqual:other.field]) {
    [NSException raise:NSInvalidArgumentException format:@"ZXModulusPolys do not have same ZXModulusGF field"];
  }
  if (self.zero) {
    return self;
  }
  return [self add:[other negative]];
}

- (ZXModulusPoly *)multiply:(ZXModulusPoly *)other {
  if (![self.field isEqual:other.field]) {
    [NSException raise:NSInvalidArgumentException format:@"ZXModulusPolys do not have same ZXModulusGF field"];
  }
  if (self.zero || other.zero) {
    return self.field.zero;
  }
  ZXIntArray *aCoefficients = self.coefficients;
  int aLength = aCoefficients.length;
  ZXIntArray *bCoefficients = other.coefficients;
  int bLength = bCoefficients.length;
  ZXIntArray *product = [[ZXIntArray alloc] initWithLength:aLength + bLength - 1];
  for (int i = 0; i < aLength; i++) {
    int aCoeff = aCoefficients.array[i];
    for (int j = 0; j < bLength; j++) {
      product.array[i + j] = [self.field add:product.array[i + j]
                                     b:[self.field multiply:aCoeff b:bCoefficients.array[j]]];
    }
  }
  return [[ZXModulusPoly alloc] initWithField:self.field coefficients:product];
}

- (ZXModulusPoly *)negative {
  int size = self.coefficients.length;
  ZXIntArray *negativeCoefficients = [[ZXIntArray alloc] initWithLength:size];
  for (int i = 0; i < size; i++) {
    negativeCoefficients.array[i] = [self.field subtract:0 b:self.coefficients.array[i]];
  }
  return [[ZXModulusPoly alloc] initWithField:self.field coefficients:negativeCoefficients];
}

- (ZXModulusPoly *)multiplyScalar:(int)scalar {
  if (scalar == 0) {
    return self.field.zero;
  }
  if (scalar == 1) {
    return self;
  }
  int size = self.coefficients.length;
  ZXIntArray *product = [[ZXIntArray alloc] initWithLength:size];
  for (int i = 0; i < size; i++) {
    product.array[i] = [self.field multiply:self.coefficients.array[i] b:scalar];
  }
  return [[ZXModulusPoly alloc] initWithField:self.field coefficients:product];
}

- (ZXModulusPoly *)multiplyByMonomial:(int)degree coefficient:(int)coefficient {
  if (degree < 0) {
    [NSException raise:NSInvalidArgumentException format:@"Degree must be greater than 0."];
  }
  if (coefficient == 0) {
    return self.field.zero;
  }
  int size = self.coefficients.length;
  ZXIntArray *product = [[ZXIntArray alloc] initWithLength:size + degree];
  for (int i = 0; i < size; i++) {
    product.array[i] = [self.field multiply:self.coefficients.array[i] b:coefficient];
  }

  return [[ZXModulusPoly alloc] initWithField:self.field coefficients:product];
}

- (NSArray *)divide:(ZXModulusPoly *)other {
  if (![self.field isEqual:other.field]) {
    [NSException raise:NSInvalidArgumentException format:@"ZXModulusPolys do not have same ZXModulusGF field"];
  }
  if (other.zero) {
    [NSException raise:NSInvalidArgumentException format:@"Divide by 0"];
  }

  ZXModulusPoly *quotient = self.field.zero;
  ZXModulusPoly *remainder = self;

  int denominatorLeadingTerm = [other coefficient:other.degree];
  int inverseDenominatorLeadingTerm = [self.field inverse:denominatorLeadingTerm];

  while ([remainder degree] >= other.degree && !remainder.zero) {
    int degreeDifference = remainder.degree - other.degree;
    int scale = [self.field multiply:[remainder coefficient:remainder.degree] b:inverseDenominatorLeadingTerm];
    ZXModulusPoly *term = [other multiplyByMonomial:degreeDifference coefficient:scale];
    ZXModulusPoly *iterationQuotient = [self.field buildMonomial:degreeDifference coefficient:scale];
    quotient = [quotient add:iterationQuotient];
    remainder = [remainder subtract:term];
  }

  return @[quotient, remainder];
}

- (NSString *)description {
  NSMutableString *result = [NSMutableString stringWithCapacity:8 * [self degree]];
  for (int degree = [self degree]; degree >= 0; degree--) {
    int coefficient = [self coefficient:degree];
    if (coefficient != 0) {
      if (coefficient < 0) {
        [result appendString:@" - "];
        coefficient = -coefficient;
      } else {
        if ([result length] > 0) {
          [result appendString:@" + "];
        }
      }
      if (degree == 0 || coefficient != 1) {
        [result appendFormat:@"%d", coefficient];
      }
      if (degree != 0) {
        if (degree == 1) {
          [result appendString:@"x"];
        } else {
          [result appendString:@"x^"];
          [result appendFormat:@"%d", degree];
        }
      }
    }
  }

  return result;
}

@end
