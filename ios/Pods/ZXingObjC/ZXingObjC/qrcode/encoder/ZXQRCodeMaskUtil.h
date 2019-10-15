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

@class ZXByteMatrix;

@interface ZXQRCodeMaskUtil : NSObject

/**
 * Apply mask penalty rule 1 and return the penalty. Find repetitive cells with the same color and
 * give penalty to them. Example: 00000 or 11111.
 */
+ (int)applyMaskPenaltyRule1:(ZXByteMatrix *)matrix;

/**
 * Apply mask penalty rule 2 and return the penalty. Find 2x2 blocks with the same color and give
 * penalty to them. This is actually equivalent to the spec's rule, which is to find MxN blocks and give a
 * penalty proportional to (M-1)x(N-1), because this is the number of 2x2 blocks inside such a block.
 */
+ (int)applyMaskPenaltyRule2:(ZXByteMatrix *)matrix;

/**
 * Apply mask penalty rule 3 and return the penalty. Find consecutive runs of 1:1:3:1:1:4
 * starting with black, or 4:1:1:3:1:1 starting with white, and give penalty to them.  If we
 * find patterns like 000010111010000, we give penalty once.
 */
+ (int)applyMaskPenaltyRule3:(ZXByteMatrix *)matrix;

/**
 * Apply mask penalty rule 4 and return the penalty. Calculate the ratio of dark cells and give
 * penalty if the ratio is far from 50%. It gives 10 penalty for 5% distance.
 */
+ (int)applyMaskPenaltyRule4:(ZXByteMatrix *)matrix;

/**
 * Return the mask bit for "getMaskPattern" at "x" and "y". See 8.8 of JISX0510:2004 for mask
 * pattern conditions.
 */
+ (BOOL)dataMaskBit:(int)maskPattern x:(int)x y:(int)y;

@end
