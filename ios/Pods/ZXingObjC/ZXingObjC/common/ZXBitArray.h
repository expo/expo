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

@class ZXByteArray, ZXIntArray;

/**
 * A simple, fast array of bits, represented compactly by an array of ints internally.
 */
@interface ZXBitArray : NSObject <NSCopying>

/**
 * @return underlying array of ints. The first element holds the first 32 bits, and the least
 *         significant bit is bit 0.
 */
@property (nonatomic, assign, readonly) int32_t *bits;

@property (nonatomic, assign, readonly) int size;

- (id)initWithSize:(int)size;

- (int)sizeInBytes;

/**
 * @param i bit to get
 * @return true iff bit i is set
 */
- (BOOL)get:(int)i;

/**
 * Sets bit i.
 *
 * @param i bit to set
 */
- (void)set:(int)i;

/**
 * Flips bit i.
 *
 * @param i bit to set
 */
- (void)flip:(int)i;

/**
 * @param from first bit to check
 * @return index of first bit that is set, starting from the given index, or size if none are set
 *  at or beyond this given index
 */
- (int)nextSet:(int)from;

/**
 * @param from index to start looking for unset bit
 * @return index of next unset bit, or size if none are unset until the end
 * @see nextSet:
 */
- (int)nextUnset:(int)from;

/**
 * Sets a block of 32 bits, starting at bit i.
 *
 * @param i first bit to set
 * @param newBits the new value of the next 32 bits. Note again that the least-significant bit
 * corresponds to bit i, the next-least-significant to i+1, and so on.
 */
- (void)setBulk:(int)i newBits:(int32_t)newBits;

/**
 * Sets a range of bits.
 *
 * @param start start of range, inclusive.
 * @param end end of range, exclusive
 */
- (void)setRange:(int)start end:(int)end;

/**
 * Clears all bits (sets to false).
 */
- (void)clear;

/**
 * Efficient method to check if a range of bits is set, or not set.
 *
 * @param start start of range, inclusive.
 * @param end end of range, exclusive
 * @param value if true, checks that bits in range are set, otherwise checks that they are not set
 * @return true iff all bits are set or not set in range, according to value argument
 * @throws NSInvalidArgumentException if end is less than or equal to start
 */
- (BOOL)isRange:(int)start end:(int)end value:(BOOL)value;

- (void)appendBit:(BOOL)bit;

/**
 * Appends the least-significant bits, from value, in order from most-significant to
 * least-significant. For example, appending 6 bits from 0x000001E will append the bits
 * 0, 1, 1, 1, 1, 0 in that order.
 *
 * @param value in32_t containing bits to append
 * @param numBits bits from value to append
 */
- (void)appendBits:(int32_t)value numBits:(int)numBits;

- (void)appendBitArray:(ZXBitArray *)other;

- (void)xor:(ZXBitArray *)other;

/**
 *
 * @param bitOffset first bit to start writing
 * @param array array to write into. Bytes are written most-significant byte first. This is the opposite
 *  of the internal representation, which is exposed by `bitArray`
 * @param offset position in array to start writing
 * @param numBytes how many bytes to write
 */
- (void)toBytes:(int)bitOffset array:(ZXByteArray *)array offset:(int)offset numBytes:(int)numBytes;

/**
 * @return underlying array of ints. The first element holds the first 32 bits, and the least
 *         significant bit is bit 0.
 */
- (ZXIntArray *)bitArray;

/**
 * Reverses all bits in the array.
 */
- (void)reverse;

@end
