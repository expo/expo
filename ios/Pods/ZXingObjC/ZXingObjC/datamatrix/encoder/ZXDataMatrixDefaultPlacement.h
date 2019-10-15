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

/**
 * Symbol Character Placement Program. Adapted from Annex M.1 in ISO/IEC 16022:2000(E).
 */
@interface ZXDataMatrixDefaultPlacement : NSObject

@property (nonatomic, copy, readonly) NSString *codewords;
@property (nonatomic, assign, readonly) int numrows;
@property (nonatomic, assign, readonly) int numcols;
@property (nonatomic, assign, readonly) int8_t *bits;
@property (nonatomic, assign, readonly) int bitsLen;

/**
 * Main constructor
 *
 * @param codewords the codewords to place
 * @param numcols   the number of columns
 * @param numrows   the number of rows
 */
- (id)initWithCodewords:(NSString *)codewords numcols:(int)numcols numrows:(int)numrows;
- (BOOL)bitAtCol:(int)col row:(int)row;
- (void)setBitAtCol:(int)col row:(int)row bit:(BOOL)bit;
- (BOOL)hasBitAtCol:(int)col row:(int)row;
- (void)place;

@end
