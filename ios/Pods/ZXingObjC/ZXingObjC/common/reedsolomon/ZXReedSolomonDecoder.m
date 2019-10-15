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

#import "ZXErrors.h"
#import "ZXGenericGF.h"
#import "ZXGenericGFPoly.h"
#import "ZXIntArray.h"
#import "ZXReedSolomonDecoder.h"

@interface ZXReedSolomonDecoder ()

@property (nonatomic, strong, readonly) ZXGenericGF *field;

@end

@implementation ZXReedSolomonDecoder

- (id)initWithField:(ZXGenericGF *)field {
  if (self = [super init]) {
    _field = field;
  }

  return self;
}

- (BOOL)decode:(ZXIntArray *)received twoS:(int)twoS error:(NSError **)error {
  ZXGenericGFPoly *poly = [[ZXGenericGFPoly alloc] initWithField:self.field coefficients:received];
  ZXIntArray *syndromeCoefficients = [[ZXIntArray alloc] initWithLength:twoS];
  BOOL noError = YES;
  for (int i = 0; i < twoS; i++) {
    int eval = [poly evaluateAt:[self.field exp:i + self.field.generatorBase]];
    syndromeCoefficients.array[syndromeCoefficients.length - 1 - i] = eval;
    if (eval != 0) {
      noError = NO;
    }
  }
  if (noError) {
    return YES;
  }
  ZXGenericGFPoly *syndrome = [[ZXGenericGFPoly alloc] initWithField:self.field coefficients:syndromeCoefficients];
  NSArray *sigmaOmega = [self runEuclideanAlgorithm:[self.field buildMonomial:twoS coefficient:1] b:syndrome R:twoS error:error];
  if (!sigmaOmega) {
    return NO;
  }
  ZXGenericGFPoly *sigma = sigmaOmega[0];
  ZXGenericGFPoly *omega = sigmaOmega[1];
  ZXIntArray *errorLocations = [self findErrorLocations:sigma error:error];
  if (!errorLocations) {
    return NO;
  }
  ZXIntArray *errorMagnitudes = [self findErrorMagnitudes:omega errorLocations:errorLocations];
  for (int i = 0; i < errorLocations.length; i++) {
    int position = received.length - 1 - [self.field log:errorLocations.array[i]];
    if (position < 0) {
      NSDictionary *userInfo = @{NSLocalizedDescriptionKey: @"Bad error location"};

      if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXReedSolomonError userInfo:userInfo];
      return NO;
    }
    received.array[position] = [ZXGenericGF addOrSubtract:received.array[position] b:errorMagnitudes.array[i]];
  }
  return YES;
}

- (NSArray *)runEuclideanAlgorithm:(ZXGenericGFPoly *)a b:(ZXGenericGFPoly *)b R:(int)R error:(NSError **)error {
  if (a.degree < b.degree) {
    ZXGenericGFPoly *temp = a;
    a = b;
    b = temp;
  }

  ZXGenericGFPoly *rLast = a;
  ZXGenericGFPoly *r = b;
  ZXGenericGFPoly *tLast = self.field.zero;
  ZXGenericGFPoly *t = self.field.one;

  while ([r degree] >= R / 2) {
    ZXGenericGFPoly *rLastLast = rLast;
    ZXGenericGFPoly *tLastLast = tLast;
    rLast = r;
    tLast = t;

    if ([rLast zero]) {
      NSDictionary *userInfo = @{NSLocalizedDescriptionKey: @"r_{i-1} was zero"};

      if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXReedSolomonError userInfo:userInfo];
      return nil;
    }
    r = rLastLast;
    ZXGenericGFPoly *q = [self.field zero];
    int denominatorLeadingTerm = [rLast coefficient:[rLast degree]];
    int dltInverse = [self.field inverse:denominatorLeadingTerm];

    while ([r degree] >= [rLast degree] && ![r zero]) {
      int degreeDiff = [r degree] - [rLast degree];
      int scale = [self.field multiply:[r coefficient:[r degree]] b:dltInverse];
      q = [q addOrSubtract:[self.field buildMonomial:degreeDiff coefficient:scale]];
      r = [r addOrSubtract:[rLast multiplyByMonomial:degreeDiff coefficient:scale]];
    }

    t = [[q multiply:tLast] addOrSubtract:tLastLast];

    if (r.degree >= rLast.degree) {
      @throw [NSException exceptionWithName:@"IllegalStateException"
                                     reason:@"Division algorithm failed to reduce polynomial?"
                                   userInfo:nil];
    }
  }

  int sigmaTildeAtZero = [t coefficient:0];
  if (sigmaTildeAtZero == 0) {
    NSDictionary *userInfo = @{NSLocalizedDescriptionKey: @"sigmaTilde(0) was zero"};

    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXReedSolomonError userInfo:userInfo];
    return nil;
  }

  int inverse = [self.field inverse:sigmaTildeAtZero];
  ZXGenericGFPoly *sigma = [t multiplyScalar:inverse];
  ZXGenericGFPoly *omega = [r multiplyScalar:inverse];
  return @[sigma, omega];
}

- (ZXIntArray *)findErrorLocations:(ZXGenericGFPoly *)errorLocator error:(NSError **)error {
  int numErrors = [errorLocator degree];
  if (numErrors == 1) {
    ZXIntArray *array = [[ZXIntArray alloc] initWithLength:1];
    array.array[0] = [errorLocator coefficient:1];
    return array;
  }
  ZXIntArray *result = [[ZXIntArray alloc] initWithLength:numErrors];
  int e = 0;
  for (int i = 1; i < [self.field size] && e < numErrors; i++) {
    if ([errorLocator evaluateAt:i] == 0) {
      result.array[e] = [self.field inverse:i];
      e++;
    }
  }

  if (e != numErrors) {
    NSDictionary *userInfo = @{NSLocalizedDescriptionKey: @"Error locator degree does not match number of roots"};

    if (error) *error = [[NSError alloc] initWithDomain:ZXErrorDomain code:ZXReedSolomonError userInfo:userInfo];
    return nil;
  }
  return result;
}

- (ZXIntArray *)findErrorMagnitudes:(ZXGenericGFPoly *)errorEvaluator errorLocations:(ZXIntArray *)errorLocations {
  int s = errorLocations.length;
  ZXIntArray *result = [[ZXIntArray alloc] initWithLength:s];
  ZXGenericGF *field = self.field;
  for (int i = 0; i < s; i++) {
    int xiInverse = [field inverse:errorLocations.array[i]];
    int denominator = 1;
    for (int j = 0; j < s; j++) {
      if (i != j) {
        //denominator = field.multiply(denominator,
        //    GenericGF.addOrSubtract(1, field.multiply(errorLocations[j], xiInverse)));
        // Above should work but fails on some Apple and Linux JDKs due to a Hotspot bug.
        // Below is a funny-looking workaround from Steven Parkes
        int term = [field multiply:errorLocations.array[j] b:xiInverse];
        int termPlus1 = (term & 0x1) == 0 ? term | 1 : term & ~1;
        denominator = [field multiply:denominator b:termPlus1];
      }
    }
    result.array[i] = [field multiply:[errorEvaluator evaluateAt:xiInverse] b:[field inverse:denominator]];
    if (field.generatorBase != 0) {
      result.array[i] = [field multiply:result.array[i] b:xiInverse];
    }
  }

  return result;
}

@end
