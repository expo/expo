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

extern const int ZX_CODE128_CODE_PATTERNS[][7];

extern const int ZX_CODE128_CODE_START_A;
extern const int ZX_CODE128_CODE_START_B;
extern const int ZX_CODE128_CODE_START_C;
extern const int ZX_CODE128_CODE_CODE_A;
extern const int ZX_CODE128_CODE_CODE_B;
extern const int ZX_CODE128_CODE_CODE_C;
extern const int ZX_CODE128_CODE_STOP;

extern const int ZX_CODE128_CODE_FNC_1;
extern const int ZX_CODE128_CODE_FNC_2;
extern const int ZX_CODE128_CODE_FNC_3;
extern const int ZX_CODE128_CODE_FNC_4_A;
extern const int ZX_CODE128_CODE_FNC_4_B;

@class ZXDecodeHints, ZXResult;

/**
 * Decodes Code 128 barcodes.
 */
@interface ZXCode128Reader : ZXOneDReader

@end
