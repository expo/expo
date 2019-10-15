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

#import "ZXResultPoint.h"

/**
 * Encapsulates an alignment pattern, which are the smaller square patterns found in
 * all but the simplest QR Codes.
 */
@interface ZXQRCodeAlignmentPattern : ZXResultPoint

- (id)initWithPosX:(float)posX posY:(float)posY estimatedModuleSize:(float)estimatedModuleSize;

/**
 * Determines if this alignment pattern "about equals" an alignment pattern at the stated
 * position and size -- meaning, it is at nearly the same center with nearly the same size.
 */
- (BOOL)aboutEquals:(float)moduleSize i:(float)i j:(float)j;

/**
 * Combines this object's current estimate of a finder pattern position and module size
 * with a new estimate. It returns a new {@code FinderPattern} containing an average of the two.
 */
- (ZXQRCodeAlignmentPattern *)combineEstimateI:(float)i j:(float)j newModuleSize:(float)newModuleSize;

@end
