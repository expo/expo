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

/**
 * Data object to specify the minimum and maximum number of rows and columns for a PDF417 barcode.
 */
@interface ZXPDF417Dimensions : NSObject

@property (nonatomic, assign, readonly) int minCols;
@property (nonatomic, assign, readonly) int maxCols;
@property (nonatomic, assign, readonly) int minRows;
@property (nonatomic, assign, readonly) int maxRows;

- (id)initWithMinCols:(int)minCols maxCols:(int)maxCols minRows:(int)minRows maxRows:(int)maxRows;

@end
