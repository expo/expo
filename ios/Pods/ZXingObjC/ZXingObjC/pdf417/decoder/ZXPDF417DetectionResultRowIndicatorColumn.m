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

#import "ZXIntArray.h"
#import "ZXPDF417BarcodeMetadata.h"
#import "ZXPDF417BarcodeValue.h"
#import "ZXPDF417BoundingBox.h"
#import "ZXPDF417Codeword.h"
#import "ZXPDF417Common.h"
#import "ZXPDF417DetectionResult.h"
#import "ZXPDF417DetectionResultRowIndicatorColumn.h"
#import "ZXResultPoint.h"

@implementation ZXPDF417DetectionResultRowIndicatorColumn

- (id)initWithBoundingBox:(ZXPDF417BoundingBox *)boundingBox isLeft:(BOOL)isLeft {
  self = [super initWithBoundingBox:boundingBox];
  if (self) {
    _isLeft = isLeft;
  }

  return self;
}

- (void)setRowNumbers {
  for (ZXPDF417Codeword *codeword in [self codewords]) {
    if ((id)codeword != [NSNull null]) {
      [codeword setRowNumberAsRowIndicatorColumn];
    }
  }
}

// TODO implement properly
// TODO maybe we should add missing codewords to store the correct row number to make
// finding row numbers for other columns easier
// use row height count to make detection of invalid row numbers more reliable
- (int)adjustCompleteIndicatorColumnRowNumbers:(ZXPDF417BarcodeMetadata *)barcodeMetadata {
  [self setRowNumbers];
  [self removeIncorrectCodewords:barcodeMetadata];
  ZXResultPoint *top = self.isLeft ? self.boundingBox.topLeft : self.boundingBox.topRight;
  ZXResultPoint *bottom = self.isLeft ? self.boundingBox.bottomLeft : self.boundingBox.bottomRight;
  int firstRow = [self imageRowToCodewordIndex:(int) top.y];
  int lastRow = [self imageRowToCodewordIndex:(int) bottom.y];
  // We need to be careful using the average row height. Barcode could be skewed so that we have smaller and
  // taller rows
  float averageRowHeight = (lastRow - firstRow) / (float) barcodeMetadata.rowCount;
  int barcodeRow = -1;
  int maxRowHeight = 1;
  int currentRowHeight = 0;
  for (int codewordsRow = firstRow; codewordsRow < lastRow; codewordsRow++) {
    if (self.codewords[codewordsRow] == [NSNull null]) {
      continue;
    }
    ZXPDF417Codeword *codeword = self.codewords[codewordsRow];

    //      float expectedRowNumber = (codewordsRow - firstRow) / averageRowHeight;
    //      if (Math.abs(codeword.getRowNumber() - expectedRowNumber) > 2) {
    //        SimpleLog.log(LEVEL.WARNING,
    //            "Removing codeword, rowNumberSkew too high, codeword[" + codewordsRow + "]: Expected Row: " +
    //                expectedRowNumber + ", RealRow: " + codeword.getRowNumber() + ", value: " + codeword.getValue());
    //        codewords[codewordsRow] = null;
    //      }

    int rowDifference = codeword.rowNumber - barcodeRow;

    // TODO improve handling with case where first row indicator doesn't start with 0

    if (rowDifference == 0) {
      currentRowHeight++;
    } else if (rowDifference == 1) {
      maxRowHeight = MAX(maxRowHeight, currentRowHeight);
      currentRowHeight = 1;
      barcodeRow = codeword.rowNumber;
    } else if (rowDifference < 0 ||
               codeword.rowNumber >= barcodeMetadata.rowCount ||
               rowDifference > codewordsRow) {
      self.codewords[codewordsRow] = [NSNull null];
    } else {
      int checkedRows;
      if (maxRowHeight > 2) {
        checkedRows = (maxRowHeight - 2) * rowDifference;
      } else {
        checkedRows = rowDifference;
      }
      BOOL closePreviousCodewordFound = checkedRows >= codewordsRow;
      for (int i = 1; i <= checkedRows && !closePreviousCodewordFound; i++) {
        // there must be (height * rowDifference) number of codewords missing. For now we assume height = 1.
        // This should hopefully get rid of most problems already.
        closePreviousCodewordFound = self.codewords[codewordsRow - i] != [NSNull null];
      }
      if (closePreviousCodewordFound) {
        self.codewords[codewordsRow] = [NSNull null];
      } else {
        barcodeRow = codeword.rowNumber;
        currentRowHeight = 1;
      }
    }
  }
  return (int) (averageRowHeight + 0.5);
}

- (BOOL)getRowHeights:(ZXIntArray **)rowHeights {
  ZXPDF417BarcodeMetadata *barcodeMetadata = [self barcodeMetadata];
  if (!barcodeMetadata) {
    *rowHeights = nil;
    return YES;
  }
  [self adjustIncompleteIndicatorColumnRowNumbers:barcodeMetadata];
  ZXIntArray *result = [[ZXIntArray alloc] initWithLength:barcodeMetadata.rowCount];
  for (ZXPDF417Codeword *codeword in [self codewords]) {
    if ((id)codeword != [NSNull null]) {
      int rowNumber = codeword.rowNumber;
      if (rowNumber >= result.length) {
        *rowHeights = nil;
        // We have more rows than the barcode metadata allows for, ignore them.
        continue;
      }
      result.array[rowNumber]++;
    } // else throw exception?
  }
  *rowHeights = result;
  return YES;
}

// TODO maybe we should add missing codewords to store the correct row number to make
// finding row numbers for other columns easier
// use row height count to make detection of invalid row numbers more reliable
- (int)adjustIncompleteIndicatorColumnRowNumbers:(ZXPDF417BarcodeMetadata *)barcodeMetadata {
  ZXResultPoint *top = self.isLeft ? self.boundingBox.topLeft : self.boundingBox.topRight;
  ZXResultPoint *bottom = self.isLeft ? self.boundingBox.bottomLeft : self.boundingBox.bottomRight;
  int firstRow = [self imageRowToCodewordIndex:(int) top.y];
  int lastRow = [self imageRowToCodewordIndex:(int) bottom.y];
  float averageRowHeight = (lastRow - firstRow) / (float) barcodeMetadata.rowCount;
  int barcodeRow = -1;
  int maxRowHeight = 1;
  int currentRowHeight = 0;
  for (int codewordsRow = firstRow; codewordsRow < lastRow; codewordsRow++) {
    if (self.codewords[codewordsRow] == [NSNull null]) {
      continue;
    }
    ZXPDF417Codeword *codeword = self.codewords[codewordsRow];

    [codeword setRowNumberAsRowIndicatorColumn];

    int rowDifference = codeword.rowNumber - barcodeRow;

    // TODO improve handling with case where first row indicator doesn't start with 0

    if (rowDifference == 0) {
      currentRowHeight++;
    } else if (rowDifference == 1) {
      maxRowHeight = MAX(maxRowHeight, currentRowHeight);
      currentRowHeight = 1;
      barcodeRow = codeword.rowNumber;
    } else if (codeword.rowNumber >= barcodeMetadata.rowCount) {
      self.codewords[codewordsRow] = [NSNull null];
    } else {
      barcodeRow = codeword.rowNumber;
      currentRowHeight = 1;
    }
  }
  return (int) (averageRowHeight + 0.5);
}

- (ZXPDF417BarcodeMetadata *)barcodeMetadata {
  ZXPDF417BarcodeValue *barcodeColumnCount = [[ZXPDF417BarcodeValue alloc] init];
  ZXPDF417BarcodeValue *barcodeRowCountUpperPart = [[ZXPDF417BarcodeValue alloc] init];
  ZXPDF417BarcodeValue *barcodeRowCountLowerPart = [[ZXPDF417BarcodeValue alloc] init];
  ZXPDF417BarcodeValue *barcodeECLevel = [[ZXPDF417BarcodeValue alloc] init];
  for (ZXPDF417Codeword *codeword in self.codewords) {
    if ((id)codeword == [NSNull null]) {
      continue;
    }
    [codeword setRowNumberAsRowIndicatorColumn];
    int rowIndicatorValue = codeword.value % 30;
    int codewordRowNumber = codeword.rowNumber;
    if (!self.isLeft) {
      codewordRowNumber += 2;
    }
    switch (codewordRowNumber % 3) {
      case 0:
        [barcodeRowCountUpperPart setValue:rowIndicatorValue * 3 + 1];
        break;
      case 1:
        [barcodeECLevel setValue:rowIndicatorValue / 3];
        [barcodeRowCountLowerPart setValue:rowIndicatorValue % 3];
        break;
      case 2:
        [barcodeColumnCount setValue:rowIndicatorValue + 1];
        break;
    }
  }
  // Maybe we should check if we have ambiguous values?
  if (([barcodeColumnCount value].length == 0) ||
      ([barcodeRowCountUpperPart value].length == 0) ||
      ([barcodeRowCountLowerPart value].length == 0) ||
      ([barcodeECLevel value].length == 0) ||
      [barcodeColumnCount value].array[0] < 1 ||
      [barcodeRowCountUpperPart value].array[0] + [barcodeRowCountLowerPart value].array[0] < ZX_PDF417_MIN_ROWS_IN_BARCODE ||
      [barcodeRowCountUpperPart value].array[0] + [barcodeRowCountLowerPart value].array[0] > ZX_PDF417_MAX_ROWS_IN_BARCODE) {
    return nil;
  }
  ZXPDF417BarcodeMetadata *barcodeMetadata = [[ZXPDF417BarcodeMetadata alloc] initWithColumnCount:[barcodeColumnCount value].array[0]
                                                                                rowCountUpperPart:[barcodeRowCountUpperPart value].array[0]
                                                                                rowCountLowerPart:[barcodeRowCountLowerPart value].array[0]
                                                                             errorCorrectionLevel:[barcodeECLevel value].array[0]];
  [self removeIncorrectCodewords:barcodeMetadata];
  return barcodeMetadata;
}

- (void)removeIncorrectCodewords:(ZXPDF417BarcodeMetadata *)barcodeMetadata {
  // Remove codewords which do not match the metadata
  // TODO Maybe we should keep the incorrect codewords for the start and end positions?
  for (int codewordRow = 0; codewordRow < [self.codewords count]; codewordRow++) {
    ZXPDF417Codeword *codeword = self.codewords[codewordRow];
    if (self.codewords[codewordRow] == [NSNull null]) {
      continue;
    }
    int rowIndicatorValue = codeword.value % 30;
    int codewordRowNumber = codeword.rowNumber;
    if (codewordRowNumber > barcodeMetadata.rowCount) {
      self.codewords[codewordRow] = [NSNull null];
      continue;
    }
    if (!self.isLeft) {
      codewordRowNumber += 2;
    }
    switch (codewordRowNumber % 3) {
      case 0:
        if (rowIndicatorValue * 3 + 1 != barcodeMetadata.rowCountUpperPart) {
          self.codewords[codewordRow] = [NSNull null];
        }
        break;
      case 1:
        if (rowIndicatorValue / 3 != barcodeMetadata.errorCorrectionLevel ||
            rowIndicatorValue % 3 != barcodeMetadata.rowCountLowerPart) {
          self.codewords[codewordRow] = [NSNull null];
        }
        break;
      case 2:
        if (rowIndicatorValue + 1 != barcodeMetadata.columnCount) {
          self.codewords[codewordRow] = [NSNull null];
        }
        break;
    }
  }
}

- (NSString *)description {
  return [NSString stringWithFormat:@"IsLeft: %@\n%@", @(self.isLeft), [super description]];
}

@end
