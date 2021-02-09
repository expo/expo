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

@class ZXGenericGFPoly;

/**
 * This class contains utility methods for performing mathematical operations over
 * the Galois Fields. Operations use a given primitive polynomial in calculations.
 *
 * Throughout this package, elements of the GF are represented as an int
 * for convenience and speed (but at the cost of memory).
 */
@interface ZXGenericGF : NSObject

@property (nonatomic, strong, readonly) ZXGenericGFPoly *zero;
@property (nonatomic, strong, readonly) ZXGenericGFPoly *one;
@property (nonatomic, assign, readonly) int32_t size;
@property (nonatomic, assign, readonly) int32_t generatorBase;

+ (ZXGenericGF *)AztecData12;
+ (ZXGenericGF *)AztecData10;
+ (ZXGenericGF *)AztecData6;
+ (ZXGenericGF *)AztecParam;
+ (ZXGenericGF *)QrCodeField256;
+ (ZXGenericGF *)DataMatrixField256;
+ (ZXGenericGF *)AztecData8;
+ (ZXGenericGF *)MaxiCodeField64;

/**
 * Create a representation of GF(size) using the given primitive polynomial.
 *
 * @param primitive irreducible polynomial whose coefficients are represented by
 *  the bits of an int, where the least-significant bit represents the constant
 *  coefficient
 * @param size the size of the field
 * @param b the factor b in the generator polynomial can be 0- or 1-based
 *  (g(x) = (x+a^b)(x+a^(b+1))...(x+a^(b+2t-1))).
 *  In most cases it should be 1, but for QR code it is 0.
 */
- (id)initWithPrimitive:(int)primitive size:(int)size b:(int)b;

/**
 * @return the monomial representing coefficient * x^degree
 */
- (ZXGenericGFPoly *)buildMonomial:(int)degree coefficient:(int)coefficient;

/**
 * Implements both addition and subtraction -- they are the same in GF(size).
 *
 * @return sum/difference of a and b
 */
+ (int32_t)addOrSubtract:(int32_t)a b:(int32_t)b;

/**
 * @return 2 to the power of a in GF(size)
 */
- (int32_t)exp:(int)a;

/**
 * @return base 2 log of a in GF(size)
 */
- (int32_t)log:(int)a;

/**
 * @return multiplicative inverse of a
 */
- (int32_t)inverse:(int)a;

/**
 * @return product of a and b in GF(size)
 */
- (int32_t)multiply:(int)a b:(int)b;

@end
