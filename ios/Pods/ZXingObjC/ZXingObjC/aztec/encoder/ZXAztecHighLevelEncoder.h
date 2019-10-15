/*
 * Copyright 2014 ZXing authors
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

extern NSArray *ZX_AZTEC_MODE_NAMES;

extern const int ZX_AZTEC_MODE_UPPER;
extern const int ZX_AZTEC_MODE_LOWER;
extern const int ZX_AZTEC_MODE_DIGIT;
extern const int ZX_AZTEC_MODE_MIXED;
extern const int ZX_AZTEC_MODE_PUNCT;

extern const int ZX_AZTEC_LATCH_TABLE[][5];

#define ZX_AZTEC_SHIFT_TABLE_SIZE 6
extern int ZX_AZTEC_SHIFT_TABLE[ZX_AZTEC_SHIFT_TABLE_SIZE][ZX_AZTEC_SHIFT_TABLE_SIZE];

@class ZXBitArray, ZXByteArray;

/**
 * This produces nearly optimal encodings of text into the first-level of
 * encoding used by Aztec code.
 *
 * It uses a dynamic algorithm.  For each prefix of the string, it determines
 * a set of encodings that could lead to this prefix.  We repeatedly add a
 * character and generate a new set of optimal encodings until we have read
 * through the entire input.
 */
@interface ZXAztecHighLevelEncoder : NSObject

- (id)initWithText:(ZXByteArray *)text;

/**
 * @return text represented by this encoder encoded as a ZXBitArray
 */
- (ZXBitArray *)encode;

@end
