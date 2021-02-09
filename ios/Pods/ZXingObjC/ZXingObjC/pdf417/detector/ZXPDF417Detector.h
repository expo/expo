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

@class ZXBinaryBitmap, ZXBitArray, ZXBitMatrix, ZXDecodeHints, ZXPDF417DetectorResult;

/**
 * Encapsulates logic that can detect a PDF417 Code in an image, even if the
 * PDF417 Code is rotated or skewed, or partially obscured.
 */
@interface ZXPDF417Detector : NSObject

/**
 * Detects a PDF417 Code in an image. Only checks 0 and 180 degree rotations.
 *
 * @param image barcode image to decode
 * @param hints optional hints to detector
 * @param multiple if true, then the image is searched for multiple codes. If false, then at most one code will
 * be found and returned
 * @return ZXPDF417DetectorResult encapsulating results of detecting a PDF417 code or nil
 *  if no PDF417 Code can be found
 */
+ (ZXPDF417DetectorResult *)detect:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints multiple:(BOOL)multiple error:(NSError **)error;

@end
