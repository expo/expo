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

#import "ZXBitMatrix.h"
#import "ZXByteArray.h"
#import "ZXDataMatrixBitMatrixParser.h"
#import "ZXDataMatrixVersion.h"
#import "ZXErrors.h"

@interface ZXDataMatrixBitMatrixParser ()

@property (nonatomic, strong, readonly) ZXBitMatrix *mappingBitMatrix;
@property (nonatomic, strong, readonly) ZXBitMatrix *readMappingMatrix;

@end

@implementation ZXDataMatrixBitMatrixParser

- (id)initWithBitMatrix:(ZXBitMatrix *)bitMatrix error:(NSError **)error {
  if (self = [super init]) {
    int dimension = bitMatrix.height;
    if (dimension < 8 || dimension > 144 || (dimension & 0x01) != 0) {
      if (error) *error = ZXFormatErrorInstance();
      return nil;
    }
    _version = [self readVersion:bitMatrix];
    if (!_version) {
      if (error) *error = ZXFormatErrorInstance();
      return nil;
    }
    _mappingBitMatrix = [self extractDataRegion:bitMatrix];
    _readMappingMatrix = [[ZXBitMatrix alloc] initWithWidth:_mappingBitMatrix.width
                                                     height:_mappingBitMatrix.height];
  }

  return self;
}

/**
 * Creates the version object based on the dimension of the original bit matrix from
 * the datamatrix code.
 *
 * See ISO 16022:2006 Table 7 - ECC 200 symbol attributes<
 *
 * @param bitMatrix Original ZXBitMatrix including alignment patterns
 * @return ZXDatamatrixVersion encapsulating the Data Matrix Code's "version"
 *  or nil if the dimensions of the mapping matrix are not valid
 *  Data Matrix dimensions.
 */
- (ZXDataMatrixVersion *)readVersion:(ZXBitMatrix *)bitMatrix {
  int numRows = bitMatrix.height;
  int numColumns = bitMatrix.width;
  return [ZXDataMatrixVersion versionForDimensions:numRows numColumns:numColumns];
}

- (ZXByteArray *)readCodewords {
  ZXByteArray *result = [[ZXByteArray alloc] initWithLength:self.version.totalCodewords];
  int resultOffset = 0;

  int row = 4;
  int column = 0;

  int numRows = self.mappingBitMatrix.height;
  int numColumns = self.mappingBitMatrix.width;

  BOOL corner1Read = NO;
  BOOL corner2Read = NO;
  BOOL corner3Read = NO;
  BOOL corner4Read = NO;

  do {
    if ((row == numRows) && (column == 0) && !corner1Read) {
      result.array[resultOffset++] = (int8_t) [self readCorner1:numRows numColumns:numColumns];
      row -= 2;
      column += 2;
      corner1Read = YES;
    } else if ((row == numRows - 2) && (column == 0) && ((numColumns & 0x03) != 0) && !corner2Read) {
      result.array[resultOffset++] = (int8_t) [self readCorner2:numRows numColumns:numColumns];
      row -= 2;
      column += 2;
      corner2Read = YES;
    } else if ((row == numRows + 4) && (column == 2) && ((numColumns & 0x07) == 0) && !corner3Read) {
      result.array[resultOffset++] = (int8_t) [self readCorner3:numRows numColumns:numColumns];
      row -= 2;
      column += 2;
      corner3Read = YES;
    } else if ((row == numRows - 2) && (column == 0) && ((numColumns & 0x07) == 4) && !corner4Read) {
      result.array[resultOffset++] = (int8_t) [self readCorner4:numRows numColumns:numColumns];
      row -= 2;
      column += 2;
      corner4Read = YES;
    } else {
      do {
        if ((row < numRows) && (column >= 0) && ![self.readMappingMatrix getX:column y:row]) {
          result.array[resultOffset++] = (int8_t) [self readUtah:row column:column numRows:numRows numColumns:numColumns];
        }
        row -= 2;
        column += 2;
      } while ((row >= 0) && (column < numColumns));
      row += 1;
      column += 3;

      do {
        if ((row >= 0) && (column < numColumns) && ![self.readMappingMatrix getX:column y:row]) {
          result.array[resultOffset++] = (int8_t) [self readUtah:row column:column numRows:numRows numColumns:numColumns];
        }
        row += 2;
        column -= 2;
      } while ((row < numRows) && (column >= 0));
      row += 3;
      column += 1;
    }
  } while ((row < numRows) || (column < numColumns));

  if (resultOffset != self.version.totalCodewords) {
    return nil;
  }
  return result;
}

/**
 * Reads a bit of the mapping matrix accounting for boundary wrapping.
 *
 * @param row Row to read in the mapping matrix
 * @param column Column to read in the mapping matrix
 * @param numRows Number of rows in the mapping matrix
 * @param numColumns Number of columns in the mapping matrix
 * @return value of the given bit in the mapping matrix
 */
- (BOOL)readModule:(int)row column:(int)column numRows:(int)numRows numColumns:(int)numColumns {
  if (row < 0) {
    row += numRows;
    column += 4 - ((numRows + 4) & 0x07);
  }
  if (column < 0) {
    column += numColumns;
    row += 4 - ((numColumns + 4) & 0x07);
  }
  [self.readMappingMatrix setX:column y:row];
  return [self.mappingBitMatrix getX:column y:row];
}

/**
 * Reads the 8 bits of the standard Utah-shaped pattern.
 *
 * See ISO 16022:2006, 5.8.1 Figure 6
 *
 * @param row Current row in the mapping matrix, anchored at the 8th bit (LSB) of the pattern
 * @param column Current column in the mapping matrix, anchored at the 8th bit (LSB) of the pattern
 * @param numRows Number of rows in the mapping matrix
 * @param numColumns Number of columns in the mapping matrix
 * @return byte from the utah shape
 */
- (int)readUtah:(int)row column:(int)column numRows:(int)numRows numColumns:(int)numColumns {
  int currentByte = 0;
  if ([self readModule:row - 2 column:column - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:row - 2 column:column - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:row - 1 column:column - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:row - 1 column:column - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:row - 1 column:column numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:row column:column - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:row column:column - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:row column:column numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  return currentByte;
}

/**
 * Reads the 8 bits of the special corner condition 1.
 *
 * See ISO 16022:2006, Figure F.3
 *
 * @param numRows Number of rows in the mapping matrix
 * @param numColumns Number of columns in the mapping matrix
 * @return byte from the Corner condition 1
 */
- (int)readCorner1:(int)numRows numColumns:(int)numColumns {
  int currentByte = 0;
  if ([self readModule:numRows - 1 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:numRows - 1 column:1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:numRows - 1 column:2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:1 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:2 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:3 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  return currentByte;
}

/**
 * Reads the 8 bits of the special corner condition 2.
 *
 * See ISO 16022:2006, Figure F.4
 *
 * @param numRows Number of rows in the mapping matrix
 * @param numColumns Number of columns in the mapping matrix
 * @return byte from the Corner condition 2
 */
- (int)readCorner2:(int)numRows numColumns:(int)numColumns {
  int currentByte = 0;
  if ([self readModule:numRows - 3 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:numRows - 2 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:numRows - 1 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 4 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 3 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:1 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  return currentByte;
}

/**
 * Reads the 8 bits of the special corner condition 3.
 *
 * See ISO 16022:2006, Figure F.5
 *
 * @param numRows Number of rows in the mapping matrix
 * @param numColumns Number of columns in the mapping matrix
 * @return byte from the Corner condition 3
 */
- (int)readCorner3:(int)numRows numColumns:(int)numColumns {
  int currentByte = 0;
  if ([self readModule:numRows - 1 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:numRows - 1 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 3 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:1 column:numColumns - 3 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:1 column:numColumns - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:1 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  return currentByte;
}

/**
 * Reads the 8 bits of the special corner condition 4.
 *
 * See ISO 16022:2006, Figure F.6
 *
 * @param numRows Number of rows in the mapping matrix
 * @param numColumns Number of columns in the mapping matrix
 * @return byte from the Corner condition 4
 */
- (int)readCorner4:(int)numRows numColumns:(int)numColumns {
  int currentByte = 0;
  if ([self readModule:numRows - 3 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:numRows - 2 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:numRows - 1 column:0 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 2 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:0 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:1 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:2 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  currentByte <<= 1;
  if ([self readModule:3 column:numColumns - 1 numRows:numRows numColumns:numColumns]) {
    currentByte |= 1;
  }
  return currentByte;
}

/**
 * Extracts the data region from a ZXBitMatrix that contains
 * alignment patterns.
 *
 * @param bitMatrix Original ZXBitMatrix with alignment patterns
 * @return BitMatrix that has the alignment patterns removed
 */
- (ZXBitMatrix *)extractDataRegion:(ZXBitMatrix *)bitMatrix {
  int symbolSizeRows = self.version.symbolSizeRows;
  int symbolSizeColumns = self.version.symbolSizeColumns;

  if (bitMatrix.height != symbolSizeRows) {
    [NSException raise:NSInvalidArgumentException format:@"Dimension of bitMatrix must match the version size"];
  }

  int dataRegionSizeRows = self.version.dataRegionSizeRows;
  int dataRegionSizeColumns = self.version.dataRegionSizeColumns;

  int numDataRegionsRow = symbolSizeRows / dataRegionSizeRows;
  int numDataRegionsColumn = symbolSizeColumns / dataRegionSizeColumns;

  int sizeDataRegionRow = numDataRegionsRow * dataRegionSizeRows;
  int sizeDataRegionColumn = numDataRegionsColumn * dataRegionSizeColumns;

  ZXBitMatrix *bitMatrixWithoutAlignment = [[ZXBitMatrix alloc] initWithWidth:sizeDataRegionColumn height:sizeDataRegionRow];
  for (int dataRegionRow = 0; dataRegionRow < numDataRegionsRow; ++dataRegionRow) {
    int dataRegionRowOffset = dataRegionRow * dataRegionSizeRows;
    for (int dataRegionColumn = 0; dataRegionColumn < numDataRegionsColumn; ++dataRegionColumn) {
      int dataRegionColumnOffset = dataRegionColumn * dataRegionSizeColumns;
      for (int i = 0; i < dataRegionSizeRows; ++i) {
        int readRowOffset = dataRegionRow * (dataRegionSizeRows + 2) + 1 + i;
        int writeRowOffset = dataRegionRowOffset + i;
        for (int j = 0; j < dataRegionSizeColumns; ++j) {
          int readColumnOffset = dataRegionColumn * (dataRegionSizeColumns + 2) + 1 + j;
          if ([bitMatrix getX:readColumnOffset y:readRowOffset]) {
            int writeColumnOffset = dataRegionColumnOffset + j;
            [bitMatrixWithoutAlignment setX:writeColumnOffset y:writeRowOffset];
          }
        }
      }
    }
  }

  return bitMatrixWithoutAlignment;
}

@end
