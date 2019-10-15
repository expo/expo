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

@class ZXBitMatrix, ZXByteArray, ZXQRCodeFormatInformation, ZXQRCodeVersion;

@interface ZXQRCodeBitMatrixParser : NSObject

/**
 * @param bitMatrix ZXBitMatrix to parse
 * @return nil if dimension is not >= 21 and 1 mod 4
 */
- (id)initWithBitMatrix:(ZXBitMatrix *)bitMatrix error:(NSError **)error;

/**
 * Reads format information from one of its two locations within the QR Code.
 *
 * @return ZXFormatInformation encapsulating the QR Code's format info
 * @return nil if both format information locations cannot be parsed as
 * the valid encoding of format information
 */
- (ZXQRCodeFormatInformation *)readFormatInformationWithError:(NSError **)error;

/**
 * Reads version information from one of its two locations within the QR Code.
 *
 * @return ZXQRCodeVersion encapsulating the QR Code's version or nil
 *  if both version information locations cannot be parsed as
 *  the valid encoding of version information
 */
- (ZXQRCodeVersion *)readVersionWithError:(NSError **)error;

/**
 * Reads the bits in the ZXBitMatrix representing the finder pattern in the
 * correct order in order to reconstruct the codewords bytes contained within the
 * QR Code.
 *
 * @return bytes encoded within the QR Code or nil if the exact number of bytes expected is not read
 */
- (ZXByteArray *)readCodewordsWithError:(NSError **)error;

/**
 * Revert the mask removal done while reading the code words. The bit matrix should revert to its original state.
 */
- (void)remask;

/**
 * Prepare the parser for a mirrored operation.
 * This flag has effect only on the readFormatInformation and the
 * readVersion. Before proceeding with readCodewords the
 * mirror method should be called.
 *
 * @param mirror Whether to read version and format information mirrored.
 */
- (void)setMirror:(BOOL)mirror;

/** Mirror the bit matrix in order to attempt a second reading. */
- (void)mirror;

@end
