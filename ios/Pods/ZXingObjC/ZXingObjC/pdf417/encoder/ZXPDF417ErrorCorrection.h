/*
 * Copyright 2006 Jeremias Maerki in part, and ZXing Authors in part
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * PDF417 error correction code following the algorithm described in ISO/IEC 15438:2001(E) in
 * chapter 4.10.
 */
@interface ZXPDF417ErrorCorrection : NSObject

/**
 * Determines the number of error correction codewords for a specified error correction
 * level.
 *
 * @param errorCorrectionLevel the error correction level (0-8)
 * @return the number of codewords generated for error correction
 */

+ (int)errorCorrectionCodewordCount:(int)errorCorrectionLevel;

/**
 * Returns the recommended minimum error correction level as described in annex E of
 * ISO/IEC 15438:2001(E).
 *
 * @param n the number of data codewords
 * @return the recommended minimum error correction level
 */
+ (int)recommendedMinimumErrorCorrectionLevel:(int)n error:(NSError **)error;

/**
 * Generates the error correction codewords according to 4.10 in ISO/IEC 15438:2001(E).
 *
 * @param dataCodewords        the data codewords
 * @param errorCorrectionLevel the error correction level (0-8)
 * @return the String representing the error correction codewords
 */
+ (NSString *)generateErrorCorrection:(NSString *)dataCodewords errorCorrectionLevel:(int)errorCorrectionLevel;

@end
