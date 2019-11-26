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

@interface ZXGenericGFPoly ()

@property (nonatomic, strong, readonly) ZXGenericGF *field;

@end

@implementation ZXGenericGFPoly

- (id)initWithField:(ZXGenericGF *)field coefficients:(ZXIntArray *)coefficients {
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

- (int)degree {
  return self.coefficients.length - 1;
}

- (BOOL)zero {
  return self.coefficients.array[0] == 0;
}

- (int)coefficient:(int)degree {
  return self.coefficients.array[self.coefficients.length - 1 - degree];
}

- (int)evaluateAt:(int)a {
  if (a == 0) {
    return [self coefficient:0];
  }
  int size = self.coefficients.length;
  int32_t *coefficients = self.coefficients.array;
  ZXGenericGF *field = self.field;
  if (a == 1) {
    // Just the sum of the coefficients
    int result = 0;
    for (int i = 0; i < size; i++) {
      result = [ZXGenericGF addOrSubtract:result b:coefficients[i]];
    }
    return result;
  }
  int result = coefficients[0];
  for (int i = 1; i < size; i++) {
    result = [ZXGenericGF addOrSubtract:[field multiply:a b:result] b:coefficients[i]];
  }
  return result;
}

- (ZXGenericGFPoly *)addOrSubtract:(ZXGenericGFPoly *)other {
  if (![self.field isEqual:other.field]) {
    [NSException raise:NSInvalidArgumentException format:@"ZXGenericGFPolys do not have same ZXGenericGF field"];
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
    sumDiff.array[i] = [ZXGenericGF addOrSubtract:smallerCoefficients.array[i - lengthDiff] b:largerCoefficients.array[i]];
  }

  return [[ZXGenericGFPoly alloc] initWithField:self.field coefficients:sumDiff];
}

- (ZXGenericGFPoly *)multiply:(ZXGenericGFPoly *)other {
  ZXGenericGF *field = self.field;
  if (![self.field isEqual:other.field]) {
    [NSException raise:NSInvalidArgumentException format:@"ZXGenericGFPolys do not have same GenericGF field"];
  }
  if (self.zero || other.zero) {
    return field.zero;
  }
  ZXIntArray *aCoefficients = self.coefficients;
  int aLength = aCoefficients.length;
  ZXIntArray *bCoefficients = other.coefficients;
  int bLength = bCoefficients.length;
  ZXIntArray *product = [[ZXIntArray alloc] initWithLength:aLength + bLength - 1];
  for (int i = 0; i < aLength; i++) {
    int aCoeff = aCoefficients.array[i];
    for (int j = 0; j < bLength; j++) {
      product.array[i + j] = [ZXGenericGF addOrSubtract:product.array[i + j]
                                                      b:[field multiply:aCoeff b:bCoefficients.array[j]]];
    }
  }
  return [[ZXGenericGFPoly alloc] initWithField:field coefficients:product];
}

- (ZXGenericGFPoly *)multiplyScalar:(int)scalar {
  if (scalar == 0) {
    return self.field.zero;
  }
  if (scalar == 1) {
    return self;
  }
  int size = self.coefficients.length;
  int32_t *coefficients = self.coefficients.array;
  ZXIntArray *product = [[ZXIntArray alloc] initWithLength:size];
  for (int i = 0; i < size; i++) {
    product.array[i] = [self.field multiply:coefficients[i] b:scalar];
  }
  return [[ZXGenericGFPoly alloc] initWithField:self.field coefficients:product];
}

- (ZXGenericGFPoly *)multiplyByMonomial:(int)degree coefficient:(int)coefficient {
  if (degree < 0) {
    [NSException raise:NSInvalidArgumentException format:@"Degree must be greater than 0."];
  }
  if (coefficient == 0) {
    return self.field.zero;
  }
  int size = self.coefficients.length;
  int32_t *coefficients = self.coefficients.array;
  ZXGenericGF *field = self.field;
  ZXIntArray *product = [[ZXIntArray alloc] initWithLength:size + degree];
  for (int i = 0; i < size; i++) {
    product.array[i] = [field multiply:coefficients[i] b:coefficient];
  }

  return [[ZXGenericGFPoly alloc] initWithField:field coefficients:product];
}

- (NSArray *)divide:(ZXGenericGFPoly *)other {
  if (![self.field isEqual:other.field]) {
    [NSException raise:NSInvalidArgumentException format:@"ZXGenericGFPolys do not have same ZXGenericGF field"];
  }
  if (other.zero) {
    [NSException raise:NSInvalidArgumentException format:@"Divide by 0"];
  }

  ZXGenericGFPoly *quotient = self.field.zero;
  ZXGenericGFPoly *remainder = self;

  int denominatorLeadingTerm = [other coefficient:other.degree];
  int inverseDenominatorLeadingTerm = [self.field inverse:denominatorLeadingTerm];

  ZXGenericGF *field = self.field;
  while ([remainder degree] >= other.degree && !remainder.zero) {
    int degreeDifference = remainder.degree - other.degree;
    int scale = [field multiply:[remainder coefficient:remainder.degree] b:inverseDenominatorLeadingTerm];
    ZXGenericGFPoly *term = [other multiplyByMonomial:degreeDifference coefficient:scale];
    ZXGenericGFPoly *iterationQuotient = [field buildMonomial:degreeDifference coefficient:scale];
    quotient = [quotient addOrSubtract:iterationQuotient];
    remainder = [remainder addOrSubtract:term];
  }

  return @[quotient, remainder];
}

- (NSString *)description {
  if (self.zero) {
    return @"0";
  }
  NSMutableString *result = [NSMutableString stringWithCapacity:8 * [self degree]];
  for (int degree = [self degree]; degree >= 0; degree--) {
    int coefficient = [self coefficient:degree];
    if (coefficient != 0) {
      if (coefficient < 0) {
        if (degree == [self degree]) {
          [result appendString:@"-"];
        } else {
          [result appendString:@" - "];
        }
        coefficient = -coefficient;
      } else {
        if ([result length] > 0) {
          [result appendString:@" + "];
        }
      }
      if (degree == 0 || coefficient != 1) {
        int alphaPower = [self.field log:coefficient];
        if (alphaPower == 0) {
          [result appendString:@"1"];
        } else if (alphaPower == 1) {
          [result appendString:@"a"];
        } else {
          [result appendString:@"a^"];
          [result appendFormat:@"%d", alphaPower];
        }
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
