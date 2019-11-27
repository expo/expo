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

#define ZX_PDF417_SYMBOL_TABLE_LEN 2787
extern const int ZX_PDF417_SYMBOL_TABLE[];

extern const int ZX_PDF417_NUMBER_OF_CODEWORDS;
extern const int ZX_PDF417_MIN_ROWS_IN_BARCODE;
extern const int ZX_PDF417_MAX_ROWS_IN_BARCODE;
extern const int ZX_PDF417_MAX_CODEWORDS_IN_BARCODE;
extern const int ZX_PDF417_MODULES_IN_CODEWORD;
extern const int ZX_PDF417_MODULES_IN_STOP_PATTERN;
#define ZX_PDF417_BARS_IN_MODULE 8

@class ZXIntArray;

@interface ZXPDF417Common : NSObject

+ (int)bitCountSum:(NSArray *)moduleBitCount;
+ (ZXIntArray *)toIntArray:(NSArray *)list;

/**
 * @param symbol encoded symbol to translate to a codeword
 * @return the codeword corresponding to the symbol.
 */
+ (int)codeword:(int)symbol;

@end
