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

@class ZXBinarizer, ZXBitArray, ZXBitMatrix;

/**
 * This class is the core bitmap class used by ZXing to represent 1 bit data. Reader objects
 * accept a BinaryBitmap and attempt to decode it.
 */
@interface ZXBinaryBitmap : NSObject

/**
 * @return The width of the bitmap.
 */
@property (nonatomic, readonly) int width;

/**
 * @return The height of the bitmap.
 */
@property (nonatomic, readonly) int height;

/**
 * @return Whether this bitmap can be cropped.
 */
@property (nonatomic, readonly) BOOL cropSupported;

/**
 * @return Whether this bitmap supports counter-clockwise rotation.
 */
@property (nonatomic, readonly) BOOL rotateSupported;

- (id)initWithBinarizer:(ZXBinarizer *)binarizer;

+ (id)binaryBitmapWithBinarizer:(ZXBinarizer *)binarizer;

/**
 * Converts one row of luminance data to 1 bit data. May actually do the conversion, or return
 * cached data. Callers should assume this method is expensive and call it as seldom as possible.
 * This method is intended for decoding 1D barcodes and may choose to apply sharpening.
 *
 * @param y The row to fetch, which must be in [0, bitmap height)
 * @param row An optional preallocated array. If null or too small, it will be ignored.
 *            If used, the Binarizer will call BitArray.clear(). Always use the returned object.
 * @return The array of bits for this row (true means black) or nil if row can't be binarized.
 */
- (ZXBitArray *)blackRow:(int)y row:(ZXBitArray *)row error:(NSError **)error;

/**
 * Converts a 2D array of luminance data to 1 bit. As above, assume this method is expensive
 * and do not call it repeatedly. This method is intended for decoding 2D barcodes and may or
 * may not apply sharpening. Therefore, a row from this matrix may not be identical to one
 * fetched using getBlackRow(), so don't mix and match between them.
 *
 * @return The 2D array of bits for the image (true means black) or nil if image can't be binarized
 *   to make a matrix.
 */
- (ZXBitMatrix *)blackMatrixWithError:(NSError **)error;

/**
 * Returns a new object with cropped image data. Implementations may keep a reference to the
 * original data rather than a copy. Only callable if isCropSupported() is true.
 *
 * @param left The left coordinate, which must be in [0,getWidth())
 * @param top The top coordinate, which must be in [0,getHeight())
 * @param width The width of the rectangle to crop.
 * @param height The height of the rectangle to crop.
 * @return A cropped version of this object.
 */
- (ZXBinaryBitmap *)crop:(int)left top:(int)top width:(int)width height:(int)height;

/**
 * Returns a new object with rotated image data by 90 degrees counterclockwise.
 * Only callable if `rotateSupported` is true.
 *
 * @return A rotated version of this object.
 */
- (ZXBinaryBitmap *)rotateCounterClockwise;

/**
 * Returns a new object with rotated image data by 45 degrees counterclockwise.
 * Only callable if `rotateSupported` is true.
 *
 * @return A rotated version of this object.
 */
- (ZXBinaryBitmap *)rotateCounterClockwise45;

@end
