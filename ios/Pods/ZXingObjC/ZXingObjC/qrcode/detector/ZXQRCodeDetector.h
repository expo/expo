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

@class ZXBitMatrix, ZXDecodeHints, ZXDetectorResult, ZXPerspectiveTransform, ZXQRCodeAlignmentPattern, ZXQRCodeFinderPatternInfo, ZXResultPoint;
@protocol ZXResultPointCallback;

/**
 * Encapsulates logic that can detect a QR Code in an image, even if the QR Code
 * is rotated or skewed, or partially obscured.
 */
@interface ZXQRCodeDetector : NSObject

@property (nonatomic, strong, readonly) ZXBitMatrix *image;
@property (nonatomic, weak, readonly) id <ZXResultPointCallback> resultPointCallback;

- (id)initWithImage:(ZXBitMatrix *)image;

/**
 * Detects a QR Code in an image.
 *
 * @return ZXDetectorResult encapsulating results of detecting a QR Code or nil if:
 *   - no QR Code can be found
 *   - a QR Code cannot be decoded
 */
- (ZXDetectorResult *)detectWithError:(NSError **)error;

/**
 * Detects a QR Code in an image.
 *
 * @param hints optional hints to detector
 * @return ZXDetectorResult encapsulating results of detecting a QR Code or nil if:
 *   - QR Code cannot be found
 *   - a QR Code cannot be decoded
 */
- (ZXDetectorResult *)detect:(ZXDecodeHints *)hints error:(NSError **)error;

- (ZXDetectorResult *)processFinderPatternInfo:(ZXQRCodeFinderPatternInfo *)info error:(NSError **)error;

/**
 * Computes an average estimated module size based on estimated derived from the positions
 * of the three finder patterns.
 *
 * @param topLeft detected top-left finder pattern center
 * @param topRight detected top-right finder pattern center
 * @param bottomLeft detected bottom-left finder pattern center
 * @return estimated module size
 */
- (float)calculateModuleSize:(ZXResultPoint *)topLeft topRight:(ZXResultPoint *)topRight bottomLeft:(ZXResultPoint *)bottomLeft;

/**
 * Attempts to locate an alignment pattern in a limited region of the image, which is
 * guessed to contain it. This method uses ZXAlignmentPattern.
 *
 * @param overallEstModuleSize estimated module size so far
 * @param estAlignmentX x coordinate of center of area probably containing alignment pattern
 * @param estAlignmentY y coordinate of above
 * @param allowanceFactor number of pixels in all directions to search from the center
 * @return ZXAlignmentPattern if found, or nil if an unexpected error occurs during detection
 */
- (ZXQRCodeAlignmentPattern *)findAlignmentInRegion:(float)overallEstModuleSize estAlignmentX:(int)estAlignmentX estAlignmentY:(int)estAlignmentY allowanceFactor:(float)allowanceFactor error:(NSError **)error;

@end
