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

@class ZXBitArray, ZXByteMatrix, ZXQRCodeErrorCorrectionLevel, ZXQRCodeVersion;

@interface ZXQRCodeMatrixUtil : NSObject

// Set all cells to -1.  -1 means that the cell is empty (not set yet).
+ (void)clearMatrix:(ZXByteMatrix *)matrix;

// Build 2D matrix of QR Code from "dataBits" with "ecLevel", "version" and "getMaskPattern". On
// success, store the result in "matrix" and return true.
+ (BOOL)buildMatrix:(ZXBitArray *)dataBits ecLevel:(ZXQRCodeErrorCorrectionLevel *)ecLevel version:(ZXQRCodeVersion *)version maskPattern:(int)maskPattern matrix:(ZXByteMatrix *)matrix error:(NSError **)error;

// Embed basic patterns. On success, modify the matrix and return true.
// The basic patterns are:
// - Position detection patterns
// - Timing patterns
// - Dark dot at the left bottom corner
// - Position adjustment patterns, if need be
+ (BOOL)embedBasicPatterns:(ZXQRCodeVersion *)version matrix:(ZXByteMatrix *)matrix error:(NSError **)error;

// Embed type information. On success, modify the matrix.
+ (BOOL)embedTypeInfo:(ZXQRCodeErrorCorrectionLevel *)ecLevel maskPattern:(int)maskPattern matrix:(ZXByteMatrix *)matrix error:(NSError **)error;

// Embed version information if need be. On success, modify the matrix and return true.
// See 8.10 of JISX0510:2004 (p.47) for how to embed version information.
+ (BOOL)maybeEmbedVersionInfo:(ZXQRCodeVersion *)version matrix:(ZXByteMatrix *)matrix error:(NSError **)error;

// Embed "dataBits" using "getMaskPattern". On success, modify the matrix and return true.
// For debugging purposes, it skips masking process if "getMaskPattern" is -1.
// See 8.7 of JISX0510:2004 (p.38) for how to embed data bits.
+ (BOOL)embedDataBits:(ZXBitArray *)dataBits maskPattern:(int)maskPattern matrix:(ZXByteMatrix *)matrix error:(NSError **)error;

// Return the position of the most significant bit set (to one) in the "value". The most
// significant bit is position 32. If there is no bit set, return 0. Examples:
// - findMSBSet(0) => 0
// - findMSBSet(1) => 1
// - findMSBSet(255) => 8
+ (int)findMSBSet:(int)value;

// Calculate BCH (Bose-Chaudhuri-Hocquenghem) code for "value" using polynomial "poly". The BCH
// code is used for encoding type information and version information.
// Example: Calculation of version information of 7.
// f(x) is created from 7.
//   - 7 = 000111 in 6 bits
//   - f(x) = x^2 + x^1 + x^0
// g(x) is given by the standard (p. 67)
//   - g(x) = x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1
// Multiply f(x) by x^(18 - 6)
//   - f'(x) = f(x) * x^(18 - 6)
//   - f'(x) = x^14 + x^13 + x^12
// Calculate the remainder of f'(x) / g(x)
//         x^2
//         __________________________________________________
//   g(x) )x^14 + x^13 + x^12
//         x^14 + x^13 + x^12 + x^11 + x^10 + x^7 + x^4 + x^2
//         --------------------------------------------------
//                              x^11 + x^10 + x^7 + x^4 + x^2
//
// The remainder is x^11 + x^10 + x^7 + x^4 + x^2
// Encode it in binary: 110010010100
// The return value is 0xc94 (1100 1001 0100)
//
// Since all coefficients in the polynomials are 1 or 0, we can do the calculation by bit
// operations. We don't care if cofficients are positive or negative.
+ (int)calculateBCHCode:(int)value poly:(int)poly;

// Make bit vector of type information. On success, store the result in "bits" and return true.
// Encode error correction level and mask pattern. See 8.9 of
// JISX0510:2004 (p.45) for details.
+ (BOOL)makeTypeInfoBits:(ZXQRCodeErrorCorrectionLevel *)ecLevel maskPattern:(int)maskPattern bits:(ZXBitArray *)bits error:(NSError **)error;

// Make bit vector of version information. On success, store the result in "bits" and return true.
// See 8.10 of JISX0510:2004 (p.45) for details.
+ (BOOL)makeVersionInfoBits:(ZXQRCodeVersion *)version bits:(ZXBitArray *)bits error:(NSError **)error;

@end
