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

#import "ZXBitMatrix.h"
#import "ZXDecoderResult.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXPDF417BarcodeMetadata.h"
#import "ZXPDF417BarcodeValue.h"
#import "ZXPDF417BoundingBox.h"
#import "ZXPDF417Codeword.h"
#import "ZXPDF417CodewordDecoder.h"
#import "ZXPDF417Common.h"
#import "ZXPDF417DecodedBitStreamParser.h"
#import "ZXPDF417DetectionResult.h"
#import "ZXPDF417DetectionResultRowIndicatorColumn.h"
#import "ZXPDF417ECErrorCorrection.h"
#import "ZXPDF417ScanningDecoder.h"
#import "ZXResultPoint.h"

const int ZX_PDF417_CODEWORD_SKEW_SIZE = 2;

const int ZX_PDF417_MAX_ERRORS = 3;
const int ZX_PDF417_MAX_EC_CODEWORDS = 512;
static ZXPDF417ECErrorCorrection *errorCorrection;

@implementation ZXPDF417ScanningDecoder

+ (void)initialize {
  if ([self class] != [ZXPDF417ScanningDecoder class]) return;

  errorCorrection = [[ZXPDF417ECErrorCorrection alloc] init];
}

// TODO don't pass in minCodewordWidth and maxCodewordWidth, pass in barcode columns for start and stop pattern
// columns. That way width can be deducted from the pattern column.
// This approach also allows to detect more details about the barcode, e.g. if a bar type (white or black) is wider
// than it should be. This can happen if the scanner used a bad blackpoint.
+ (ZXDecoderResult *)decode:(ZXBitMatrix *)image
               imageTopLeft:(ZXResultPoint *)imageTopLeft
            imageBottomLeft:(ZXResultPoint *)imageBottomLeft
              imageTopRight:(ZXResultPoint *)imageTopRight
           imageBottomRight:(ZXResultPoint *)imageBottomRight
           minCodewordWidth:(int)minCodewordWidth
           maxCodewordWidth:(int)maxCodewordWidth
                      error:(NSError **)error {
  ZXPDF417BoundingBox *boundingBox = [[ZXPDF417BoundingBox alloc] initWithImage:image topLeft:imageTopLeft bottomLeft:imageBottomLeft topRight:imageTopRight bottomRight:imageBottomRight];
  ZXPDF417DetectionResultRowIndicatorColumn *leftRowIndicatorColumn;
  ZXPDF417DetectionResultRowIndicatorColumn *rightRowIndicatorColumn;
  ZXPDF417DetectionResult *detectionResult;
  for (int i = 0; i < 2; i++) {
    if (imageTopLeft) {
      leftRowIndicatorColumn = [self rowIndicatorColumn:image boundingBox:boundingBox startPoint:imageTopLeft leftToRight:YES
                                       minCodewordWidth:minCodewordWidth maxCodewordWidth:maxCodewordWidth];
    }
    if (imageTopRight) {
      rightRowIndicatorColumn = [self rowIndicatorColumn:image boundingBox:boundingBox startPoint:imageTopRight leftToRight:NO
                                        minCodewordWidth:minCodewordWidth maxCodewordWidth:maxCodewordWidth];
    }
    detectionResult = [self merge:leftRowIndicatorColumn rightRowIndicatorColumn:rightRowIndicatorColumn error:error];
    if (!detectionResult) {
      return nil;
    }
    if (i == 0 && detectionResult.boundingBox &&
        (detectionResult.boundingBox.minY < boundingBox.minY ||
         detectionResult.boundingBox.maxY > boundingBox.maxY)) {
      boundingBox = [detectionResult boundingBox];
    } else {
      detectionResult.boundingBox = boundingBox;
      break;
    }
  }
  int maxBarcodeColumn = detectionResult.barcodeColumnCount + 1;
  [detectionResult setDetectionResultColumn:0 detectionResultColumn:leftRowIndicatorColumn];
  [detectionResult setDetectionResultColumn:maxBarcodeColumn detectionResultColumn:rightRowIndicatorColumn];

  BOOL leftToRight = leftRowIndicatorColumn != nil;
  for (int barcodeColumnCount = 1; barcodeColumnCount <= maxBarcodeColumn; barcodeColumnCount++) {
    int barcodeColumn = leftToRight ? barcodeColumnCount : maxBarcodeColumn - barcodeColumnCount;
    if ([detectionResult detectionResultColumn:barcodeColumn]) {
      // This will be the case for the opposite row indicator column, which doesn't need to be decoded again.
      continue;
    }
    ZXPDF417DetectionResultColumn *detectionResultColumn;
    if (barcodeColumn == 0 || barcodeColumn == maxBarcodeColumn) {
      detectionResultColumn = [[ZXPDF417DetectionResultRowIndicatorColumn alloc] initWithBoundingBox:boundingBox isLeft:barcodeColumn == 0];
    } else {
      detectionResultColumn = [[ZXPDF417DetectionResultColumn alloc] initWithBoundingBox:boundingBox];
    }
    [detectionResult setDetectionResultColumn:barcodeColumn detectionResultColumn:detectionResultColumn];
    int startColumn = -1;
    int previousStartColumn = startColumn;
    // TODO start at a row for which we know the start position, then detect upwards and downwards from there.
    for (int imageRow = boundingBox.minY; imageRow <= boundingBox.maxY; imageRow++) {
      startColumn = [self startColumn:detectionResult barcodeColumn:barcodeColumn imageRow:imageRow leftToRight:leftToRight];
      if (startColumn < 0 || startColumn > boundingBox.maxX) {
        if (previousStartColumn == -1) {
          continue;
        }
        startColumn = previousStartColumn;
      }
      ZXPDF417Codeword *codeword = [self detectCodeword:image minColumn:boundingBox.minX maxColumn:boundingBox.maxX leftToRight:leftToRight
                                            startColumn:startColumn imageRow:imageRow minCodewordWidth:minCodewordWidth maxCodewordWidth:maxCodewordWidth];
      if (codeword) {
        [detectionResultColumn setCodeword:imageRow codeword:codeword];
        previousStartColumn = startColumn;
        minCodewordWidth = MIN(minCodewordWidth, codeword.width);
        maxCodewordWidth = MAX(maxCodewordWidth, codeword.width);
      }
    }
  }
  return [self createDecoderResult:detectionResult error:error];
}

+ (ZXPDF417DetectionResult *)merge:(ZXPDF417DetectionResultRowIndicatorColumn *)leftRowIndicatorColumn
           rightRowIndicatorColumn:(ZXPDF417DetectionResultRowIndicatorColumn *)rightRowIndicatorColumn
                             error:(NSError **)error {
  if (!leftRowIndicatorColumn && !rightRowIndicatorColumn) {
    return nil;
  }
  ZXPDF417BarcodeMetadata *barcodeMetadata = [self barcodeMetadata:leftRowIndicatorColumn rightRowIndicatorColumn:rightRowIndicatorColumn];
  if (!barcodeMetadata) {
    return nil;
  }
  ZXPDF417BoundingBox *leftBoundingBox, *rightBoundingBox;
  if (![self adjustBoundingBox:&leftBoundingBox rowIndicatorColumn:leftRowIndicatorColumn error:error]) {
    return nil;
  }
  if (![self adjustBoundingBox:&rightBoundingBox rowIndicatorColumn:rightRowIndicatorColumn error:error]) {
    return nil;
  }

  ZXPDF417BoundingBox *boundingBox = [ZXPDF417BoundingBox mergeLeftBox:leftBoundingBox rightBox:rightBoundingBox];
  if (!boundingBox) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  return [[ZXPDF417DetectionResult alloc] initWithBarcodeMetadata:barcodeMetadata boundingBox:boundingBox];
}

+ (BOOL)adjustBoundingBox:(ZXPDF417BoundingBox **)boundingBox
       rowIndicatorColumn:(ZXPDF417DetectionResultRowIndicatorColumn *)rowIndicatorColumn
                    error:(NSError **)error {
  if (!rowIndicatorColumn) {
    *boundingBox = nil;
    return YES;
  }
  ZXIntArray *rowHeights;
  if (![rowIndicatorColumn getRowHeights:&rowHeights]) {
    if (error) *error = ZXFormatErrorInstance();
    *boundingBox = nil;
    return NO;
  }
  if (!rowHeights) {
    *boundingBox = nil;
    return YES;
  }
  int maxRowHeight = [self max:rowHeights];
  int missingStartRows = 0;
  for (int i = 0; i < rowHeights.length; i++) {
    int rowHeight = rowHeights.array[i];
    missingStartRows += maxRowHeight - rowHeight;
    if (rowHeight > 0) {
      break;
    }
  }
  NSArray *codewords = rowIndicatorColumn.codewords;
  for (int row = 0; missingStartRows > 0 && codewords[row] == [NSNull null]; row++) {
    missingStartRows--;
  }
  int missingEndRows = 0;
  for (int row = rowHeights.length - 1; row >= 0; row--) {
    missingEndRows += maxRowHeight - rowHeights.array[row];
    if (rowHeights.array[row] > 0) {
      break;
    }
  }
  for (int row = (int)[codewords count] - 1; missingEndRows > 0 && codewords[row] == [NSNull null]; row--) {
    missingEndRows--;
  }
  *boundingBox = [rowIndicatorColumn.boundingBox addMissingRows:missingStartRows
                                                 missingEndRows:missingEndRows
                                                         isLeft:rowIndicatorColumn.isLeft];
  return *boundingBox != nil;
}

+ (int)max:(ZXIntArray *)values {
  int maxValue = -1;
  for (int i = 0; i < values.length; i++) {
    int value = values.array[i];
    maxValue = MAX(maxValue, value);
  }
  return maxValue;
}

+ (ZXPDF417BarcodeMetadata *)barcodeMetadata:(ZXPDF417DetectionResultRowIndicatorColumn *)leftRowIndicatorColumn
                     rightRowIndicatorColumn:(ZXPDF417DetectionResultRowIndicatorColumn *)rightRowIndicatorColumn {
  ZXPDF417BarcodeMetadata *leftBarcodeMetadata;
  if (!leftRowIndicatorColumn ||
      !(leftBarcodeMetadata = leftRowIndicatorColumn.barcodeMetadata)) {
    return rightRowIndicatorColumn ? rightRowIndicatorColumn.barcodeMetadata : nil;
  }
  ZXPDF417BarcodeMetadata *rightBarcodeMetadata;
  if (!rightRowIndicatorColumn ||
      !(rightBarcodeMetadata = rightRowIndicatorColumn.barcodeMetadata)) {
    return leftRowIndicatorColumn.barcodeMetadata;
  }

  if (leftBarcodeMetadata.columnCount != rightBarcodeMetadata.columnCount &&
      leftBarcodeMetadata.errorCorrectionLevel != rightBarcodeMetadata.errorCorrectionLevel &&
      leftBarcodeMetadata.rowCount != rightBarcodeMetadata.rowCount) {
    return nil;
  }
  return leftBarcodeMetadata;
}

+ (ZXPDF417DetectionResultRowIndicatorColumn *)rowIndicatorColumn:(ZXBitMatrix *)image
                                                      boundingBox:(ZXPDF417BoundingBox *)boundingBox
                                                       startPoint:(ZXResultPoint *)startPoint
                                                      leftToRight:(BOOL)leftToRight
                                                 minCodewordWidth:(int)minCodewordWidth
                                                 maxCodewordWidth:(int)maxCodewordWidth {
  ZXPDF417DetectionResultRowIndicatorColumn *rowIndicatorColumn = [[ZXPDF417DetectionResultRowIndicatorColumn alloc] initWithBoundingBox:boundingBox
                                                                                                                                  isLeft:leftToRight];
  for (int i = 0; i < 2; i++) {
    int increment = i == 0 ? 1 : -1;
    int startColumn = (int) startPoint.x;
    for (int imageRow = (int) startPoint.y; imageRow <= boundingBox.maxY &&
        imageRow >= boundingBox.minY; imageRow += increment) {
      ZXPDF417Codeword *codeword = [self detectCodeword:image minColumn:0 maxColumn:image.width leftToRight:leftToRight startColumn:startColumn imageRow:imageRow
                                       minCodewordWidth:minCodewordWidth maxCodewordWidth:maxCodewordWidth];
      if (codeword) {
        [rowIndicatorColumn setCodeword:imageRow codeword:codeword];
        if (leftToRight) {
          startColumn = codeword.startX;
        } else {
          startColumn = codeword.endX;
        }
      }
    }
  }
  return rowIndicatorColumn;
}

+ (BOOL)adjustCodewordCount:(ZXPDF417DetectionResult *)detectionResult barcodeMatrix:(NSArray *)barcodeMatrix {
  ZXIntArray *numberOfCodewords = [(ZXPDF417BarcodeValue *)barcodeMatrix[0][1] value];
  int calculatedNumberOfCodewords = [detectionResult barcodeColumnCount] * [detectionResult barcodeRowCount];
    [self numberOfECCodeWords:detectionResult.barcodeECLevel];
  if (numberOfCodewords.length == 0) {
    if (calculatedNumberOfCodewords < 1 || calculatedNumberOfCodewords > ZX_PDF417_MAX_CODEWORDS_IN_BARCODE) {
      return NO;
    }
    [(ZXPDF417BarcodeValue *)barcodeMatrix[0][1] setValue:calculatedNumberOfCodewords];
  } else if (numberOfCodewords.array[0] != calculatedNumberOfCodewords) {
    // The calculated one is more reliable as it is derived from the row indicator columns
    [(ZXPDF417BarcodeValue *)barcodeMatrix[0][1] setValue:calculatedNumberOfCodewords];
  }

  return YES;
}

+ (ZXDecoderResult *)createDecoderResult:(ZXPDF417DetectionResult *)detectionResult error:(NSError **)error {
  NSArray *barcodeMatrix = [self createBarcodeMatrix:detectionResult];
  if (!barcodeMatrix) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }
  if (![self adjustCodewordCount:detectionResult barcodeMatrix:barcodeMatrix]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  NSMutableArray *erasures = [NSMutableArray array];
  ZXIntArray *codewords = [[ZXIntArray alloc] initWithLength:detectionResult.barcodeRowCount * detectionResult.barcodeColumnCount];
  NSMutableArray *ambiguousIndexValuesList = [NSMutableArray array];
  NSMutableArray *ambiguousIndexesList = [NSMutableArray array];
  for (int row = 0; row < detectionResult.barcodeRowCount; row++) {
    for (int column = 0; column < detectionResult.barcodeColumnCount; column++) {
      ZXIntArray *values = [(ZXPDF417BarcodeValue *)barcodeMatrix[row][column + 1] value];
      int codewordIndex = row * detectionResult.barcodeColumnCount + column;
      if (values.length == 0) {
        [erasures addObject:@(codewordIndex)];
      } else if (values.length == 1) {
        codewords.array[codewordIndex] = values.array[0];
      } else {
        [ambiguousIndexesList addObject:@(codewordIndex)];
        [ambiguousIndexValuesList addObject:values];
      }
    }
  }
  return [self createDecoderResultFromAmbiguousValues:detectionResult.barcodeECLevel
                                            codewords:codewords
                                         erasureArray:[ZXPDF417Common toIntArray:erasures]
                                     ambiguousIndexes:[ZXPDF417Common toIntArray:ambiguousIndexesList]
                                 ambiguousIndexValues:ambiguousIndexValuesList
                                                error:error];
}

/**
 * This method deals with the fact, that the decoding process doesn't always yield a single most likely value. The
 * current error correction implementation doesn't deal with erasures very well, so it's better to provide a value
 * for these ambiguous codewords instead of treating it as an erasure. The problem is that we don't know which of
 * the ambiguous values to choose. We try decode using the first value, and if that fails, we use another of the
 * ambiguous values and try to decode again. This usually only happens on very hard to read and decode barcodes,
 * so decoding the normal barcodes is not affected by this.
 *
 * @param erasureArray contains the indexes of erasures
 * @param ambiguousIndexes array with the indexes that have more than one most likely value
 * @param ambiguousIndexValues two dimensional array that contains the ambiguous values. The first dimension must
 * be the same length as the ambiguousIndexes array
 */
+ (ZXDecoderResult *)createDecoderResultFromAmbiguousValues:(int)ecLevel
                                                  codewords:(ZXIntArray *)codewords
                                               erasureArray:(ZXIntArray *)erasureArray
                                           ambiguousIndexes:(ZXIntArray *)ambiguousIndexes
                                       ambiguousIndexValues:(NSArray *)ambiguousIndexValues
                                                      error:(NSError **)error {
  ZXIntArray *ambiguousIndexCount = [[ZXIntArray alloc] initWithLength:ambiguousIndexes.length];

  int tries = 100;
  while (tries-- > 0) {
    for (int i = 0; i < ambiguousIndexCount.length; i++) {
      ZXIntArray *a = ambiguousIndexValues[i];
      codewords.array[ambiguousIndexes.array[i]] = a.array[(ambiguousIndexCount.array[i] + 1) % [(ZXIntArray *)ambiguousIndexValues[i] length]];
    }
    NSError *e;
    ZXDecoderResult *result = [self decodeCodewords:codewords ecLevel:ecLevel erasures:erasureArray error:&e];
    if (result) {
      return result;
    } else if (e.code != ZXChecksumError) {
      if (error) *error = e;
      return nil;
    }
    if (ambiguousIndexCount.length == 0) {
      if (error) *error = ZXChecksumErrorInstance();
      return nil;
    }
    for (int i = 0; i < ambiguousIndexCount.length; i++) {
      if (ambiguousIndexCount.array[i] < [(ZXIntArray *)ambiguousIndexValues[i] length] - 1) {
        ambiguousIndexCount.array[i]++;
        break;
      } else {
        ambiguousIndexCount.array[i] = 0;
        if (i == ambiguousIndexes.length - 1) {
          if (error) *error = ZXChecksumErrorInstance();
          return nil;
        }
      }
    }
  }

  if (error) *error = ZXChecksumErrorInstance();
  return nil;
}

+ (NSArray *)createBarcodeMatrix:(ZXPDF417DetectionResult *)detectionResult {
  NSMutableArray *barcodeMatrix = [NSMutableArray array];
  for (int row = 0; row < detectionResult.barcodeRowCount; row++) {
    [barcodeMatrix addObject:[NSMutableArray array]];
    for (int column = 0; column < detectionResult.barcodeColumnCount + 2; column++) {
      barcodeMatrix[row][column] = [[ZXPDF417BarcodeValue alloc] init];
    }
  }

  int column = 0;
  for (ZXPDF417DetectionResultColumn *detectionResultColumn in [detectionResult detectionResultColumns]) {
    if ((id)detectionResultColumn != [NSNull null]) {
      for (ZXPDF417Codeword *codeword in detectionResultColumn.codewords) {
        if ((id)codeword != [NSNull null]) {
          int rowNumber = codeword.rowNumber;
          if (rowNumber >= 0) {
            if (rowNumber >= barcodeMatrix.count) {
              // We have more rows than the barcode metadata allows for, ignore them.
              continue;
            }
            [(ZXPDF417BarcodeValue *)barcodeMatrix[rowNumber][column] setValue:codeword.value];
          }
        }
      }
    }
    column++;
  }

  return barcodeMatrix;
}

+ (BOOL)isValidBarcodeColumn:(ZXPDF417DetectionResult *)detectionResult barcodeColumn:(int)barcodeColumn {
  return barcodeColumn >= 0 && barcodeColumn <= detectionResult.barcodeColumnCount + 1;
}

+ (int)startColumn:(ZXPDF417DetectionResult *)detectionResult
     barcodeColumn:(int)barcodeColumn
          imageRow:(int)imageRow
       leftToRight:(BOOL)leftToRight {
  int offset = leftToRight ? 1 : -1;
  ZXPDF417Codeword *codeword;
  if ([self isValidBarcodeColumn:detectionResult barcodeColumn:barcodeColumn - offset]) {
    codeword = [[detectionResult detectionResultColumn:barcodeColumn - offset] codeword:imageRow];
  }
  if (codeword) {
    return leftToRight ? codeword.endX : codeword.startX;
  }
  codeword = [[detectionResult detectionResultColumn:barcodeColumn] codewordNearby:imageRow];
  if (codeword) {
    return leftToRight ? codeword.startX : codeword.endX;
  }
  if ([self isValidBarcodeColumn:detectionResult barcodeColumn:barcodeColumn - offset]) {
    codeword = [[detectionResult detectionResultColumn:barcodeColumn - offset] codewordNearby:imageRow];
  }
  if (codeword) {
    return leftToRight ? codeword.endX : codeword.startX;
  }
  int skippedColumns = 0;

  while ([self isValidBarcodeColumn:detectionResult barcodeColumn:barcodeColumn - offset]) {
    barcodeColumn -= offset;
    for (ZXPDF417Codeword *previousRowCodeword in [detectionResult detectionResultColumn:barcodeColumn].codewords) {
      if ((id)previousRowCodeword != [NSNull null]) {
        return (leftToRight ? previousRowCodeword.endX : previousRowCodeword.startX) +
          offset *
          skippedColumns *
          (previousRowCodeword.endX - previousRowCodeword.startX);
      }
    }
    skippedColumns++;
  }
  return leftToRight ? detectionResult.boundingBox.minX : detectionResult.boundingBox.maxX;
}

+ (ZXPDF417Codeword *)detectCodeword:(ZXBitMatrix *)image
                           minColumn:(int)minColumn
                           maxColumn:(int)maxColumn
                         leftToRight:(BOOL)leftToRight
                         startColumn:(int)startColumn
                            imageRow:(int)imageRow
                    minCodewordWidth:(int)minCodewordWidth
                    maxCodewordWidth:(int)maxCodewordWidth {
  startColumn = [self adjustCodewordStartColumn:image minColumn:minColumn maxColumn:maxColumn leftToRight:leftToRight codewordStartColumn:startColumn imageRow:imageRow];
  // we usually know fairly exact now how long a codeword is. We should provide minimum and maximum expected length
  // and try to adjust the read pixels, e.g. remove single pixel errors or try to cut off exceeding pixels.
  // min and maxCodewordWidth should not be used as they are calculated for the whole barcode an can be inaccurate
  // for the current position
  NSMutableArray *moduleBitCount = [self moduleBitCount:image minColumn:minColumn maxColumn:maxColumn leftToRight:leftToRight startColumn:startColumn imageRow:imageRow];
  if (!moduleBitCount) {
    return nil;
  }
  int endColumn;
  int codewordBitCount = [ZXPDF417Common bitCountSum:moduleBitCount];
  if (leftToRight) {
    endColumn = startColumn + codewordBitCount;
  } else {
    for (int i = 0; i < [moduleBitCount count] / 2; i++) {
      int tmpCount = [moduleBitCount[i] intValue];
      moduleBitCount[i] = moduleBitCount[[moduleBitCount count] - 1 - i];
      moduleBitCount[[moduleBitCount count] - 1 - i] = @(tmpCount);
    }
    endColumn = startColumn;
    startColumn = endColumn - codewordBitCount;
  }
  // TODO implement check for width and correction of black and white bars
  // use start (and maybe stop pattern) to determine if blackbars are wider than white bars. If so, adjust.
  // should probably done only for codewords with a lot more than 17 bits.
  // The following fixes 10-1.png, which has wide black bars and small white bars
  //    for (int i = 0; i < moduleBitCount.length; i++) {
  //      if (i % 2 == 0) {
  //        moduleBitCount[i]--;
  //      } else {
  //        moduleBitCount[i]++;
  //      }
  //    }

  // We could also use the width of surrounding codewords for more accurate results, but this seems
  // sufficient for now
  if (![self checkCodewordSkew:codewordBitCount minCodewordWidth:minCodewordWidth maxCodewordWidth:maxCodewordWidth]) {
    // We could try to use the startX and endX position of the codeword in the same column in the previous row,
    // create the bit count from it and normalize it to 8. This would help with single pixel errors.
    return nil;
  }

  int decodedValue = [ZXPDF417CodewordDecoder decodedValue:moduleBitCount];
  int codeword = [ZXPDF417Common codeword:decodedValue];
  if (codeword == -1) {
    return nil;
  }
  return [[ZXPDF417Codeword alloc] initWithStartX:startColumn endX:endColumn bucket:[self codewordBucketNumber:decodedValue] value:codeword];
}

+ (NSMutableArray *)moduleBitCount:(ZXBitMatrix *)image
                         minColumn:(int)minColumn
                         maxColumn:(int)maxColumn
                       leftToRight:(BOOL)leftToRight
                       startColumn:(int)startColumn
                          imageRow:(int)imageRow {
  int imageColumn = startColumn;
  NSMutableArray *moduleBitCount = [NSMutableArray arrayWithCapacity:8];
  for (int i = 0; i < 8; i++) {
    [moduleBitCount addObject:@0];
  }
  int moduleNumber = 0;
  int increment = leftToRight ? 1 : -1;
  BOOL previousPixelValue = leftToRight;
  while (((leftToRight && imageColumn < maxColumn) || (!leftToRight && imageColumn >= minColumn)) &&
      moduleNumber < [moduleBitCount count]) {
    if ([image getX:imageColumn y:imageRow] == previousPixelValue) {
      moduleBitCount[moduleNumber] = @([moduleBitCount[moduleNumber] intValue] + 1);
      imageColumn += increment;
    } else {
      moduleNumber++;
      previousPixelValue = !previousPixelValue;
    }
  }
  if (moduleNumber == [moduleBitCount count] ||
      (((leftToRight && imageColumn == maxColumn) || (!leftToRight && imageColumn == minColumn)) && moduleNumber == [moduleBitCount count] - 1)) {
    return moduleBitCount;
  }
  return nil;
}

+ (int)numberOfECCodeWords:(int)barcodeECLevel {
  return 2 << barcodeECLevel;
}

+ (int)adjustCodewordStartColumn:(ZXBitMatrix *)image
                       minColumn:(int)minColumn
                       maxColumn:(int)maxColumn
                     leftToRight:(BOOL)leftToRight
             codewordStartColumn:(int)codewordStartColumn
                        imageRow:(int)imageRow {
  int correctedStartColumn = codewordStartColumn;
  int increment = leftToRight ? -1 : 1;
  // there should be no black pixels before the start column. If there are, then we need to start earlier.
  for (int i = 0; i < 2; i++) {
    while (((leftToRight && correctedStartColumn >= minColumn) || (!leftToRight && correctedStartColumn < maxColumn)) &&
           leftToRight == [image getX:correctedStartColumn y:imageRow]) {
      if (abs(codewordStartColumn - correctedStartColumn) > ZX_PDF417_CODEWORD_SKEW_SIZE) {
        return codewordStartColumn;
      }
      correctedStartColumn += increment;
    }
    increment = -increment;
    leftToRight = !leftToRight;
  }
  return correctedStartColumn;
}

+ (BOOL)checkCodewordSkew:(int)codewordSize minCodewordWidth:(int)minCodewordWidth maxCodewordWidth:(int)maxCodewordWidth {
  return minCodewordWidth - ZX_PDF417_CODEWORD_SKEW_SIZE <= codewordSize &&
      codewordSize <= maxCodewordWidth + ZX_PDF417_CODEWORD_SKEW_SIZE;
}

+ (ZXDecoderResult *)decodeCodewords:(ZXIntArray *)codewords ecLevel:(int)ecLevel erasures:(ZXIntArray *)erasures error:(NSError **)error {
  if (codewords.length == 0) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }

  int numECCodewords = 1 << (ecLevel + 1);
  int correctedErrorsCount = [self correctErrors:codewords erasures:erasures numECCodewords:numECCodewords];
  if (correctedErrorsCount == -1) {
    if (error) *error = ZXChecksumErrorInstance();
    return nil;
  }
  if (![self verifyCodewordCount:codewords numECCodewords:numECCodewords]) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }

  // Decode the codewords
  ZXDecoderResult *decoderResult = [ZXPDF417DecodedBitStreamParser decode:codewords ecLevel:[@(ecLevel) stringValue] error:error];
  if (!decoderResult) {
    return nil;
  }
  decoderResult.errorsCorrected = @(correctedErrorsCount);
  decoderResult.erasures = @(erasures.length);
  return decoderResult;
}

/**
 * Given data and error-correction codewords received, possibly corrupted by errors, attempts to
 * correct the errors in-place.
 *
 * @param codewords   data and error correction codewords
 * @param erasures positions of any known erasures
 * @param numECCodewords number of error correction codewords that are available in codewords
 * @throws ChecksumException if error correction fails
 */
+ (int)correctErrors:(ZXIntArray *)codewords erasures:(ZXIntArray *)erasures numECCodewords:(int)numECCodewords {
  if (erasures &&
      (erasures.length > numECCodewords / 2 + ZX_PDF417_MAX_ERRORS ||
       numECCodewords < 0 ||
       numECCodewords > ZX_PDF417_MAX_EC_CODEWORDS)) {
    // Too many errors or EC Codewords is corrupted
    return -1;
  }
  return [errorCorrection decode:codewords numECCodewords:numECCodewords erasures:erasures];
}

/**
 * Verify that all is OK with the codeword array.
 */
+ (BOOL)verifyCodewordCount:(ZXIntArray *)codewords numECCodewords:(int)numECCodewords {
  if (codewords.length < 4) {
    // Codeword array size should be at least 4 allowing for
    // Count CW, At least one Data CW, Error Correction CW, Error Correction CW
    return NO;
  }
  // The first codeword, the Symbol Length Descriptor, shall always encode the total number of data
  // codewords in the symbol, including the Symbol Length Descriptor itself, data codewords and pad
  // codewords, but excluding the number of error correction codewords.
  int numberOfCodewords = codewords.array[0];
  if (numberOfCodewords > codewords.length) {
    return NO;
  }
  if (numberOfCodewords == 0) {
    // Reset to the length of the array - 8 (Allow for at least level 3 Error Correction (8 Error Codewords)
    if (numECCodewords < codewords.length) {
      codewords.array[0] = codewords.length - numECCodewords;
    } else {
      return NO;
    }
  }

  return YES;
}

+ (NSArray *)bitCountForCodeword:(int)codeword {
  NSMutableArray *result = [NSMutableArray array];
  for (int i = 0; i < 8; i++) {
    [result addObject:@0];
  }

  int previousValue = 0;
  int i = (int)[result count] - 1;
  while (YES) {
    if ((codeword & 0x1) != previousValue) {
      previousValue = codeword & 0x1;
      i--;
      if (i < 0) {
        break;
      }
    }
    result[i] = @([result[i] intValue] + 1);
    codeword >>= 1;
  }
  return result;
}

+ (int)codewordBucketNumber:(int)codeword {
  return [self codewordBucketNumberWithModuleBitCount:[self bitCountForCodeword:codeword]];
}

+ (int)codewordBucketNumberWithModuleBitCount:(NSArray *)moduleBitCount {
  return ([moduleBitCount[0] intValue] - [moduleBitCount[2] intValue] + [moduleBitCount[4] intValue] - [moduleBitCount[6] intValue] + 9) % 9;
}

- (NSString *)description:(NSArray *)barcodeMatrix {
  NSMutableString *result = [NSMutableString string];
  for (int row = 0; row < [barcodeMatrix count]; row++) {
    [result appendFormat:@"Row %2d: ", row];
    for (int column = 0; column < [(NSArray *)barcodeMatrix[row] count]; column++) {
      ZXPDF417BarcodeValue *barcodeValue = barcodeMatrix[row][column];
      if ([barcodeValue value].length == 0) {
        [result appendString:@"        "];
      } else {
        [result appendFormat:@"%4d(%2d)", [barcodeValue value].array[0],
         [[barcodeValue confidence:[barcodeValue value].array[0]] intValue]];
      }
    }
    [result appendString:@"\n"];
  }
  return [NSString stringWithString:result];
}

@end
