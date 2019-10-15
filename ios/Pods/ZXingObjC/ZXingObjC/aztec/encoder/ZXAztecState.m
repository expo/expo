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

#import "ZXAztecHighLevelEncoder.h"
#import "ZXAztecState.h"
#import "ZXAztecToken.h"
#import "ZXBitArray.h"
#import "ZXByteArray.h"

@implementation ZXAztecState

- (id)initWithToken:(ZXAztecToken *)token mode:(int)mode binaryBytes:(int)binaryBytes bitCount:(int)bitCount {
  if (self = [super init]) {
    _token = token;
    _mode = mode;
    _binaryShiftByteCount = binaryBytes;
    _bitCount = bitCount;
  }

  return self;
}

+ (ZXAztecState *)initialState {
  return [[ZXAztecState alloc] initWithToken:[ZXAztecToken empty] mode:ZX_AZTEC_MODE_UPPER binaryBytes:0 bitCount:0];
}

// Create a new state representing this state with a latch to a (not
// necessary different) mode, and then a code.
- (ZXAztecState *)latchAndAppend:(int)mode value:(int)value {
  int bitCount = self.bitCount;
  ZXAztecToken *token = self.token;
  if (mode != self.mode) {
    int latch = ZX_AZTEC_LATCH_TABLE[self.mode][mode];
    token = [token add:latch & 0xFFFF bitCount:latch >> 16];
    bitCount += latch >> 16;
  }
  int latchModeBitCount = mode == ZX_AZTEC_MODE_DIGIT ? 4 : 5;
  token = [token add:value bitCount:latchModeBitCount];
  return [[ZXAztecState alloc] initWithToken:token mode:mode binaryBytes:0 bitCount:bitCount + latchModeBitCount];
}

// Create a new state representing this state, with a temporary shift
// to a different mode to output a single value.
- (ZXAztecState *)shiftAndAppend:(int)mode value:(int)value {
  //assert binaryShiftByteCount == 0 && this.mode != mode;
  ZXAztecToken *token = self.token;
  int thisModeBitCount = self.mode == ZX_AZTEC_MODE_DIGIT ? 4 : 5;
  // Shifts exist only to UPPER and PUNCT, both with tokens size 5.
  token = [token add:ZX_AZTEC_SHIFT_TABLE[self.mode][mode] bitCount:thisModeBitCount];
  token = [token add:value bitCount:5];
  return [[ZXAztecState alloc] initWithToken:token mode:self.mode binaryBytes:0 bitCount:self.bitCount + thisModeBitCount + 5];
}

// Create a new state representing this state, but an additional character
// output in Binary Shift mode.
- (ZXAztecState *)addBinaryShiftChar:(int)index {
  ZXAztecToken *token = self.token;
  int mode = self.mode;
  int bitCount = self.bitCount;
  if (self.mode == ZX_AZTEC_MODE_PUNCT || self.mode == ZX_AZTEC_MODE_DIGIT)  {
    int latch = ZX_AZTEC_LATCH_TABLE[mode][ZX_AZTEC_MODE_UPPER];
    token = [token add:latch & 0xFFFF bitCount:latch >> 16];
    bitCount += latch >> 16;
    mode = ZX_AZTEC_MODE_UPPER;
  }
  int deltaBitCount =
  (self.binaryShiftByteCount == 0 || self.binaryShiftByteCount == 31) ? 18 :
  (self.binaryShiftByteCount == 62) ? 9 : 8;
  ZXAztecState *result = [[ZXAztecState alloc] initWithToken:token mode:mode binaryBytes:self.binaryShiftByteCount + 1 bitCount:bitCount + deltaBitCount];
  if (result.binaryShiftByteCount == 2047 + 31) {
    // The string is as long as it's allowed to be.  We should end it.
    result = [result endBinaryShift:index + 1];
  }
  return result;
}

// Create the state identical to this one, but we are no longer in
// Binary Shift mode.
- (ZXAztecState *)endBinaryShift:(int)index {
  if (self.binaryShiftByteCount == 0) {
    return self;
  }
  ZXAztecToken *token = self.token;
  token = [token addBinaryShift:index - self.binaryShiftByteCount byteCount:self.binaryShiftByteCount];
  return [[ZXAztecState alloc] initWithToken:token mode:self.mode binaryBytes:0 bitCount:self.bitCount];
}

// Returns true if "this" state is better (or equal) to be in than "that"
// state under all possible circumstances.
- (BOOL)isBetterThanOrEqualTo:(ZXAztecState *)other {
  int newModeBitCount = self.bitCount + (ZX_AZTEC_LATCH_TABLE[self.mode][other.mode] >> 16);
  if (self.binaryShiftByteCount < other.binaryShiftByteCount) {
    // add additional B/S encoding cost of other, if any
    newModeBitCount += [self calculateBinaryShiftCost:other] - [self calculateBinaryShiftCost:self];
  } else if (self.binaryShiftByteCount > other.binaryShiftByteCount && other.binaryShiftByteCount > 0) {
    // maximum possible additional cost (we end up exceeding the 31 byte boundary and other state can stay beneath it)
    newModeBitCount += 10;
  }
  return newModeBitCount <= other.bitCount;
}

- (int)calculateBinaryShiftCost:(ZXAztecState *)state {
  if (state.binaryShiftByteCount > 62) {
    return 21; // B/S with extended length
  }
  if (state.binaryShiftByteCount > 31) {
    return 20; // two B/S
  }
  if (state.binaryShiftByteCount > 0) {
    return 10; // one B/S
  }
  return 0;
}

- (ZXBitArray *)toBitArray:(ZXByteArray *)text {
  // Reverse the tokens, so that they are in the order that they should
  // be output
  NSMutableArray *symbols = [NSMutableArray array];
  for (ZXAztecToken *token = [self endBinaryShift:text.length].token; token != nil; token = token.previous) {
    [symbols insertObject:token atIndex:0];
  }
  ZXBitArray *bitArray = [[ZXBitArray alloc] init];
  // Add each token to the result.
  for (ZXAztecToken *symbol in symbols) {
    [symbol appendTo:bitArray text:text];
  }
  return bitArray;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@ bits=%d bytes=%d", ZX_AZTEC_MODE_NAMES[self.mode],
          self.bitCount, self.binaryShiftByteCount];
}

@end
