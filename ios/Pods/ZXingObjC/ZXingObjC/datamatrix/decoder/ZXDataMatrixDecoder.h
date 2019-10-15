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

@class ZXBitMatrix, ZXDecoderResult, ZXReedSolomonDecoder;

/**
 * The main class which implements Data Matrix Code decoding -- as opposed to locating and extracting
 * the Data Matrix Code from an image.
 */
@interface ZXDataMatrixDecoder : NSObject

/**
 * Convenience method that can decode a Data Matrix Code represented as a 2D array of booleans.
 * "true" is taken to mean a black module.
 *
 * @param image booleans representing white/black Data Matrix Code modules
 * @return text and bytes encoded within the Data Matrix Code
 * @return nil if the Data Matrix Code cannot be decoded
 * @return nil if error correction fails
 */
- (ZXDecoderResult *)decode:(NSArray *)image error:(NSError **)error;

/**
 * Decodes a Data Matrix Code represented as a ZXBitMatrix. A 1 or "true" is taken
 * to mean a black module.
 *
 * @param bits booleans representing white/black Data Matrix Code modules
 * @return text and bytes encoded within the Data Matrix Code
 * @return nil if the Data Matrix Code cannot be decoded
 * @return nil if error correction fails
 */
- (ZXDecoderResult *)decodeMatrix:(ZXBitMatrix *)bits error:(NSError **)error;

@end
