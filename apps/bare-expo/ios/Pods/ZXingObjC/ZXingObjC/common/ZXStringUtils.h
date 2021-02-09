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

@class ZXByteArray, ZXDecodeHints;

/**
 * Common string-related functions.
 */
@interface ZXStringUtils : NSObject

/**
 * @param bytes bytes encoding a string, whose encoding should be guessed
 * @param hints decode hints if applicable
 * @return name of guessed encoding; at the moment will only guess one of:
 *  NSShiftJISStringEncoding, NSUTF8StringEncoding, NSISOLatin1StringEncoding, or the platform
 *  default encoding if none of these can possibly be correct
 */
+ (NSStringEncoding)guessEncoding:(ZXByteArray *)bytes hints:(ZXDecodeHints *)hints;

@end
