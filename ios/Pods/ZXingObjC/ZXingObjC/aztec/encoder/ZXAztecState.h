/*
 * Copyright 2014 ZXing authors
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

@class ZXAztecToken, ZXBitArray, ZXByteArray;

/**
 * State represents all information about a sequence necessary to generate the current output.
 * Note that a state is immutable.
 */
@interface ZXAztecState : NSObject

// The current mode of the encoding (or the mode to which we'll return if
// we're in Binary Shift mode.
@property (nonatomic, assign, readonly) int mode;

// The list of tokens that we output.  If we are in Binary Shift mode, this
// token list does *not* yet included the token for those bytes
@property (nonatomic, strong, readonly) ZXAztecToken *token;

// If non-zero, the number of most recent bytes that should be output
// in Binary Shift mode.
@property (nonatomic, assign, readonly) int binaryShiftByteCount;

// The total number of bits generated (including Binary Shift).
@property (nonatomic, assign, readonly) int bitCount;

- (id)initWithToken:(ZXAztecToken *)token mode:(int)mode binaryBytes:(int)binaryBytes bitCount:(int)bitCount;
+ (ZXAztecState *)initialState;
- (ZXAztecState *)latchAndAppend:(int)mode value:(int)value;
- (ZXAztecState *)shiftAndAppend:(int)mode value:(int)value;
- (ZXAztecState *)addBinaryShiftChar:(int)index;
- (ZXAztecState *)endBinaryShift:(int)index;
- (BOOL)isBetterThanOrEqualTo:(ZXAztecState *)other;
- (ZXBitArray *)toBitArray:(ZXByteArray *)text;

@end
