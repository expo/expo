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

#import "ZXEncodeHints.h"

extern const NSStringEncoding ZX_PDF417_DEFAULT_ENCODING;

/**
 * PDF417 high-level encoder following the algorithm described in ISO/IEC 15438:2001(E) in
 * annex P.
 */
@interface ZXPDF417HighLevelEncoder : NSObject

/**
 * Performs high-level encoding of a PDF417 message using the algorithm described in annex P
 * of ISO/IEC 15438:2001(E). If byte compaction has been selected, then only byte compaction
 * is used.
 *
 * @param msg the message
 * @return the encoded message (the char values range from 0 to 928)
 */
+ (NSString *)encodeHighLevel:(NSString *)msg compaction:(ZXPDF417Compaction)compaction encoding:(NSStringEncoding)encoding error:(NSError **)error;

@end
