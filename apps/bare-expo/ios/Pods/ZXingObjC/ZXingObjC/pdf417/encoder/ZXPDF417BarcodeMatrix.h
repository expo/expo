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

@class ZXPDF417BarcodeRow;

/**
 * Holds all of the information for a barcode in a format where it can be easily accessable
 */
@interface ZXPDF417BarcodeMatrix : NSObject

@property (nonatomic, assign, readonly) int height;
@property (nonatomic, assign, readonly) int width;

/**
 * @param height the height of the matrix (Rows)
 * @param width  the width of the matrix (Cols)
 */
- (id)initWithHeight:(int)height width:(int)width;
- (void)startRow;
- (ZXPDF417BarcodeRow *)currentRow;
- (NSArray *)matrix;
//- (NSArray *)scaledMatrix:(int)scale;
- (NSArray *)scaledMatrixWithXScale:(int)xScale yScale:(int)yScale;

@end
