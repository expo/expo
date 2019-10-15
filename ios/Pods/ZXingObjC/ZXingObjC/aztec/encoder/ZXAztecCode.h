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

@class ZXBitMatrix;

/**
 * Aztec 2D code representation
 */
@interface ZXAztecCode : NSObject

/**
 * @return number of data codewords
 */
@property (nonatomic, assign) int codeWords;

/**
 * @return YES if compact instead of full mode
 */
@property (nonatomic, assign, getter = isCompact) BOOL compact;

/**
 * @return number of levels
 */
@property (nonatomic, assign) int layers;

/**
 * @return the symbol image
 */
@property (nonatomic, strong) ZXBitMatrix *matrix;

/**
 * @return size in pixels (width and height)
 */
@property (nonatomic, assign) int size;

@end
