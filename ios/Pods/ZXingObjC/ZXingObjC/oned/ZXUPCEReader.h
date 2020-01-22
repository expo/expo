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

#import "ZXBarcodeFormat.h"
#import "ZXUPCEANReader.h"

extern const int ZX_UCPE_NUMSYS_AND_CHECK_DIGIT_PATTERNS[][10];
extern const int ZX_UPCE_MIDDLE_END_PATTERN_LEN;
extern const int ZX_UPCE_MIDDLE_END_PATTERN[];

/**
 * Implements decoding of the UPC-E format.
 *
 * http://www.barcodeisland.com/upce.phtml is a great reference for UPC-E information.
 */
@interface ZXUPCEReader : ZXUPCEANReader

+ (NSString *)convertUPCEtoUPCA:(NSString *)upce;

@end
