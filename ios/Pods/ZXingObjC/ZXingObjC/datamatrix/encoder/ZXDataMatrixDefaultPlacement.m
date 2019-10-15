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

#import "ZXDataMatrixDefaultPlacement.h"

@implementation ZXDataMatrixDefaultPlacement

- (id)initWithCodewords:(NSString *)codewords numcols:(int)numcols numrows:(int)numrows {
  if (self = [super init]) {
    _codewords = [codewords copy];
    _numcols = numcols;
    _numrows = numrows;
    _bitsLen = numcols * numrows;
    _bits = (int8_t *)malloc(_bitsLen * sizeof(int8_t));
    memset(_bits, -1, _bitsLen); //Initialize with "not set" value
  }

  return self;
}

- (void)dealloc {
  if (_bits != NULL) {
    free(_bits);
    _bits = NULL;
  }
}

- (BOOL)bitAtCol:(int)col row:(int)row {
  return self.bits[row * self.numcols + col] == 1;
}

- (void)setBitAtCol:(int)col row:(int)row bit:(BOOL)bit {
  self.bits[row * self.numcols + col] = bit ? (int8_t) 1 : (int8_t) 0;
}

- (BOOL)hasBitAtCol:(int)col row:(int)row {
  return self.bits[row * self.numcols + col] >= 0;
}

- (void)place {
  int pos = 0;
  int row = 4;
  int col = 0;

  do {
    /* repeatedly first check for one of the special corner cases, then... */
    if ((row == self.numrows) && (col == 0)) {
      [self corner1:pos++];
    }
    if ((row == self.numrows - 2) && (col == 0) && ((self.numcols % 4) != 0)) {
      [self corner2:pos++];
    }
    if ((row == self.numrows - 2) && (col == 0) && (self.numcols % 8 == 4)) {
      [self corner3:pos++];
    }
    if ((row == self.numrows + 4) && (col == 2) && ((self.numcols % 8) == 0)) {
      [self corner4:pos++];
    }
    /* sweep upward diagonally, inserting successive characters... */
    do {
      if ((row < self.numrows) && (col >= 0) && ![self hasBitAtCol:col row:row]) {
        [self utahAtRow:row col:col pos:pos++];
      }
      row -= 2;
      col += 2;
    } while (row >= 0 && (col < self.numcols));
    row++;
    col += 3;

    /* and then sweep downward diagonally, inserting successive characters, ... */
    do {
      if ((row >= 0) && (col < self.numcols) && ![self hasBitAtCol:col row:row]) {
        [self utahAtRow:row col:col pos:pos++];
      }
      row += 2;
      col -= 2;
    } while ((row < self.numrows) && (col >= 0));
    row += 3;
    col++;

    /* ...until the entire array is scanned */
  } while ((row < self.numrows) || (col < self.numcols));

  /* Lastly, if the lower righthand corner is untouched, fill in fixed pattern */
  if (![self hasBitAtCol:self.numcols - 1 row:self.numrows - 1]) {
    [self setBitAtCol:self.numcols - 1 row:self.numrows - 1 bit:YES];
    [self setBitAtCol:self.numcols - 2 row:self.numrows - 2 bit:YES];
  }
}

- (void)moduleAtRow:(int)row col:(int)col pos:(int)pos bit:(int)bit {
  if (row < 0) {
    row += self.numrows;
    col += 4 - ((self.numrows + 4) % 8);
  }
  if (col < 0) {
    col += self.numcols;
    row += 4 - ((self.numcols + 4) % 8);
  }
  // Note the conversion:
  int v = [self.codewords characterAtIndex:pos];
  v &= 1 << (8 - bit);
  [self setBitAtCol:col row:row bit:v != 0];
}

/**
 * Places the 8 bits of a utah-shaped symbol character in ECC200.
 *
 * @param row the row
 * @param col the column
 * @param pos character position
 */
- (void)utahAtRow:(int)row col:(int)col pos:(int)pos {
  [self moduleAtRow:row - 2 col:col - 2 pos:pos bit:1];
  [self moduleAtRow:row - 2 col:col - 1 pos:pos bit:2];
  [self moduleAtRow:row - 1 col:col - 2 pos:pos bit:3];
  [self moduleAtRow:row - 1 col:col - 1 pos:pos bit:4];
  [self moduleAtRow:row - 1 col:col pos:pos bit:5];
  [self moduleAtRow:row col:col - 2 pos:pos bit:6];
  [self moduleAtRow:row col:col - 1 pos:pos bit:7];
  [self moduleAtRow:row col:col pos:pos bit:8];
}

- (void)corner1:(int)pos {
  [self moduleAtRow:self.numrows - 1 col:0 pos:pos bit:1];
  [self moduleAtRow:self.numrows - 1 col:1 pos:pos bit:2];
  [self moduleAtRow:self.numrows - 1 col:2 pos:pos bit:3];
  [self moduleAtRow:0 col:self.numcols - 2 pos:pos bit:4];
  [self moduleAtRow:0 col:self.numcols - 1 pos:pos bit:5];
  [self moduleAtRow:1 col:self.numcols - 1 pos:pos bit:6];
  [self moduleAtRow:2 col:self.numcols - 1 pos:pos bit:7];
  [self moduleAtRow:3 col:self.numcols - 1 pos:pos bit:8];
}

- (void)corner2:(int)pos {
  [self moduleAtRow:self.numrows - 3 col:0 pos:pos bit:1];
  [self moduleAtRow:self.numrows - 2 col:0 pos:pos bit:2];
  [self moduleAtRow:self.numrows - 1 col:0 pos:pos bit:3];
  [self moduleAtRow:0 col:self.numcols - 4 pos:pos bit:4];
  [self moduleAtRow:0 col:self.numcols - 3 pos:pos bit:5];
  [self moduleAtRow:0 col:self.numcols - 2 pos:pos bit:6];
  [self moduleAtRow:0 col:self.numcols - 1 pos:pos bit:7];
  [self moduleAtRow:1 col:self.numcols - 1 pos:pos bit:8];
}

- (void)corner3:(int)pos {
  [self moduleAtRow:self.numrows - 3 col:0 pos:pos bit:1];
  [self moduleAtRow:self.numrows - 2 col:0 pos:pos bit:2];
  [self moduleAtRow:self.numrows - 1 col:0 pos:pos bit:3];
  [self moduleAtRow:0 col:self.numcols - 2 pos:pos bit:4];
  [self moduleAtRow:0 col:self.numcols - 1 pos:pos bit:5];
  [self moduleAtRow:1 col:self.numcols - 1 pos:pos bit:6];
  [self moduleAtRow:2 col:self.numcols - 1 pos:pos bit:7];
  [self moduleAtRow:3 col:self.numcols - 1 pos:pos bit:8];
}

- (void)corner4:(int)pos {
  [self moduleAtRow:self.numrows - 1 col:0 pos:pos bit:1];
  [self moduleAtRow:self.numrows - 1 col:self.numcols - 1 pos:pos bit:2];
  [self moduleAtRow:0 col:self.numcols - 3 pos:pos bit:3];
  [self moduleAtRow:0 col:self.numcols - 2 pos:pos bit:4];
  [self moduleAtRow:0 col:self.numcols - 1 pos:pos bit:5];
  [self moduleAtRow:1 col:self.numcols - 3 pos:pos bit:6];
  [self moduleAtRow:1 col:self.numcols - 2 pos:pos bit:7];
  [self moduleAtRow:1 col:self.numcols - 1 pos:pos bit:8];
}

@end
