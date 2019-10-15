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

@class ZXQRCodeErrorCorrectionLevel;

/**
 * Encapsulates a QR Code's format information, including the data mask used and
 * error correction level.
 */
@interface ZXQRCodeFormatInformation : NSObject

@property (nonatomic, strong, readonly) ZXQRCodeErrorCorrectionLevel *errorCorrectionLevel;
@property (nonatomic, assign, readonly) int8_t dataMask;

+ (int)numBitsDiffering:(int)a b:(int)b;

/**
 * @param maskedFormatInfo1 format info indicator, with mask still applied
 * @param maskedFormatInfo2 second copy of same info; both are checked at the same time
 *  to establish best match
 * @return information about the format it specifies, or {@code null}
 *  if doesn't seem to match any known pattern
 */
+ (ZXQRCodeFormatInformation *)decodeFormatInformation:(int)maskedFormatInfo1 maskedFormatInfo2:(int)maskedFormatInfo2;

@end
