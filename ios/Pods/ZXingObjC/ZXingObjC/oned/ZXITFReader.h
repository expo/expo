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

#import "ZXOneDReader.h"

/**
 * Implements decoding of the ITF format, or Interleaved Two of Five.
 *
 * This Reader will scan ITF barcodes of certain lengths only.
 * At the moment it reads length 6, 8, 10, 12, 14, 16, 18, 20, 24, and 44 as these have appeared "in the wild". Not all
 * lengths are scanned, especially shorter ones, to avoid false positives. This in turn is due to a lack of
 * required checksum function.
 *
 * The checksum is optional and is not applied by this Reader. The consumer of the decoded
 * value will have to apply a checksum if required.
 *
 * http://en.wikipedia.org/wiki/Interleaved_2_of_5 is a great reference for Interleaved 2 of 5 information.
 */
@interface ZXITFReader : ZXOneDReader

- (ZXIntArray *)decodeStart:(ZXBitArray *)row;
- (ZXIntArray *)decodeEnd:(ZXBitArray *)row;

@end
