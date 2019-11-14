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
#import "ZXBitMatrix.h"
#import "ZXBoolArray.h"
#import "ZXIntArray.h"

@interface ZXBitMatrix ()

@property (nonatomic, assign, readonly) int bitsSize;

@end

@implementation ZXBitMatrix

- (id)initWithDimension:(int)dimension {
  return [self initWithWidth:dimension height:dimension];
}

- (id)initWithWidth:(int)width height:(int)height {
  if (self = [super init]) {
    if (width < 1 || height < 1) {
      @throw [NSException exceptionWithName:NSInvalidArgumentException
                                     reason:@"Both dimensions must be greater than 0"
                                   userInfo:nil];
    }
    _width = width;
    _height = height;
    _rowSize = (_width + 31) / 32;
    _bitsSize = _rowSize * _height;
    _bits = (int32_t *)malloc(_bitsSize * sizeof(int32_t));
    [self clear];
  }

  return self;
}

- (id)initWithWidth:(int)width height:(int)height rowSize:(int)rowSize bits:(int32_t *)bits {
  if (self = [super init]) {
    _width = width;
    _height = height;
    _rowSize = rowSize;
    _bitsSize = _rowSize * _height;
    _bits = (int32_t *)malloc(_bitsSize * sizeof(int32_t));
    memcpy(_bits, bits, _bitsSize * sizeof(int32_t));
  }

  return self;
}

- (void)dealloc {
  if (_bits != NULL) {
    free(_bits);
    _bits = NULL;
  }
}

+ (ZXBitMatrix *)parse:(NSString *)stringRepresentation
             setString:(NSString *)setString
           unsetString:(NSString *)unsetString {
  if (!stringRepresentation) {
    @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                   reason:@"stringRepresentation is required"
                                 userInfo:nil];
  }

  ZXBoolArray *bits = [[ZXBoolArray alloc] initWithLength:(unsigned int)stringRepresentation.length];
  int bitsPos = 0;
  int rowStartPos = 0;
  int rowLength = -1;
  int nRows = 0;
  int pos = 0;
  while (pos < stringRepresentation.length) {
    if ([stringRepresentation characterAtIndex:pos] == '\n' ||
        [stringRepresentation characterAtIndex:pos] == '\r') {
      if (bitsPos > rowStartPos) {
        if(rowLength == -1) {
          rowLength = bitsPos - rowStartPos;
        } else if (bitsPos - rowStartPos != rowLength) {
          @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                         reason:@"row lengths do not match"
                                       userInfo:nil];
        }
        rowStartPos = bitsPos;
        nRows++;
      }
      pos++;
    } else if ([[stringRepresentation substringWithRange:NSMakeRange(pos, setString.length)] isEqualToString:setString]) {
      pos += setString.length;
      bits.array[bitsPos] = YES;
      bitsPos++;
    } else if ([[stringRepresentation substringWithRange:NSMakeRange(pos, unsetString.length)] isEqualToString:unsetString]) {
      pos += unsetString.length;
      bits.array[bitsPos] = NO;
      bitsPos++;
    } else {
      @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                     reason:[NSString stringWithFormat:@"illegal character encountered: %@", [stringRepresentation substringFromIndex:pos]]
                                   userInfo:nil];
    }
  }

  // no EOL at end?
  if (bitsPos > rowStartPos) {
    if (rowLength == -1) {
      rowLength = bitsPos - rowStartPos;
    } else if (bitsPos - rowStartPos != rowLength) {
      @throw [NSException exceptionWithName:@"IllegalArgumentException"
                                     reason:@"row lengths do not match"
                                   userInfo:nil];
    }
    nRows++;
  }

  ZXBitMatrix *matrix = [[ZXBitMatrix alloc] initWithWidth:rowLength height:nRows];
  for (int i = 0; i < bitsPos; i++) {
    if (bits.array[i]) {
      [matrix setX:i % rowLength y:i / rowLength];
    }
  }
  return matrix;
}

- (BOOL)getX:(int)x y:(int)y {
  NSInteger offset = y * self.rowSize + (x / 32);
  return ((_bits[offset] >> (x & 0x1f)) & 1) != 0;
}

- (void)setX:(int)x y:(int)y {
  NSInteger offset = y * self.rowSize + (x / 32);
  _bits[offset] |= 1 << (x & 0x1f);
}

- (void)unsetX:(int)x y:(int)y {
  int offset = y * self.rowSize + (x / 32);
  _bits[offset] &= ~(1 << (x & 0x1f));
}

- (void)flipX:(int)x y:(int)y {
  NSUInteger offset = y * self.rowSize + (x / 32);
  _bits[offset] ^= 1 << (x & 0x1f);
}

- (void)xor:(ZXBitMatrix *)mask {
  if (self.width != mask.width || self.height != mask.height
      || self.rowSize != mask.rowSize) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"input matrix dimensions do not match"
                                 userInfo:nil];
  }
  ZXBitArray *rowArray = [[ZXBitArray alloc] initWithSize:self.width];
  for (int y = 0; y < self.height; y++) {
    int offset = y * self.rowSize;
    int32_t *row = [mask rowAtY:y row:rowArray].bits;
    for (int x = 0; x < self.rowSize; x++) {
      self.bits[offset + x] ^= row[x];
    }
  }
}

- (void)clear {
  NSInteger max = self.bitsSize;
  memset(_bits, 0, max * sizeof(int32_t));
}

- (void)setRegionAtLeft:(int)left top:(int)top width:(int)aWidth height:(int)aHeight {
  if (aHeight < 1 || aWidth < 1) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"Height and width must be at least 1"
                                 userInfo:nil];
  }
  NSUInteger right = left + aWidth;
  NSUInteger bottom = top + aHeight;
  if (bottom > self.height || right > self.width) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"The region must fit inside the matrix"
                                 userInfo:nil];
  }
  for (NSUInteger y = top; y < bottom; y++) {
    NSUInteger offset = y * self.rowSize;
    for (NSInteger x = left; x < right; x++) {
      _bits[offset + (x / 32)] |= 1 << (x & 0x1f);
    }
  }
}

- (ZXBitArray *)rowAtY:(int)y row:(ZXBitArray *)row {
  if (row == nil || [row size] < self.width) {
    row = [[ZXBitArray alloc] initWithSize:self.width];
  } else {
    [row clear];
  }
  int offset = y * self.rowSize;
  for (int x = 0; x < self.rowSize; x++) {
    [row setBulk:x * 32 newBits:_bits[offset + x]];
  }

  return row;
}

- (void)setRowAtY:(int)y row:(ZXBitArray *)row {
  for (NSUInteger i = 0; i < self.rowSize; i++) {
    _bits[(y * self.rowSize) + i] = row.bits[i];
  }
}

- (void)rotate180 {
  int width = self.width;
  int height = self.height;
  ZXBitArray *topRow = [[ZXBitArray alloc] initWithSize:width];
  ZXBitArray *bottomRow = [[ZXBitArray alloc] initWithSize:width];
  for (int i = 0; i < (height+1) / 2; i++) {
    topRow = [self rowAtY:i row:topRow];
    bottomRow = [self rowAtY:height - 1 - i row:bottomRow];
    [topRow reverse];
    [bottomRow reverse];
    [self setRowAtY:i row:bottomRow];
    [self setRowAtY:height - 1 - i row:topRow];
  }
}

- (ZXIntArray *)enclosingRectangle {
  int left = self.width;
  int top = self.height;
  int right = -1;
  int bottom = -1;

  for (int y = 0; y < self.height; y++) {
    for (int x32 = 0; x32 < self.rowSize; x32++) {
      int32_t theBits = _bits[y * self.rowSize + x32];
      if (theBits != 0) {
        if (y < top) {
          top = y;
        }
        if (y > bottom) {
          bottom = y;
        }
        if (x32 * 32 < left) {
          int32_t bit = 0;
          while ((theBits << (31 - bit)) == 0) {
            bit++;
          }
          if ((x32 * 32 + bit) < left) {
            left = x32 * 32 + bit;
          }
        }
        if (x32 * 32 + 31 > right) {
          int bit = 31;
          while ((theBits >> bit) == 0) {
            bit--;
          }
          if ((x32 * 32 + bit) > right) {
            right = x32 * 32 + bit;
          }
        }
      }
    }
  }

  NSInteger width = right - left + 1;
  NSInteger height = bottom - top + 1;

  if (width < 0 || height < 0) {
    return nil;
  }

  return [[ZXIntArray alloc] initWithInts:left, top, width, height, -1];
}

- (ZXIntArray *)topLeftOnBit {
  int bitsOffset = 0;
  while (bitsOffset < self.bitsSize && _bits[bitsOffset] == 0) {
    bitsOffset++;
  }
  if (bitsOffset == self.bitsSize) {
    return nil;
  }
  int y = bitsOffset / self.rowSize;
  int x = (bitsOffset % self.rowSize) * 32;

  int32_t theBits = _bits[bitsOffset];
  int32_t bit = 0;
  while ((theBits << (31 - bit)) == 0) {
    bit++;
  }
  x += bit;
  return [[ZXIntArray alloc] initWithInts:x, y, -1];
}

- (ZXIntArray *)bottomRightOnBit {
  int bitsOffset = self.bitsSize - 1;
  while (bitsOffset >= 0 && _bits[bitsOffset] == 0) {
    bitsOffset--;
  }
  if (bitsOffset < 0) {
    return nil;
  }

  int y = bitsOffset / self.rowSize;
  int x = (bitsOffset % self.rowSize) * 32;

  int32_t theBits = _bits[bitsOffset];
  int32_t bit = 31;
  while ((theBits >> bit) == 0) {
    bit--;
  }
  x += bit;

  return [[ZXIntArray alloc] initWithInts:x, y, -1];
}

- (BOOL)isEqual:(NSObject *)o {
  if (!([o isKindOfClass:[ZXBitMatrix class]])) {
    return NO;
  }
  ZXBitMatrix *other = (ZXBitMatrix *)o;
  for (int i = 0; i < self.bitsSize; i++) {
    if (_bits[i] != other.bits[i]) {
      return NO;
    }
  }
  return self.width == other.width && self.height == other.height && self.rowSize == other.rowSize && self.bitsSize == other.bitsSize;
}

- (NSUInteger)hash {
  NSInteger hash = self.width;
  hash = 31 * hash + self.width;
  hash = 31 * hash + self.height;
  hash = 31 * hash + self.rowSize;
  for (NSUInteger i = 0; i < self.bitsSize; i++) {
    hash = 31 * hash + _bits[i];
  }
  return hash;
}

// string representation using "X" for set and " " for unset bits
- (NSString *)description {
  return [self descriptionWithSetString:@"X " unsetString:@"  "];
}

- (NSString *)descriptionWithSetString:(NSString *)setString unsetString:(NSString *)unsetString {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
  return [self descriptionWithSetString:setString unsetString:unsetString lineSeparator:@"\n"];
#pragma GCC diagnostic pop
}

- (NSString *)descriptionWithSetString:(NSString *)setString unsetString:(NSString *)unsetString
                         lineSeparator:(NSString *)lineSeparator {
  NSMutableString *result = [NSMutableString stringWithCapacity:self.height * (self.width + 1)];
  for (int y = 0; y < self.height; y++) {
    for (int x = 0; x < self.width; x++) {
      [result appendString:[self getX:x y:y] ? setString : unsetString];
    }
    [result appendString:lineSeparator];
  }
  return result;
}

- (id)copyWithZone:(NSZone *)zone {
  return [[ZXBitMatrix allocWithZone:zone] initWithWidth:self.width height:self.height rowSize:self.rowSize bits:self.bits];
}

@end
