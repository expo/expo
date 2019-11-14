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

#import "ZXPDF417DetectionResultColumn.h"

@class ZXIntArray, ZXPDF417BarcodeMetadata, ZXPDF417BoundingBox;

@interface ZXPDF417DetectionResultRowIndicatorColumn : ZXPDF417DetectionResultColumn

@property (nonatomic, assign, readonly) BOOL isLeft;

- (id)initWithBoundingBox:(ZXPDF417BoundingBox *)boundingBox isLeft:(BOOL)isLeft;
- (BOOL)getRowHeights:(ZXIntArray **)rowHeights;
- (int)adjustCompleteIndicatorColumnRowNumbers:(ZXPDF417BarcodeMetadata *)barcodeMetadata;
- (ZXPDF417BarcodeMetadata *)barcodeMetadata;

@end
