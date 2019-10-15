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

@class ZXByteArray, ZXDecoderResult;

/**
 * Data Matrix Codes can encode text as bits in one of several modes, and can use multiple modes
 * in one Data Matrix Code. This class decodes the bits back into text.
 *
 * See ISO 16022:2006, 5.2.1 - 5.2.9.2
 */
@interface ZXDataMatrixDecodedBitStreamParser : NSObject

+ (ZXDecoderResult *)decode:(ZXByteArray *)bytes error:(NSError **)error;

@end
