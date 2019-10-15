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
#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXQRCodeFinderPattern.h"
#import "ZXQRCodeFinderPatternInfo.h"
#import "ZXQRCodeFinderPatternFinder.h"
#import "ZXResultPoint.h"
#import "ZXResultPointCallback.h"

const int ZX_CENTER_QUORUM = 2;
const int ZX_FINDER_PATTERN_MIN_SKIP = 3;
const int ZX_FINDER_PATTERN_MAX_MODULES = 97;

@interface ZXQRCodeFinderPatternFinder ()

NSInteger centerCompare(id center1, id center2, void *context);
NSInteger furthestFromAverageCompare(id center1, id center2, void *context);

@property (nonatomic, assign) BOOL hasSkipped;
@property (nonatomic, weak, readonly) id<ZXResultPointCallback> resultPointCallback;
@property (nonatomic, strong) NSMutableArray *possibleCenters;

@end

@implementation ZXQRCodeFinderPatternFinder

- (id)initWithImage:(ZXBitMatrix *)image {
  return [self initWithImage:image resultPointCallback:nil];
}

- (id)initWithImage:(ZXBitMatrix *)image resultPointCallback:(id<ZXResultPointCallback>)resultPointCallback {
  if (self = [super init]) {
    _image = image;
    _possibleCenters = [NSMutableArray array];
    _resultPointCallback = resultPointCallback;
  }

  return self;
}

- (ZXQRCodeFinderPatternInfo *)find:(ZXDecodeHints *)hints error:(NSError **)error {
  BOOL tryHarder = hints != nil && hints.tryHarder;
  int maxI = self.image.height;
  int maxJ = self.image.width;
  int iSkip = (3 * maxI) / (4 * ZX_FINDER_PATTERN_MAX_MODULES);
  if (iSkip < ZX_FINDER_PATTERN_MIN_SKIP || tryHarder) {
    iSkip = ZX_FINDER_PATTERN_MIN_SKIP;
  }

  BOOL done = NO;
  int stateCount[5];
  for (int i = iSkip - 1; i < maxI && !done; i += iSkip) {
    stateCount[0] = 0;
    stateCount[1] = 0;
    stateCount[2] = 0;
    stateCount[3] = 0;
    stateCount[4] = 0;
    int currentState = 0;

    for (int j = 0; j < maxJ; j++) {
      if ([self.image getX:j y:i]) {
        if ((currentState & 1) == 1) {
          currentState++;
        }
        stateCount[currentState]++;
      } else {
        if ((currentState & 1) == 0) {
          if (currentState == 4) {
            if ([ZXQRCodeFinderPatternFinder foundPatternCross:stateCount]) {
              BOOL confirmed = [self handlePossibleCenter:stateCount i:i j:j];
              if (confirmed) {
                iSkip = 2;
                if (self.hasSkipped) {
                  done = [self haveMultiplyConfirmedCenters];
                } else {
                  int rowSkip = [self findRowSkip];
                  if (rowSkip > stateCount[2]) {
                    i += rowSkip - stateCount[2] - iSkip;
                    j = maxJ - 1;
                  }
                }
              } else {
                stateCount[0] = stateCount[2];
                stateCount[1] = stateCount[3];
                stateCount[2] = stateCount[4];
                stateCount[3] = 1;
                stateCount[4] = 0;
                currentState = 3;
                continue;
              }
              currentState = 0;
              stateCount[0] = 0;
              stateCount[1] = 0;
              stateCount[2] = 0;
              stateCount[3] = 0;
              stateCount[4] = 0;
            } else {
              stateCount[0] = stateCount[2];
              stateCount[1] = stateCount[3];
              stateCount[2] = stateCount[4];
              stateCount[3] = 1;
              stateCount[4] = 0;
              currentState = 3;
            }
          } else {
            stateCount[++currentState]++;
          }
        } else {
          stateCount[currentState]++;
        }
      }
    }

    if ([ZXQRCodeFinderPatternFinder foundPatternCross:stateCount]) {
      BOOL confirmed = [self handlePossibleCenter:stateCount i:i j:maxJ];
      if (confirmed) {
        iSkip = stateCount[0];
        if (self.hasSkipped) {
          done = [self haveMultiplyConfirmedCenters];
        }
      }
    }
  }

  NSMutableArray *patternInfo = [self selectBestPatterns];
  if (!patternInfo) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  [ZXResultPoint orderBestPatterns:patternInfo];
  return [[ZXQRCodeFinderPatternInfo alloc] initWithPatternCenters:patternInfo];
}

/**
 * Given a count of black/white/black/white/black pixels just seen and an end position,
 * figures the location of the center of this run.
 */
- (float)centerFromEnd:(const int[])stateCount end:(int)end {
  return (float)(end - stateCount[4] - stateCount[3]) - stateCount[2] / 2.0f;
}

/**
 * @param stateCount count of black/white/black/white/black pixels just read
 * @return true iff the proportions of the counts is close enough to the 1/1/3/1/1 ratios
 *         used by finder patterns to be considered a match
 */
+ (BOOL)foundPatternCross:(const int[])stateCount {
  int totalModuleSize = 0;
  for (int i = 0; i < 5; i++) {
    int count = stateCount[i];
    if (count == 0) {
      return NO;
    }
    totalModuleSize += count;
  }
  if (totalModuleSize < 7) {
    return NO;
  }
  float moduleSize = totalModuleSize / 7.0f;
  float maxVariance = moduleSize / 2.0f;
  // Allow less than 50% variance from 1-1-3-1-1 proportions
  return
  ABS(moduleSize - stateCount[0]) < maxVariance &&
  ABS(moduleSize - stateCount[1]) < maxVariance &&
  ABS(3.0f * moduleSize - stateCount[2]) < 3 * maxVariance &&
  ABS(moduleSize - stateCount[3]) < maxVariance &&
  ABS(moduleSize - stateCount[4]) < maxVariance;
}

/**
 * @param stateCount count of black/white/black/white/black pixels just read
 * @return true iff the proportions of the counts is close enough to the 1/1/3/1/1 ratios
 *         used by finder patterns to be considered a match
 */
+ (BOOL)foundPatternDiagonal:(const int[])stateCount {
  int totalModuleSize = 0;
  for (int i = 0; i < 5; i++) {
    int count = stateCount[i];
    if (count == 0) {
      return NO;
    }
    totalModuleSize += count;
  }
  if (totalModuleSize < 7) {
    return NO;
  }
  float moduleSize = totalModuleSize / 7.0f;
  float maxVariance = moduleSize / 1.333f;
  // Allow less than 75% variance from 1-1-3-1-1 proportions
  return
  ABS(moduleSize - stateCount[0]) < maxVariance &&
  ABS(moduleSize - stateCount[1]) < maxVariance &&
  ABS(3.0f * moduleSize - stateCount[2]) < 3 * maxVariance &&
  ABS(moduleSize - stateCount[3]) < maxVariance &&
  ABS(moduleSize - stateCount[4]) < maxVariance;
}

/**
 * After a vertical and horizontal scan finds a potential finder pattern, this method
 * "cross-cross-cross-checks" by scanning down diagonally through the center of the possible
 * finder pattern to see if the same proportion is detected.
 *
 * @param centerI row where a finder pattern was detected
 * @param centerJ center of the section that appears to cross a finder pattern
 * @return true if proportions are withing expected limits
 */
- (BOOL)crossCheckDiagonal:(int)centerI centerJ:(int)centerJ {
  int stateCount[5] = {0, 0, 0, 0, 0};

  // Start counting up, left from center finding black center mass
  int i = 0;
  while (centerI >= i && centerJ >= i && [self.image getX:centerJ - i y:centerI - i]) {
    stateCount[2]++;
    i++;
  }

  if (stateCount[2] == 0) {
    return NO;
  }

  // Continue up, left finding white space
  while (centerI >= i && centerJ >= i && ![self.image getX:centerJ - i y:centerI - i]) {
    stateCount[1]++;
    i++;
  }
  if (stateCount[1] == 0) {
    return NO;
  }

  // Continue up, left finding black border
  while (centerI >= i && centerJ >= i && [self.image getX:centerJ - i y:centerI - i]) {
    stateCount[0]++;
    i++;
  }
  if (stateCount[0] == 0) {
    return NO;
  }

  int maxI = self.image.height;
  int maxJ = self.image.width;

  // Now also count down, right from center
  i = 1;
  while (centerI + i < maxI && centerJ + i < maxJ && [self.image getX:centerJ + i y:centerI + i]) {
    stateCount[2]++;
    i++;
  }

  while (centerI + i < maxI && centerJ + i < maxJ && ![self.image getX:centerJ + i y:centerI + i]) {
    stateCount[3]++;
    i++;
  }

  if (stateCount[3] == 0) {
    return NO;
  }

  while (centerI + i < maxI && centerJ + i < maxJ && [self.image getX:centerJ + i y:centerI + i]) {
    stateCount[4]++;
    i++;
  }

  if (stateCount[4] == 0) {
    return NO;
  }

  return [ZXQRCodeFinderPatternFinder foundPatternDiagonal:stateCount];
}

/**
 * After a horizontal scan finds a potential finder pattern, this method
 * "cross-checks" by scanning down vertically through the center of the possible
 * finder pattern to see if the same proportion is detected.
 *
 * @param startI row where a finder pattern was detected
 * @param centerJ center of the section that appears to cross a finder pattern
 * @param maxCount maximum reasonable number of modules that should be
 * observed in any reading state, based on the results of the horizontal scan
 * @return vertical center of finder pattern, or `NAN` if not found
 */
- (float)crossCheckVertical:(int)startI centerJ:(int)centerJ maxCount:(int)maxCount originalStateCountTotal:(int)originalStateCountTotal {
  int maxI = self.image.height;
  int stateCount[5] = {0, 0, 0, 0, 0};

  int i = startI;
  while (i >= 0 && [self.image getX:centerJ y:i]) {
    stateCount[2]++;
    i--;
  }
  if (i < 0) {
    return NAN;
  }
  while (i >= 0 && ![self.image getX:centerJ y:i] && stateCount[1] <= maxCount) {
    stateCount[1]++;
    i--;
  }
  if (i < 0 || stateCount[1] > maxCount) {
    return NAN;
  }
  while (i >= 0 && [self.image getX:centerJ y:i] && stateCount[0] <= maxCount) {
    stateCount[0]++;
    i--;
  }
  if (stateCount[0] > maxCount) {
    return NAN;
  }

  i = startI + 1;
  while (i < maxI && [self.image getX:centerJ y:i]) {
    stateCount[2]++;
    i++;
  }
  if (i == maxI) {
    return NAN;
  }
  while (i < maxI && ![self.image getX:centerJ y:i] && stateCount[3] < maxCount) {
    stateCount[3]++;
    i++;
  }
  if (i == maxI || stateCount[3] >= maxCount) {
    return NAN;
  }
  while (i < maxI && [self.image getX:centerJ y:i] && stateCount[4] < maxCount) {
    stateCount[4]++;
    i++;
  }
  if (stateCount[4] >= maxCount) {
    return NAN;
  }

  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  if (5 * abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
    return NAN;
  }
  return [ZXQRCodeFinderPatternFinder foundPatternCross:stateCount] ? [self centerFromEnd:stateCount end:i] : NAN;
}

/**
 * Like crossCheckVertical, and in fact is basically identical,
 * except it reads horizontally instead of vertically. This is used to cross-cross
 * check a vertical cross check and locate the real center of the alignment pattern.
 */
- (float)crossCheckHorizontal:(int)startJ centerI:(int)centerI maxCount:(int)maxCount originalStateCountTotal:(int)originalStateCountTotal {
  int maxJ = self.image.width;
  int stateCount[5] = {0, 0, 0, 0, 0};

  int j = startJ;
  while (j >= 0 && [self.image getX:j y:centerI]) {
    stateCount[2]++;
    j--;
  }
  if (j < 0) {
    return NAN;
  }
  while (j >= 0 && ![self.image getX:j y:centerI] && stateCount[1] <= maxCount) {
    stateCount[1]++;
    j--;
  }
  if (j < 0 || stateCount[1] > maxCount) {
    return NAN;
  }
  while (j >= 0 && [self.image getX:j y:centerI] && stateCount[0] <= maxCount) {
    stateCount[0]++;
    j--;
  }
  if (stateCount[0] > maxCount) {
    return NAN;
  }

  j = startJ + 1;
  while (j < maxJ && [self.image getX:j y:centerI]) {
    stateCount[2]++;
    j++;
  }
  if (j == maxJ) {
    return NAN;
  }
  while (j < maxJ && ![self.image getX:j y:centerI] && stateCount[3] < maxCount) {
    stateCount[3]++;
    j++;
  }
  if (j == maxJ || stateCount[3] >= maxCount) {
    return NAN;
  }
  while (j < maxJ && [self.image getX:j y:centerI] && stateCount[4] < maxCount) {
    stateCount[4]++;
    j++;
  }
  if (stateCount[4] >= maxCount) {
    return NAN;
  }

  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  if (5 * abs(stateCountTotal - originalStateCountTotal) >= originalStateCountTotal) {
    return NAN;
  }

  return [ZXQRCodeFinderPatternFinder foundPatternCross:stateCount] ? [self centerFromEnd:stateCount end:j] : NAN;
}

- (BOOL)handlePossibleCenter:(const int[])stateCount i:(int)i j:(int)j {
  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  float centerJ = [self centerFromEnd:stateCount end:j];
  float centerI = [self crossCheckVertical:i centerJ:(int)centerJ maxCount:stateCount[2] originalStateCountTotal:stateCountTotal];
  if (!isnan(centerI)) {
    centerJ = [self crossCheckHorizontal:(int)centerJ centerI:(int)centerI maxCount:stateCount[2] originalStateCountTotal:stateCountTotal];
    if (!isnan(centerJ) && [self crossCheckDiagonal:(int)centerI centerJ:(int)centerJ]) {
      float estimatedModuleSize = (float)stateCountTotal / 7.0f;
      BOOL found = NO;
      int max = (int)[self.possibleCenters count];
      for (int index = 0; index < max; index++) {
        ZXQRCodeFinderPattern *center = self.possibleCenters[index];
        if ([center aboutEquals:estimatedModuleSize i:centerI j:centerJ]) {
          self.possibleCenters[index] = [center combineEstimateI:centerI j:centerJ newModuleSize:estimatedModuleSize];
          found = YES;
          break;
        }
      }

      if (!found) {
        ZXResultPoint *point = [[ZXQRCodeFinderPattern alloc] initWithPosX:centerJ posY:centerI estimatedModuleSize:estimatedModuleSize];
        [self.possibleCenters addObject:point];
        if (self.resultPointCallback != nil) {
          [self.resultPointCallback foundPossibleResultPoint:point];
        }
      }
      return YES;
    }
  }
  return NO;
}

/**
 * @return number of rows we could safely skip during scanning, based on the first
 *         two finder patterns that have been located. In some cases their position will
 *         allow us to infer that the third pattern must lie below a certain point farther
 *         down in the image.
 */
- (int)findRowSkip {
  int max = (int)[self.possibleCenters count];
  if (max <= 1) {
    return 0;
  }
  ZXResultPoint *firstConfirmedCenter = nil;
  for (int i = 0; i < max; i++) {
    ZXQRCodeFinderPattern *center = self.possibleCenters[i];
    if ([center count] >= ZX_CENTER_QUORUM) {
      if (firstConfirmedCenter == nil) {
        firstConfirmedCenter = center;
      } else {
        self.hasSkipped = YES;
        return (int)(fabsf([firstConfirmedCenter x] - [center x]) - fabsf([firstConfirmedCenter y] - [center y])) / 2;
      }
    }
  }
  return 0;
}

/**
 * @return true iff we have found at least 3 finder patterns that have been detected
 *         at least ZX_CENTER_QUORUM times each, and, the estimated module size of the
 *         candidates is "pretty similar"
 */
- (BOOL)haveMultiplyConfirmedCenters {
  int confirmedCount = 0;
  float totalModuleSize = 0.0f;
  int max = (int)[self.possibleCenters count];
  for (int i = 0; i < max; i++) {
    ZXQRCodeFinderPattern *pattern = self.possibleCenters[i];
    if ([pattern count] >= ZX_CENTER_QUORUM) {
      confirmedCount++;
      totalModuleSize += [pattern estimatedModuleSize];
    }
  }
  if (confirmedCount < 3) {
    return NO;
  }

  float average = totalModuleSize / (float)max;
  float totalDeviation = 0.0f;
  for (int i = 0; i < max; i++) {
    ZXQRCodeFinderPattern *pattern = self.possibleCenters[i];
    totalDeviation += fabsf([pattern estimatedModuleSize] - average);
  }
  return totalDeviation <= 0.05f * totalModuleSize;
}

/**
 * Orders by ZXFinderPattern count, descending.
 */
NSInteger centerCompare(id center1, id center2, void *context) {
  float average = [(__bridge NSNumber *)context floatValue];

  if ([((ZXQRCodeFinderPattern *)center2) count] == [((ZXQRCodeFinderPattern *)center1) count]) {
    float dA = fabsf([((ZXQRCodeFinderPattern *)center2) estimatedModuleSize] - average);
    float dB = fabsf([((ZXQRCodeFinderPattern *)center1) estimatedModuleSize] - average);
    return dA < dB ? 1 : dA == dB ? 0 : -1;
  } else {
    return [((ZXQRCodeFinderPattern *)center2) count] - [((ZXQRCodeFinderPattern *)center1) count];
  }
}

/**
 * Orders by furthest from average
 */
NSInteger furthestFromAverageCompare(id center1, id center2, void *context) {
  float average = [(__bridge NSNumber *)context floatValue];

  float dA = fabsf([((ZXQRCodeFinderPattern *)center2) estimatedModuleSize] - average);
  float dB = fabsf([((ZXQRCodeFinderPattern *)center1) estimatedModuleSize] - average);
  return dA < dB ? -1 : dA == dB ? 0 : 1;
}

/**
 * @return the 3 best ZXFinderPatterns from our list of candidates. The "best" are
 *         those that have been detected at least ZXCENTER_QUORUM times, and whose module
 *         size differs from the average among those patterns the least
 * @return nil if 3 such finder patterns do not exist
 */
- (NSMutableArray *)selectBestPatterns {
  int startSize = (int)[self.possibleCenters count];
  if (startSize < 3) {
    return nil;
  }

  if (startSize > 3) {
    float totalModuleSize = 0.0f;
    float square = 0.0f;
    for (int i = 0; i < startSize; i++) {
      float size = [self.possibleCenters[i] estimatedModuleSize];
      totalModuleSize += size;
      square += size * size;
    }
    float average = totalModuleSize / (float)startSize;
    float stdDev = (float)sqrt(square / startSize - average * average);

    [self.possibleCenters sortUsingFunction: furthestFromAverageCompare context: (__bridge void *)@(average)];

    float limit = MAX(0.2f * average, stdDev);

    for (int i = 0; i < [self.possibleCenters count] && [self.possibleCenters count] > 3; i++) {
      ZXQRCodeFinderPattern *pattern = self.possibleCenters[i];
      if (fabsf([pattern estimatedModuleSize] - average) > limit) {
        [self.possibleCenters removeObjectAtIndex:i];
        i--;
      }
    }
  }

  if ([self.possibleCenters count] > 3) {
    float totalModuleSize = 0.0f;
    for (int i = 0; i < [self.possibleCenters count]; i++) {
      totalModuleSize += [self.possibleCenters[i] estimatedModuleSize];
    }

    float average = totalModuleSize / (float)[self.possibleCenters count];

    [self.possibleCenters sortUsingFunction:centerCompare context:(__bridge void *)(@(average))];

    self.possibleCenters = [[NSMutableArray alloc] initWithArray:[self.possibleCenters subarrayWithRange:NSMakeRange(0, 3)]];
  }

  return [@[self.possibleCenters[0], self.possibleCenters[1], self.possibleCenters[2]] mutableCopy];
}

@end
