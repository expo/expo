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
#import "ZXBinaryBitmap.h"
#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXGridSampler.h"
#import "ZXMathUtils.h"
#import "ZXPDF417Detector.h"
#import "ZXPDF417DetectorResult.h"
#import "ZXPerspectiveTransform.h"
#import "ZXResultPoint.h"

const int ZX_PDF417_INDEXES_START_PATTERN[] = {0, 4, 1, 5};
const int ZX_PDF417_INDEXES_STOP_PATTERN[] = {6, 2, 7, 3};
const float ZX_PDF417_MAX_AVG_VARIANCE = 0.42f;
const float ZX_PDF417_MAX_INDIVIDUAL_VARIANCE = 0.8f;

// B S B S B S B S Bar/Space pattern
// 11111111 0 1 0 1 0 1 000
const int ZX_PDF417_DETECTOR_START_PATTERN[] = {8, 1, 1, 1, 1, 1, 1, 3};

// 1111111 0 1 000 1 0 1 00 1
const int ZX_PDF417_DETECTOR_STOP_PATTERN[] = {7, 1, 1, 3, 1, 1, 1, 2, 1};
const int ZX_PDF417_MAX_PIXEL_DRIFT = 3;
const int ZX_PDF417_MAX_PATTERN_DRIFT = 5;
// if we set the value too low, then we don't detect the correct height of the bar if the start patterns are damaged.
// if we set the value too high, then we might detect the start pattern from a neighbor barcode.
const int ZX_PDF417_SKIPPED_ROW_COUNT_MAX = 25;
// A PDF471 barcode should have at least 3 rows, with each row being >= 3 times the module width. Therefore it should be at least
// 9 pixels tall. To be conservative, we use about half the size to ensure we don't miss it.
const int ZX_PDF417_ROW_STEP = 5;
const int ZX_PDF417_BARCODE_MIN_HEIGHT = 10;

@implementation ZXPDF417Detector

+ (ZXPDF417DetectorResult *)detect:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints multiple:(BOOL)multiple error:(NSError **)error {
  // TODO detection improvement, tryHarder could try several different luminance thresholds/blackpoints or even
  // different binarizers
  //boolean tryHarder = hints != null && hints.containsKey(DecodeHintType.TRY_HARDER);

  ZXBitMatrix *bitMatrix = [image blackMatrixWithError:error];

  NSArray *barcodeCoordinates = [self detect:multiple bitMatrix:bitMatrix error:error];
  if (!barcodeCoordinates) {
    return nil;
  }
  if ([barcodeCoordinates count] == 0) {
    bitMatrix = [bitMatrix copy];
    [bitMatrix rotate180];
    barcodeCoordinates = [self detect:multiple bitMatrix:bitMatrix error:error];
    if (!barcodeCoordinates) {
      return nil;
    }
  }
  return [[ZXPDF417DetectorResult alloc] initWithBits:bitMatrix points:barcodeCoordinates];
}

/**
 * Detects PDF417 codes in an image. Only checks 0 degree rotation
 * @param multiple if true, then the image is searched for multiple codes. If false, then at most one code will
 * be found and returned
 * @param bitMatrix bit matrix to detect barcodes in
 * @return List of ResultPoint arrays containing the coordinates of found barcodes
 */
+ (NSArray *)detect:(BOOL)multiple bitMatrix:(ZXBitMatrix *)bitMatrix error:(NSError **)error {
  NSMutableArray *barcodeCoordinates = [NSMutableArray array];
  int row = 0;
  int column = 0;
  BOOL foundBarcodeInRow = NO;
  while (row < bitMatrix.height) {
    NSArray *vertices = [self findVertices:bitMatrix startRow:row startColumn:column];

    if (vertices[0] == [NSNull null] && vertices[3] == [NSNull null]) {
      if (!foundBarcodeInRow) {
        // we didn't find any barcode so that's the end of searching
        break;
      }
      // we didn't find a barcode starting at the given column and row. Try again from the first column and slightly
      // below the lowest barcode we found so far.
      foundBarcodeInRow = NO;
      column = 0;
      for (NSArray *barcodeCoordinate in barcodeCoordinates) {
        if (barcodeCoordinate[1] != [NSNull null]) {
          row = MAX(row, (int) [(ZXResultPoint *)barcodeCoordinate[1] y]);
        }
        if (barcodeCoordinate[3] != [NSNull null]) {
          row = MAX(row, (int) [(ZXResultPoint *)barcodeCoordinate[3] y]);
        }
      }
      row += ZX_PDF417_ROW_STEP;
      continue;
    }
    foundBarcodeInRow = YES;
    [barcodeCoordinates addObject:vertices];
    if (!multiple) {
      break;
    }
    // if we didn't find a right row indicator column, then continue the search for the next barcode after the
    // start pattern of the barcode just found.
    if (vertices[2] != [NSNull null]) {
      column = (int) [(ZXResultPoint *)vertices[2] x];
      row = (int) [(ZXResultPoint *)vertices[2] y];
    } else {
      column = (int) [(ZXResultPoint *)vertices[4] x];
      row = (int) [(ZXResultPoint *)vertices[4] y];
    }
  }
  return barcodeCoordinates;
}

/**
 * Locate the vertices and the codewords area of a black blob using the Start
 * and Stop patterns as locators.
 *
 * @param matrix the scanned barcode image.
 * @return an array containing the vertices:
 *           vertices[0] x, y top left barcode
 *           vertices[1] x, y bottom left barcode
 *           vertices[2] x, y top right barcode
 *           vertices[3] x, y bottom right barcode
 *           vertices[4] x, y top left codeword area
 *           vertices[5] x, y bottom left codeword area
 *           vertices[6] x, y top right codeword area
 *           vertices[7] x, y bottom right codeword area
 */
+ (NSMutableArray *)findVertices:(ZXBitMatrix *)matrix startRow:(int)startRow startColumn:(int)startColumn {
  int height = matrix.height;
  int width = matrix.width;

  NSMutableArray *result = [NSMutableArray arrayWithCapacity:8];
  for (int i = 0; i < 8; i++) {
    [result addObject:[NSNull null]];
  }
  [self copyToResult:result
           tmpResult:[self findRowsWithPattern:matrix
                                        height:height
                                         width:width
                                      startRow:startRow
                                   startColumn:startColumn
                                       pattern:ZX_PDF417_DETECTOR_START_PATTERN
                                    patternLen:sizeof(ZX_PDF417_DETECTOR_START_PATTERN) / sizeof(int)]
  destinationIndexes:ZX_PDF417_INDEXES_START_PATTERN
              length:sizeof(ZX_PDF417_INDEXES_START_PATTERN) / sizeof(int)];

  if (result[4] != [NSNull null]) {
    startColumn = (int) [(ZXResultPoint *)result[4] x];
    startRow = (int) [(ZXResultPoint *)result[4] y];
  }
  [self copyToResult:result
           tmpResult:[self findRowsWithPattern:matrix
                                        height:height
                                         width:width
                                      startRow:startRow
                                   startColumn:startColumn
                                       pattern:ZX_PDF417_DETECTOR_STOP_PATTERN
                                    patternLen:sizeof(ZX_PDF417_DETECTOR_STOP_PATTERN) / sizeof(int)]
  destinationIndexes:ZX_PDF417_INDEXES_STOP_PATTERN
              length:sizeof(ZX_PDF417_INDEXES_STOP_PATTERN) / sizeof(int)];
  return result;
}

+ (void)copyToResult:(NSMutableArray *)result tmpResult:(NSMutableArray *)tmpResult destinationIndexes:(const int[])destinationIndexes length:(int)length {
  for (int i = 0; i < length; i++) {
    result[destinationIndexes[i]] = tmpResult[i];
  }
}

+ (NSMutableArray *)findRowsWithPattern:(ZXBitMatrix *)matrix height:(int)height width:(int)width startRow:(int)startRow
                            startColumn:(int)startColumn pattern:(const int[])pattern patternLen:(int)patternLen {
  NSMutableArray *result = [NSMutableArray array];
  for (int i = 0; i < 4; i++) {
    [result addObject:[NSNull null]];
  }
  BOOL found = NO;
  int counters[patternLen];
  memset(counters, 0, patternLen * sizeof(int));
  for (; startRow < height; startRow += ZX_PDF417_ROW_STEP) {
    NSRange loc = [self findGuardPattern:matrix column:startColumn row:startRow width:width whiteFirst:false pattern:pattern patternLen:patternLen counters:counters];
    if (loc.location != NSNotFound) {
      while (startRow > 0) {
        NSRange previousRowLoc = [self findGuardPattern:matrix column:startColumn row:--startRow width:width whiteFirst:false pattern:pattern patternLen:patternLen counters:counters];
        if (previousRowLoc.location != NSNotFound) {
          loc = previousRowLoc;
        } else {
          startRow++;
          break;
        }
      }
      result[0] = [[ZXResultPoint alloc] initWithX:loc.location y:startRow];
      result[1] = [[ZXResultPoint alloc] initWithX:NSMaxRange(loc) y:startRow];
      found = YES;
      break;
    }
  }
  int stopRow = startRow + 1;
  // Last row of the current symbol that contains pattern
  if (found) {
    int skippedRowCount = 0;
    NSRange previousRowLoc = NSMakeRange((NSUInteger) [(ZXResultPoint *)result[0] x], ((NSUInteger)[(ZXResultPoint *)result[1] x]) - ((NSUInteger)[(ZXResultPoint *)result[0] x]));
    for (; stopRow < height; stopRow++) {
      NSRange loc = [self findGuardPattern:matrix column:(int)previousRowLoc.location row:stopRow width:width whiteFirst:NO pattern:pattern patternLen:patternLen counters:counters];
      // a found pattern is only considered to belong to the same barcode if the start and end positions
      // don't differ too much. Pattern drift should be not bigger than two for consecutive rows. With
      // a higher number of skipped rows drift could be larger. To keep it simple for now, we allow a slightly
      // larger drift and don't check for skipped rows.
      if (loc.location != NSNotFound &&
          ABS((int)previousRowLoc.location - (int)loc.location) < ZX_PDF417_MAX_PATTERN_DRIFT &&
          ABS((int)NSMaxRange(previousRowLoc) - (int)NSMaxRange(loc)) < ZX_PDF417_MAX_PATTERN_DRIFT) {
        previousRowLoc = loc;
        skippedRowCount = 0;
      } else {
        if (skippedRowCount > ZX_PDF417_SKIPPED_ROW_COUNT_MAX) {
          break;
        } else {
          skippedRowCount++;
        }
      }
    }
    stopRow -= skippedRowCount + 1;
    result[2] = [[ZXResultPoint alloc] initWithX:previousRowLoc.location y:stopRow];
    result[3] = [[ZXResultPoint alloc] initWithX:NSMaxRange(previousRowLoc) y:stopRow];
  }
  if (stopRow - startRow < ZX_PDF417_BARCODE_MIN_HEIGHT) {
    for (int i = 0; i < 4; i++) {
      result[i] = [NSNull null];
    }
  }
  return result;
}

/**
 * @param matrix row of black/white values to search
 * @param column x position to start search
 * @param row y position to start search
 * @param width the number of pixels to search on this row
 * @param pattern pattern of counts of number of black and white pixels that are
 *                 being searched for as a pattern
 * @param counters array of counters, as long as pattern, to re-use
 * @return start/end horizontal offset of guard pattern, as an array of two ints.
 */
+ (NSRange)findGuardPattern:(ZXBitMatrix *)matrix
                     column:(int)column
                        row:(int)row
                      width:(int)width
                 whiteFirst:(BOOL)whiteFirst
                    pattern:(const int[])pattern
                 patternLen:(int)patternLen
                   counters:(int *)counters {
  int patternLength = patternLen;
  memset(counters, 0, patternLength * sizeof(int));
  BOOL isWhite = whiteFirst;
  int patternStart = column;
  int pixelDrift = 0;

  // if there are black pixels left of the current pixel shift to the left, but only for ZX_PDF417_MAX_PIXEL_DRIFT pixels
  while ([matrix getX:patternStart y:row] && patternStart > 0 && pixelDrift++ < ZX_PDF417_MAX_PIXEL_DRIFT) {
    patternStart--;
  }
  int x = patternStart;
  int counterPosition = 0;
  for (;x < width; x++) {
    BOOL pixel = [matrix getX:x y:row];
    if (pixel ^ isWhite) {
      counters[counterPosition] = counters[counterPosition] + 1;
    } else {
      if (counterPosition == patternLength - 1) {
        if ([self patternMatchVariance:counters countersSize:patternLength pattern:pattern maxIndividualVariance:ZX_PDF417_MAX_INDIVIDUAL_VARIANCE] < ZX_PDF417_MAX_AVG_VARIANCE) {
          return NSMakeRange(patternStart, x - patternStart);
        }
        patternStart += counters[0] + counters[1];
        for (int y = 2; y < patternLength; y++) {
          counters[y - 2] = counters[y];
        }
        counters[patternLength - 2] = 0;
        counters[patternLength - 1] = 0;
        counterPosition--;
      } else {
        counterPosition++;
      }
      counters[counterPosition] = 1;
      isWhite = !isWhite;
    }
  }
  if (counterPosition == patternLength - 1) {
    if ([self patternMatchVariance:counters countersSize:patternLen pattern:pattern maxIndividualVariance:ZX_PDF417_MAX_INDIVIDUAL_VARIANCE] < ZX_PDF417_MAX_AVG_VARIANCE) {
      return NSMakeRange(patternStart, x - patternStart - 1);
    }
  }
  return NSMakeRange(NSNotFound, 0);
}

/**
 * Determines how closely a set of observed counts of runs of black/white
 * values matches a given target pattern. This is reported as the ratio of
 * the total variance from the expected pattern proportions across all
 * pattern elements, to the length of the pattern.
 *
 * @param counters observed counters
 * @param pattern expected pattern
 * @param maxIndividualVariance The most any counter can differ before we give up
 * @return ratio of total variance between counters and pattern compared to total pattern size
 */
+ (float)patternMatchVariance:(int *)counters countersSize:(int)countersSize pattern:(const int[])pattern maxIndividualVariance:(float)maxIndividualVariance {
  int numCounters = countersSize;
  int total = 0;
  int patternLength = 0;
  for (int i = 0; i < numCounters; i++) {
    total += counters[i];
    patternLength += pattern[i];
  }

  if (total < patternLength || patternLength == 0) {
    return FLT_MAX;
  }
  float unitBarWidth = (float) total / patternLength;
  maxIndividualVariance *= unitBarWidth;

  float totalVariance = 0.0f;
  for (int x = 0; x < numCounters; x++) {
    int counter = counters[x];
    float scaledPattern = pattern[x] * unitBarWidth;
    float variance = counter > scaledPattern ? counter - scaledPattern : scaledPattern - counter;
    if (variance > maxIndividualVariance) {
      return FLT_MAX;
    }
    totalVariance += variance;
  }

  return totalVariance / total;
}

@end
