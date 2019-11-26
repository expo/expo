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

#import "ZXAbstractRSSReader.h"
#import "ZXIntArray.h"

static float ZX_RSS_MAX_AVG_VARIANCE = 0.2f;
static float ZX_RSS_MAX_INDIVIDUAL_VARIANCE = 0.45f;

float const ZX_RSS_MIN_FINDER_PATTERN_RATIO = 9.5f / 12.0f;
float const ZX_RSS_MAX_FINDER_PATTERN_RATIO = 12.5f / 14.0f;

#define ZX_RSS14_FINDER_PATTERNS_LEN 9
#define ZX_RSS14_FINDER_PATTERNS_SUB_LEN 4
const int ZX_RSS14_FINDER_PATTERNS[ZX_RSS14_FINDER_PATTERNS_LEN][ZX_RSS14_FINDER_PATTERNS_SUB_LEN] = {
  {3,8,2,1},
  {3,5,5,1},
  {3,3,7,1},
  {3,1,9,1},
  {2,7,4,1},
  {2,5,6,1},
  {2,3,8,1},
  {1,5,7,1},
  {1,3,9,1},
};

#define ZX_RSS_EXPANDED_FINDER_PATTERNS_LEN 6
#define ZX_RSS_EXPANDED_FINDER_PATTERNS_SUB_LEN 4
const int ZX_RSS_EXPANDED_FINDER_PATTERNS[ZX_RSS_EXPANDED_FINDER_PATTERNS_LEN][ZX_RSS_EXPANDED_FINDER_PATTERNS_SUB_LEN] = {
  {1,8,4,1}, // A
  {3,6,4,1}, // B
  {3,4,6,1}, // C
  {3,2,8,1}, // D
  {2,6,5,1}, // E
  {2,2,9,1}  // F
};

@implementation ZXAbstractRSSReader

- (id)init {
  if (self = [super init]) {
    _decodeFinderCounters = [[ZXIntArray alloc] initWithLength:4];
    _dataCharacterCounters = [[ZXIntArray alloc] initWithLength:8];

    _oddRoundingErrorsLen = 4;
    _oddRoundingErrors = (float *)malloc(_oddRoundingErrorsLen * sizeof(float));
    memset(_oddRoundingErrors, 0, _oddRoundingErrorsLen * sizeof(float));

    _evenRoundingErrorsLen = 4;
    _evenRoundingErrors = (float *)malloc(_evenRoundingErrorsLen * sizeof(float));
    memset(_evenRoundingErrors, 0, _evenRoundingErrorsLen * sizeof(float));

    _oddCounts = [[ZXIntArray alloc] initWithLength:_dataCharacterCounters.length / 2];
    _evenCounts = [[ZXIntArray alloc] initWithLength:_dataCharacterCounters.length / 2];
  }

  return self;
}

- (void)dealloc {
  if (_oddRoundingErrors != NULL) {
    free(_oddRoundingErrors);
    _oddRoundingErrors = NULL;
  }

  if (_evenRoundingErrors != NULL) {
    free(_evenRoundingErrors);
    _evenRoundingErrors = NULL;
  }
}

+ (int)parseFinderValue:(ZXIntArray *)counters finderPatternType:(ZX_RSS_PATTERNS)finderPatternType {
  switch (finderPatternType) {
    case ZX_RSS_PATTERNS_RSS14_PATTERNS:
      for (int value = 0; value < ZX_RSS14_FINDER_PATTERNS_LEN; value++) {
        if ([self patternMatchVariance:counters pattern:ZX_RSS14_FINDER_PATTERNS[value] maxIndividualVariance:ZX_RSS_MAX_INDIVIDUAL_VARIANCE] < ZX_RSS_MAX_AVG_VARIANCE) {
          return value;
        }
      }
      break;

    case ZX_RSS_PATTERNS_RSS_EXPANDED_PATTERNS:
      for (int value = 0; value < ZX_RSS_EXPANDED_FINDER_PATTERNS_LEN; value++) {
        if ([self patternMatchVariance:counters pattern:ZX_RSS_EXPANDED_FINDER_PATTERNS[value] maxIndividualVariance:ZX_RSS_MAX_INDIVIDUAL_VARIANCE] < ZX_RSS_MAX_AVG_VARIANCE) {
          return value;
        }
      }
      break;

    default:
      break;
  }

  return -1;
}

+ (int)count:(ZXIntArray *)array {
  return [array sum];
}

+ (void)increment:(ZXIntArray *)array errors:(float *)errors {
  int index = 0;
  float biggestError = errors[0];
  for (int i = 1; i < array.length; i++) {
    if (errors[i] > biggestError) {
      biggestError = errors[i];
      index = i;
    }
  }
  array.array[index]++;
}

+ (void)decrement:(ZXIntArray *)array errors:(float *)errors {
  int index = 0;
  float biggestError = errors[0];
  for (int i = 1; i < array.length; i++) {
    if (errors[i] < biggestError) {
      biggestError = errors[i];
      index = i;
    }
  }
  array.array[index]--;
}

+ (BOOL)isFinderPattern:(ZXIntArray *)counters {
  int32_t *array = counters.array;
  int firstTwoSum = array[0] + array[1];
  int sum = firstTwoSum + array[2] + array[3];
  float ratio = (float)firstTwoSum / (float)sum;
  if (ratio >= ZX_RSS_MIN_FINDER_PATTERN_RATIO && ratio <= ZX_RSS_MAX_FINDER_PATTERN_RATIO) {
    int minCounter = INT_MAX;
    int maxCounter = INT_MIN;
    for (int i = 0; i < counters.length; i++) {
      int counter = array[i];
      if (counter > maxCounter) {
        maxCounter = counter;
      }
      if (counter < minCounter) {
        minCounter = counter;
      }
    }

    return maxCounter < 10 * minCounter;
  }
  return NO;
}

@end
