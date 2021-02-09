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

@class ZXPDF417BarcodeMatrix, ZXIntArray;

/**
 * Top-level class for the logic part of the PDF417 implementation.
 */
@interface ZXPDF417 : NSObject

@property (nonatomic, strong, readonly) ZXPDF417BarcodeMatrix *barcodeMatrix;
@property (nonatomic, assign) BOOL compact;
@property (nonatomic, assign) ZXPDF417Compaction compaction;
@property (nonatomic, assign) NSStringEncoding encoding;

- (id)initWithCompact:(BOOL)compact;

/**
 * @param msg message to encode
 * @param errorCorrectionLevel PDF417 error correction level to use or nil if the contents cannot be
 *   encoded in this format
 */
- (BOOL)generateBarcodeLogic:(NSString *)msg errorCorrectionLevel:(int)errorCorrectionLevel error:(NSError **)error;

/**
 * Determine optimal nr of columns and rows for the specified number of
 * codewords.
 *
 * @param sourceCodeWords number of code words
 * @param errorCorrectionCodeWords number of error correction code words
 * @return dimension object containing cols as width and rows as height
 */
- (ZXIntArray *)determineDimensions:(int)sourceCodeWords errorCorrectionCodeWords:(int)errorCorrectionCodeWords error:(NSError **)error;

/**
 * Sets max/min row/col values
 *
 * @param maxCols maximum allowed columns
 * @param minCols minimum allowed columns
 * @param maxRows maximum allowed rows
 * @param minRows minimum allowed rows
 */
- (void)setDimensionsWithMaxCols:(int)maxCols minCols:(int)minCols maxRows:(int)maxRows minRows:(int)minRows;

@end
