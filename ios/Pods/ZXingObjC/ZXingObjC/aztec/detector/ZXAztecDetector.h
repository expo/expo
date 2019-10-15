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

@interface ZXAztecPoint : NSObject

@property (nonatomic, assign, readonly) int x;
@property (nonatomic, assign, readonly) int y;

- (id)initWithX:(int)x y:(int)y;

@end

@class ZXAztecDetectorResult, ZXBitMatrix;

/**
 * Encapsulates logic that can detect an Aztec Code in an image, even if the Aztec Code
 * is rotated or skewed, or partially obscured.
 */
@interface ZXAztecDetector : NSObject

- (id)initWithImage:(ZXBitMatrix *)image;

- (ZXAztecDetectorResult *)detectWithError:(NSError **)error;

/**
 * Detects an Aztec Code in an image.
 *
 * @param isMirror if true, image is a mirror-image of original
 * @return ZXAztecDetectorResult encapsulating results of detecting an Aztec Code, or nil if no
 *   Aztec Code can be found
 */
- (ZXAztecDetectorResult *)detectWithMirror:(BOOL)isMirror error:(NSError **)error;

@end
