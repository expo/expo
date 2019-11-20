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
#import "ZXPDF417ECErrorCorrection.h"

@interface ZXPDF417ECErrorCorrection ()

@property (nonatomic, strong, readonly) ZXModulusGF *field;

@end

@implementation ZXPDF417ECErrorCorrection

- (id)init {
  if (self = [super init]) {
    _field = [ZXModulusGF PDF417_GF];
  }

  return self;
}

- (int)decode:(ZXIntArray *)received numECCodewords:(int)numECCodewords erasures:(ZXIntArray *)erasures {
  ZXModulusPoly *poly = [[ZXModulusPoly alloc] initWithField:self.field coefficients:received];
  ZXIntArray *S = [[ZXIntArray alloc] initWithLength:numECCodewords];
  BOOL error = NO;
  for (int i = numECCodewords; i > 0; i--) {
    int eval = [poly evaluateAt:[self.field exp:i]];
    S.array[numECCodewords - i] = eval;
    if (eval != 0) {
      error = YES;
    }
  }

  if (!error) {
    return 0;
  }

  ZXModulusPoly *knownErrors = self.field.one;
  if (erasures) {
    for (int i = 0; i < erasures.length; i++) {
      int erasure = erasures.array[i];
      int b = [self.field exp:received.length - 1 - erasure];
      // Add (1 - bx) term:
      ZXModulusPoly *term = [[ZXModulusPoly alloc] initWithField:self.field coefficients:[[ZXIntArray alloc] initWithInts:[self.field subtract:0 b:b], 1, -1]];
      knownErrors = [knownErrors multiply:term];
    }
  }

  ZXModulusPoly *syndrome = [[ZXModulusPoly alloc] initWithField:self.field coefficients:S];
  //[syndrome multiply:knownErrors];

  NSArray *sigmaOmega = [self runEuclideanAlgorithm:[self.field buildMonomial:numECCodewords coefficient:1] b:syndrome R:numECCodewords];
  if (!sigmaOmega) {
    return -1;
  }

  ZXModulusPoly *sigma = sigmaOmega[0];
  ZXModulusPoly *omega = sigmaOmega[1];

  //sigma = [sigma multiply:knownErrors];

  ZXIntArray *errorLocations = [self findErrorLocations:sigma];
  if (!errorLocations) {
    return -1;
  }
  ZXIntArray *errorMagnitudes = [self findErrorMagnitudes:omega errorLocator:sigma errorLocations:errorLocations];

  for (int i = 0; i < errorLocations.length; i++) {
    int position = received.length - 1 - [self.field log:errorLocations.array[i]];
    if (position < 0) {
      return -1;
    }
    received.array[position] = [self.field subtract:received.array[position] b:errorMagnitudes.array[i]];
  }

  return errorLocations.length;
}

- (NSArray *)runEuclideanAlgorithm:(ZXModulusPoly *)a b:(ZXModulusPoly *)b R:(int)R {
  // Assume a's degree is >= b's
  if (a.degree < b.degree) {
    ZXModulusPoly *temp = a;
    a = b;
    b = temp;
  }

  ZXModulusPoly *rLast = a;
  ZXModulusPoly *r = b;
  ZXModulusPoly *tLast = self.field.zero;
  ZXModulusPoly *t = self.field.one;

  // Run Euclidean algorithm until r's degree is less than R/2
  while (r.degree >= R / 2) {
    ZXModulusPoly *rLastLast = rLast;
    ZXModulusPoly *tLastLast = tLast;
    rLast = r;
    tLast = t;

    // Divide rLastLast by rLast, with quotient in q and remainder in r
    if (rLast.zero) {
      // Oops, Euclidean algorithm already terminated?
      return nil;
    }
    r = rLastLast;
    ZXModulusPoly *q = self.field.zero;
    int denominatorLeadingTerm = [rLast coefficient:rLast.degree];
    int dltInverse = [self.field inverse:denominatorLeadingTerm];
    while (r.degree >= rLast.degree && !r.zero) {
      int degreeDiff = r.degree - rLast.degree;
      int scale = [self.field multiply:[r coefficient:r.degree] b:dltInverse];
      q = [q add:[self.field buildMonomial:degreeDiff coefficient:scale]];
      r = [r subtract:[rLast multiplyByMonomial:degreeDiff coefficient:scale]];
    }

    t = [[[q multiply:tLast] subtract:tLastLast] negative];
  }

  int sigmaTildeAtZero = [t coefficient:0];
  if (sigmaTildeAtZero == 0) {
    return nil;
  }

  int inverse = [self.field inverse:sigmaTildeAtZero];
  ZXModulusPoly *sigma = [t multiplyScalar:inverse];
  ZXModulusPoly *omega = [r multiplyScalar:inverse];
  return @[sigma, omega];
}

- (ZXIntArray *)findErrorLocations:(ZXModulusPoly *)errorLocator {
  // This is a direct application of Chien's search
  int numErrors = errorLocator.degree;
  ZXIntArray *result = [[ZXIntArray alloc] initWithLength:numErrors];
  int e = 0;
  for (int i = 1; i < self.field.size && e < numErrors; i++) {
    if ([errorLocator evaluateAt:i] == 0) {
      result.array[e] = [self.field inverse:i];
      e++;
    }
  }
  if (e != numErrors) {
    return nil;
  }
  return result;
}

- (ZXIntArray *)findErrorMagnitudes:(ZXModulusPoly *)errorEvaluator errorLocator:(ZXModulusPoly *)errorLocator errorLocations:(ZXIntArray *)errorLocations {
  int errorLocatorDegree = errorLocator.degree;
  ZXIntArray *formalDerivativeCoefficients = [[ZXIntArray alloc] initWithLength:errorLocatorDegree];
  for (int i = 1; i <= errorLocatorDegree; i++) {
    formalDerivativeCoefficients.array[errorLocatorDegree - i] =
      [self.field multiply:i b:[errorLocator coefficient:i]];
  }
  ZXModulusPoly *formalDerivative = [[ZXModulusPoly alloc] initWithField:self.field coefficients:formalDerivativeCoefficients];

  // This is directly applying Forney's Formula
  int s = errorLocations.length;
  ZXIntArray *result = [[ZXIntArray alloc] initWithLength:s];
  for (int i = 0; i < s; i++) {
    int xiInverse = [self.field inverse:errorLocations.array[i]];
    int numerator = [self.field subtract:0 b:[errorEvaluator evaluateAt:xiInverse]];
    int denominator = [self.field inverse:[formalDerivative evaluateAt:xiInverse]];
    result.array[i] = [self.field multiply:numerator b:denominator];
  }
  return result;
}

@end
