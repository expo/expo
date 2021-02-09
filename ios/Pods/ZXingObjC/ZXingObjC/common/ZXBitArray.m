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

#import "ZXBitArray.h"
#import "ZXByteArray.h"
#import "ZXIntArray.h"

@interface ZXBitArray ()

@property (nonatomic, assign) int32_t *bits;
@property (nonatomic, assign) int bitsLength;
@property (nonatomic, assign) int size;

@end

@implementation ZXBitArray

- (id)init {
  if (self = [super init]) {
    _size = 0;
    _bits = (int32_t *)calloc(1, sizeof(int32_t));
    _bitsLength = 1;
  }

  return self;
}

// For testing only
- (id)initWithBits:(ZXIntArray *)bits size:(int)size {
  if (self = [self initWithSize:size]) {
    _bits = bits.array;
    _bits = (int32_t *)malloc(bits.length * sizeof(int32_t));
    memcpy(_bits, bits.array, bits.length * sizeof(int32_t));
    _bitsLength = bits.length;
  }

  return self;
}

- (id)initWithSize:(int)size {
  if (self = [super init]) {
    _size = size;
    _bitsLength = (size + 31) / 32;
    _bits = (int32_t *)calloc(_bitsLength, sizeof(int32_t));
  }

  return self;
}

- (void)dealloc {
  if (_bits != NULL) {
    free(_bits);
    _bits = NULL;
  }
}

- (int)sizeInBytes {
  return (self.size + 7) / 8;
}

- (void)ensureCapacity:(int)size {
  if (size > self.bitsLength * 32) {
    int newBitsLength = (size + 31) / 32;

    // basically realloc
    int32_t *newBits = (int32_t *)malloc(newBitsLength * sizeof(int32_t));
    memcpy(newBits, self.bits, self.bitsLength * sizeof(int32_t));
    memset(newBits + self.bitsLength, 0, (newBitsLength - self.bitsLength) * sizeof(int32_t));
    free(self.bits);
    self.bits = NULL;

    self.bits = newBits;
    self.bitsLength = newBitsLength;
  }
}

- (BOOL)get:(int)i {
  return (_bits[i / 32] & (1 << (i & 0x1F))) != 0;
}

- (void)set:(int)i {
  _bits[i / 32] |= 1 << (i & 0x1F);
}

- (void)flip:(int)i {
  _bits[i / 32] ^= 1 << (i & 0x1F);
}

- (int)nextSet:(int)from {
  if (from >= self.size) {
    return self.size;
  }
  int bitsOffset = from / 32;
  int32_t currentBits = self.bits[bitsOffset];
  // mask off lesser bits first
  currentBits &= ~((1 << (from & 0x1F)) - 1);
  while (currentBits == 0) {
    if (++bitsOffset == self.bitsLength) {
      return self.size;
    }
    currentBits = self.bits[bitsOffset];
  }
  int result = (bitsOffset * 32) + [self numberOfTrailingZeros:currentBits];
  return result > self.size ? self.size : result;
}

- (int)nextUnset:(int)from {
  if (from >= self.size) {
    return self.size;
  }
  int bitsOffset = from / 32;
  int32_t currentBits = ~self.bits[bitsOffset];
  // mask off lesser bits first
  currentBits &= ~((1 << (from & 0x1F)) - 1);
  while (currentBits == 0) {
    if (++bitsOffset == self.bitsLength) {
      return self.size;
    }
    currentBits = ~self.bits[bitsOffset];
  }
  int result = (bitsOffset * 32) + [self numberOfTrailingZeros:currentBits];
  return result > self.size ? self.size : result;
}

- (void)setBulk:(int)i newBits:(int32_t)newBits {
  _bits[i / 32] = newBits;
}

- (void)setRange:(int)start end:(int)end {
  if (end < start || start < 0 || end > self.size) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Start greater than end" userInfo:nil];
  }
  if (end == start) {
    return;
  }
  end--; // will be easier to treat this as the last actually set bit -- inclusive
  int firstInt = start / 32;
  int lastInt = end / 32;
  for (int i = firstInt; i <= lastInt; i++) {
    int firstBit = i > firstInt ? 0 : start & 0x1F;
    int lastBit = i < lastInt ? 31 : end & 0x1F;
    // Ones from firstBit to lastBit, inclusive
    int32_t mask = (2 << lastBit) - (1 << firstBit);
    _bits[i] |= mask;
  }
}

- (void)clear {
  memset(self.bits, 0, self.bitsLength * sizeof(int32_t));
}

- (BOOL)isRange:(int)start end:(int)end value:(BOOL)value {
  if (end < start || start < 0 || end > self.size) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Start greater than end" userInfo:nil];
  }
  if (end == start) {
    return YES; // empty range matches
  }
  end--; // will be easier to treat this as the last actually set bit -- inclusive
  int firstInt = start / 32;
  int lastInt = end / 32;
  for (int i = firstInt; i <= lastInt; i++) {
    int firstBit = i > firstInt ? 0 : start & 0x1F;
    int lastBit = i < lastInt ? 31 : end & 0x1F;
    // Ones from firstBit to lastBit, inclusive
    int32_t mask = (2 << lastBit) - (1 << firstBit);

    // Return false if we're looking for 1s and the masked bits[i] isn't all 1s (that is,
    // equals the mask, or we're looking for 0s and the masked portion is not all 0s
    if ((_bits[i] & mask) != (value ? mask : 0)) {
      return NO;
    }
  }

  return YES;
}

- (void)appendBit:(BOOL)bit {
  [self ensureCapacity:self.size + 1];
  if (bit) {
    self.bits[self.size / 32] |= 1 << (self.size & 0x1F);
  }
  self.size++;
}

- (void)appendBits:(int32_t)value numBits:(int)numBits {
  if (numBits < 0 || numBits > 32) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"Num bits must be between 0 and 32"
                                 userInfo:nil];
  }
  [self ensureCapacity:self.size + numBits];
  for (int numBitsLeft = numBits; numBitsLeft > 0; numBitsLeft--) {
    [self appendBit:((value >> (numBitsLeft - 1)) & 0x01) == 1];
  }
}

- (void)appendBitArray:(ZXBitArray *)other {
  int otherSize = [other size];
  [self ensureCapacity:self.size + otherSize];

  for (int i = 0; i < otherSize; i++) {
    [self appendBit:[other get:i]];
  }
}

- (void)xor:(ZXBitArray *)other {
  if (self.size != other.size) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"Sizes don't match"
                                 userInfo:nil];
  }

  for (int i = 0; i < self.bitsLength; i++) {
    // The last int could be incomplete (i.e. not have 32 bits in
    // it) but there is no problem since 0 XOR 0 == 0.
    self.bits[i] ^= other.bits[i];
  }
}

- (void)toBytes:(int)bitOffset array:(ZXByteArray *)array offset:(int)offset numBytes:(int)numBytes {
  for (int i = 0; i < numBytes; i++) {
    int32_t theByte = 0;
    for (int j = 0; j < 8; j++) {
      if ([self get:bitOffset]) {
        theByte |= 1 << (7 - j);
      }
      bitOffset++;
    }
    array.array[offset + i] = (int8_t) theByte;
  }
}

- (ZXIntArray *)bitArray {
  ZXIntArray *array = [[ZXIntArray alloc] initWithLength:self.bitsLength];
  memcpy(array.array, self.bits, array.length * sizeof(int32_t));
  return array;
}

- (BOOL)isEqual:(id)o {
  if (![o isKindOfClass:[ZXBitArray class]]) {
    return NO;
  }
  ZXBitArray *other = (ZXBitArray *)o;
  if (self.size != other.size) {
    return NO;
  }
  for (int i = 0; i < self.bitsLength; i++) {
    if (self.bits[i] != other.bits[i]) {
      return NO;
    }
  }
  return YES;
}

- (NSUInteger)hash {
  if (self.bitsLength == 0) {
    return 31 * self.size;
  }
  
  NSUInteger bitsHash = 1;
  for (int i = 0; i < self.bitsLength; i++) {
    bitsHash = 31 * bitsHash + self.bits[i];
  }
  return 31 * self.size + bitsHash;
}

- (void)reverse {
  int32_t *newBits = (int32_t *)calloc(self.bitsLength, sizeof(int32_t));
  int size = self.size;

  // reverse all int's first
  int len = ((size-1) / 32);
  int oldBitsLen = len + 1;
  for (int i = 0; i < oldBitsLen; i++) {
    long x = (long) self.bits[i];
    x = ((x >>  1) & 0x55555555L) | ((x & 0x55555555L) <<  1);
    x = ((x >>  2) & 0x33333333L) | ((x & 0x33333333L) <<  2);
    x = ((x >>  4) & 0x0f0f0f0fL) | ((x & 0x0f0f0f0fL) <<  4);
    x = ((x >>  8) & 0x00ff00ffL) | ((x & 0x00ff00ffL) <<  8);
    x = ((x >> 16) & 0x0000ffffL) | ((x & 0x0000ffffL) << 16);
    newBits[len - i] = (int32_t) x;
  }
  // now correct the int's if the bit size isn't a multiple of 32
  if (size != oldBitsLen * 32) {
    int leftOffset = oldBitsLen * 32 - size;
    int mask = 1;
    for (int i = 0; i < 31 - leftOffset; i++) {
      mask = (mask << 1) | 1;
    }
    int32_t currentInt = (newBits[0] >> leftOffset) & mask;
    for (int i = 1; i < oldBitsLen; i++) {
      int32_t nextInt = newBits[i];
      currentInt |= nextInt << (32 - leftOffset);
      newBits[i - 1] = currentInt;
      currentInt = (nextInt >> leftOffset) & mask;
    }
    newBits[oldBitsLen - 1] = currentInt;
  }
  if (self.bits != NULL) {
    free(self.bits);
  }
  self.bits = newBits;
}

- (NSString *)description {
  NSMutableString *result = [NSMutableString string];

  for (int i = 0; i < self.size; i++) {
    if ((i & 0x07) == 0) {
      [result appendString:@" "];
    }
    [result appendString:[self get:i] ? @"X" : @"."];
  }

  return result;
}

// Ported from OpenJDK Integer.numberOfTrailingZeros implementation
- (int32_t)numberOfTrailingZeros:(int32_t)i {
  int32_t y;
  if (i == 0) return 32;
  int32_t n = 31;
  y = i <<16; if (y != 0) { n = n -16; i = y; }
  y = i << 8; if (y != 0) { n = n - 8; i = y; }
  y = i << 4; if (y != 0) { n = n - 4; i = y; }
  y = i << 2; if (y != 0) { n = n - 2; i = y; }
  return n - (int32_t)((uint32_t)(i << 1) >> 31);
}

- (id)copyWithZone:(NSZone *)zone {
  ZXBitArray *copy = [[ZXBitArray allocWithZone:zone] initWithSize:self.size];
  memcpy(copy.bits, self.bits, self.size * sizeof(int32_t));
  return copy;
}

@end
