/*
 * Copyright 2013 ZXing authors
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

@class ZXBitMatrix, ZXDecoderResult, ZXResultPoint;

@interface ZXPDF417ScanningDecoder : NSObject

+ (ZXDecoderResult *)decode:(ZXBitMatrix *)image
               imageTopLeft:(ZXResultPoint *)imageTopLeft
            imageBottomLeft:(ZXResultPoint *)imageBottomLeft
              imageTopRight:(ZXResultPoint *)imageTopRight
           imageBottomRight:(ZXResultPoint *)imageBottomRight
           minCodewordWidth:(int)minCodewordWidth
           maxCodewordWidth:(int)maxCodewordWidth
                      error:(NSError **)error;
- (NSString *)description:(NSArray *)barcodeMatrix;

@end
