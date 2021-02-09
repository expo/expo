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

@class ZXByteArray;

/**
 * This provides an easy abstraction to read bits at a time from a sequence of bytes, where the
 * number of bits read is not often a multiple of 8.
 *
 * This class is thread-safe but not reentrant -- unless the caller modifies the bytes array
 * it passed in, in which case all bets are off.
 */
@interface ZXBitSource : NSObject

/**
 * @return index of next bit in current byte which would be read by the next call to `readBits:`.
 */
@property (nonatomic, assign, readonly) int bitOffset;

/**
 * @return index of next byte in input byte array which would be read by the next call to `readBits:`.
 */
@property (nonatomic, assign, readonly) int byteOffset;

/**
 * @param bytes bytes from which this will read bits. Bits will be read from the first byte first.
 * Bits are read within a byte from most-significant to least-significant bit.
 */
- (id)initWithBytes:(ZXByteArray *)bytes;

/**
 * @param numBits number of bits to read
 * @return int representing the bits read. The bits will appear as the least-significant
 *         bits of the int
 * @throws NSInvalidArgumentException if numBits isn't in [1,32] or more than is available
 */
- (int)readBits:(int)numBits;

/**
 * @return number of bits that can be read successfully
 */
- (int)available;

@end
