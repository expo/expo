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

@class ZXBitMatrix, ZXResultPoint;

@interface ZXPDF417BoundingBox : NSObject

@property (nonatomic, assign, readonly) int minX;
@property (nonatomic, assign, readonly) int maxX;
@property (nonatomic, assign, readonly) int minY;
@property (nonatomic, assign, readonly) int maxY;
@property (nonatomic, strong, readonly) ZXResultPoint *topLeft;
@property (nonatomic, strong, readonly) ZXResultPoint *topRight;
@property (nonatomic, strong, readonly) ZXResultPoint *bottomLeft;
@property (nonatomic, strong, readonly) ZXResultPoint *bottomRight;

- (id)initWithImage:(ZXBitMatrix *)image topLeft:(ZXResultPoint *)topLeft bottomLeft:(ZXResultPoint *)bottomLeft
           topRight:(ZXResultPoint *)topRight bottomRight:(ZXResultPoint *)bottomRight;
- (id)initWithBoundingBox:(ZXPDF417BoundingBox *)boundingBox;

+ (ZXPDF417BoundingBox *)mergeLeftBox:(ZXPDF417BoundingBox *)leftBox rightBox:(ZXPDF417BoundingBox *)rightBox;
- (ZXPDF417BoundingBox *)addMissingRows:(int)missingStartRows missingEndRows:(int)missingEndRows isLeft:(BOOL)isLeft;

@end
