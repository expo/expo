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

#import "ZXBinaryBitmap.h"
#import "ZXBitArray.h"
#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXOneDReader.h"
#import "ZXResult.h"
#import "ZXResultPoint.h"

@implementation ZXOneDReader

- (ZXResult *)decode:(ZXBinaryBitmap *)image error:(NSError **)error {
  return [self decode:image hints:nil error:error];
}

// Note that we don't try rotation without the try harder flag, even if rotation was supported.
- (ZXResult *)decode:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints error:(NSError **)error {
  NSError *decodeError = nil;
  ZXResult *result = [self doDecode:image hints:hints error:&decodeError];
  if (result) {
    return result;
  } else if (decodeError.code == ZXNotFoundError) {
    BOOL tryHarder = hints != nil && hints.tryHarder;
    if (tryHarder && [image rotateSupported]) {
      ZXBinaryBitmap *rotatedImage = [image rotateCounterClockwise];
      ZXResult *result = [self doDecode:rotatedImage hints:hints error:error];
      if (!result) {
        return nil;
      }
      // Record that we found it rotated 90 degrees CCW / 270 degrees CW
      NSMutableDictionary *metadata = [result resultMetadata];
      int orientation = 270;
      if (metadata != nil && metadata[@(kResultMetadataTypeOrientation)]) {
        // But if we found it reversed in doDecode(), add in that result here:
        orientation = (orientation + [((NSNumber *)metadata[@(kResultMetadataTypeOrientation)]) intValue]) % 360;
      }
      [result putMetadata:kResultMetadataTypeOrientation value:@(orientation)];
      // Update result points
      NSMutableArray *points = [result resultPoints];
      if (points != nil) {
        int height = [rotatedImage height];
        for (int i = 0; i < [points count]; i++) {
          points[i] = [[ZXResultPoint alloc] initWithX:height - [(ZXResultPoint *)points[i] y]
                                                     y:[(ZXResultPoint *)points[i] x]];
        }
      }
      return result;
    }
  }

  if (error) *error = decodeError;
  return nil;
}

- (void)reset {
  // do nothing
}

/**
 * We're going to examine rows from the middle outward, searching alternately above and below the
 * middle, and farther out each time. rowStep is the number of rows between each successive
 * attempt above and below the middle. So we'd scan row middle, then middle - rowStep, then
 * middle + rowStep, then middle - (2 * rowStep), etc.
 * rowStep is bigger as the image is taller, but is always at least 1. We've somewhat arbitrarily
 * decided that moving up and down by about 1/16 of the image is pretty good; we try more of the
 * image if "trying harder".
 *
 * @param image The image to decode
 * @param hints Any hints that were requested
 * @return The contents of the decoded barcode or nil if:
 *  - no potential barcode is found
 *  - a potential barcode is found but does not pass its checksum
 *  - a potential barcode is found but format is invalid
 */
- (ZXResult *)doDecode:(ZXBinaryBitmap *)image hints:(ZXDecodeHints *)hints error:(NSError **)error {
  int width = image.width;
  int height = image.height;
  ZXBitArray *row = [[ZXBitArray alloc] initWithSize:width];
  int middle = height >> 1;
  BOOL tryHarder = hints != nil && hints.tryHarder;
  int rowStep = MAX(1, height >> (tryHarder ? 8 : 5));
  int maxLines;
  if (tryHarder) {
    maxLines = height;
  } else {
    maxLines = 15;
  }

  for (int x = 0; x < maxLines; x++) {
    int rowStepsAboveOrBelow = (x + 1) / 2;
    BOOL isAbove = (x & 0x01) == 0;
    int rowNumber = middle + rowStep * (isAbove ? rowStepsAboveOrBelow : -rowStepsAboveOrBelow);
    if (rowNumber < 0 || rowNumber >= height) {
      break;
    }

    NSError *rowError = nil;
    row = [image blackRow:rowNumber row:row error:&rowError];
    if (!row && rowError.code == ZXNotFoundError) {
      continue;
    } else if (!row) {
      if (error) *error = rowError;
      return nil;
    }

    for (int attempt = 0; attempt < 2; attempt++) {
      if (attempt == 1) {
        [row reverse];
        if (hints != nil && hints.resultPointCallback) {
          hints = [hints copy];
          hints.resultPointCallback = nil;
        }
      }

      ZXResult *result = [self decodeRow:rowNumber row:row hints:hints error:nil];
      if (result) {
        if (attempt == 1) {
          [result putMetadata:kResultMetadataTypeOrientation value:@180];
          NSMutableArray *points = [result resultPoints];
          if (points != nil) {
            points[0] = [[ZXResultPoint alloc] initWithX:width - [(ZXResultPoint *)points[0] x]
                                                       y:[(ZXResultPoint *)points[0] y]];
            points[1] = [[ZXResultPoint alloc] initWithX:width - [(ZXResultPoint *)points[1] x]
                                                       y:[(ZXResultPoint *)points[1] y]];
          }
        }
        return result;
      }
    }
  }

  if (error) *error = ZXNotFoundErrorInstance();
  return nil;
}

/**
 * Records the size of successive runs of white and black pixels in a row, starting at a given point.
 * The values are recorded in the given array, and the number of runs recorded is equal to the size
 * of the array. If the row starts on a white pixel at the given start point, then the first count
 * recorded is the run of white pixels starting from that point; likewise it is the count of a run
 * of black pixels if the row begin on a black pixels at that point.
 *
 * @param row row to count from
 * @param start offset into row to start at
 * @param counters array into which to record counts or nil if counters cannot be filled entirely
 *  from row before running out of pixels
 */
+ (BOOL)recordPattern:(ZXBitArray *)row start:(int)start counters:(ZXIntArray *)counters {
  int numCounters = counters.length;
  [counters clear];
  int32_t *array = counters.array;
  int end = row.size;
  if (start >= end) {
    return NO;
  }
  BOOL isWhite = ![row get:start];
  int counterPosition = 0;
  int i = start;

  while (i < end) {
    if ([row get:i] ^ isWhite) {
      array[counterPosition]++;
    } else {
      counterPosition++;
      if (counterPosition == numCounters) {
        break;
      } else {
        array[counterPosition] = 1;
        isWhite = !isWhite;
      }
    }
    i++;
  }

  return counterPosition == numCounters ||
          (counterPosition == numCounters - 1 && i == end);
}

+ (BOOL)recordPatternInReverse:(ZXBitArray *)row start:(int)start counters:(ZXIntArray *)counters {
  int numTransitionsLeft = counters.length;
  BOOL last = [row get:start];
  while (start > 0 && numTransitionsLeft >= 0) {
    if ([row get:--start] != last) {
      numTransitionsLeft--;
      last = !last;
    }
  }

  return !(numTransitionsLeft >= 0 || ![self recordPattern:row start:start + 1 counters:counters]);
}

/**
 * Determines how closely a set of observed counts of runs of black/white values matches a given
 * target pattern. This is reported as the ratio of the total variance from the expected pattern
 * proportions across all pattern elements, to the length of the pattern.
 *
 * @param counters observed counters
 * @param pattern expected pattern
 * @param maxIndividualVariance The most any counter can differ before we give up
 * @return ratio of total variance between counters and pattern compared to total pattern size
 */
+ (float)patternMatchVariance:(ZXIntArray *)counters pattern:(const int[])pattern maxIndividualVariance:(float)maxIndividualVariance {
  int numCounters = counters.length;
  int total = 0;
  int patternLength = 0;

  int32_t *array = counters.array;
  for (int i = 0; i < numCounters; i++) {
    total += array[i];
    patternLength += pattern[i];
  }

  if (total < patternLength || patternLength == 0) {
    return FLT_MAX;
  }
  float unitBarWidth = (float) total / patternLength;
  maxIndividualVariance *= unitBarWidth;

  float totalVariance = 0.0f;
  for (int x = 0; x < numCounters; x++) {
    int counter = array[x];
    float scaledPattern = pattern[x] * unitBarWidth;
    float variance = counter > scaledPattern ? counter - scaledPattern : scaledPattern - counter;
    if (variance > maxIndividualVariance) {
      return FLT_MAX;
    }
    totalVariance += variance;
  }

  return totalVariance / total;
}

/**
 * Attempts to decode a one-dimensional barcode format given a single row of
 * an image.
 *
 * @param rowNumber row number from top of the row
 * @param row the black/white pixel data of the row
 * @param hints decode hints
 * @return ZXResult containing encoded string and start/end of barcode or nil
 *  if an error occurs or barcode cannot be found
 */
- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

@end
