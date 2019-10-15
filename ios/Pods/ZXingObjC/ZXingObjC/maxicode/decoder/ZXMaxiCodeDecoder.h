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

@class ZXBitMatrix, ZXDecodeHints, ZXDecoderResult;

/**
 * The main class which implements MaxiCode decoding -- as opposed to locating and extracting
 * the MaxiCode from an image.
 */
@interface ZXMaxiCodeDecoder : NSObject

- (ZXDecoderResult *)decode:(ZXBitMatrix *)bits error:(NSError **)error;
- (ZXDecoderResult *)decode:(ZXBitMatrix *)bits hints:(ZXDecodeHints *)hints error:(NSError **)error;

@end
