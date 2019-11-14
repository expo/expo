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

#import "ZXAbstractExpandedDecoder.h"
#import "ZXBitArray.h"
#import "ZXBitArrayBuilder.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXResult.h"
#import "ZXRSSDataCharacter.h"
#import "ZXRSSExpandedPair.h"
#import "ZXRSSExpandedReader.h"
#import "ZXRSSExpandedRow.h"
#import "ZXRSSFinderPattern.h"
#import "ZXRSSUtils.h"

const int ZX_SYMBOL_WIDEST[] = {7, 5, 4, 3, 1};
const int ZX_EVEN_TOTAL_SUBSET[] = {4, 20, 52, 104, 204};
const int ZX_GSUM[] = {0, 348, 1388, 2948, 3988};

const int ZX_WEIGHTS[][8] = {
  {  1,   3,   9,  27,  81,  32,  96,  77},
  { 20,  60, 180, 118, 143,   7,  21,  63},
  {189, 145,  13,  39, 117, 140, 209, 205},
  {193, 157,  49, 147,  19,  57, 171,  91},
  { 62, 186, 136, 197, 169,  85,  44, 132},
  {185, 133, 188, 142,   4,  12,  36, 108},
  {113, 128, 173,  97,  80,  29,  87,  50},
  {150,  28,  84,  41, 123, 158,  52, 156},
  { 46, 138, 203, 187, 139, 206, 196, 166},
  { 76,  17,  51, 153,  37, 111, 122, 155},
  { 43, 129, 176, 106, 107, 110, 119, 146},
  { 16,  48, 144,  10,  30,  90,  59, 177},
  {109, 116, 137, 200, 178, 112, 125, 164},
  { 70, 210, 208, 202, 184, 130, 179, 115},
  {134, 191, 151,  31,  93,  68, 204, 190},
  {148,  22,  66, 198, 172,   94, 71,   2},
  {  6,  18,  54, 162,  64,  192,154,  40},
  {120, 149,  25,  75,  14,   42,126, 167},
  { 79,  26,  78,  23,  69,  207,199, 175},
  {103,  98,  83,  38, 114, 131, 182, 124},
  {161,  61, 183, 127, 170,  88,  53, 159},
  { 55, 165,  73,   8,  24,  72,   5,  15},
  { 45, 135, 194, 160,  58, 174, 100,  89}
};

const int ZX_FINDER_PAT_A = 0;
const int ZX_FINDER_PAT_B = 1;
const int ZX_FINDER_PAT_C = 2;
const int ZX_FINDER_PAT_D = 3;
const int ZX_FINDER_PAT_E = 4;
const int ZX_FINDER_PAT_F = 5;

#define ZX_FINDER_PATTERN_SEQUENCES_LEN 10
#define ZX_FINDER_PATTERN_SEQUENCES_SUBLEN 11
const int ZX_FINDER_PATTERN_SEQUENCES[ZX_FINDER_PATTERN_SEQUENCES_LEN][ZX_FINDER_PATTERN_SEQUENCES_SUBLEN] = {
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_A },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_B, ZX_FINDER_PAT_B },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_C, ZX_FINDER_PAT_B, ZX_FINDER_PAT_D },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_E, ZX_FINDER_PAT_B, ZX_FINDER_PAT_D, ZX_FINDER_PAT_C },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_E, ZX_FINDER_PAT_B, ZX_FINDER_PAT_D, ZX_FINDER_PAT_D, ZX_FINDER_PAT_F },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_E, ZX_FINDER_PAT_B, ZX_FINDER_PAT_D, ZX_FINDER_PAT_E, ZX_FINDER_PAT_F, ZX_FINDER_PAT_F },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_A, ZX_FINDER_PAT_B, ZX_FINDER_PAT_B, ZX_FINDER_PAT_C, ZX_FINDER_PAT_C, ZX_FINDER_PAT_D, ZX_FINDER_PAT_D },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_A, ZX_FINDER_PAT_B, ZX_FINDER_PAT_B, ZX_FINDER_PAT_C, ZX_FINDER_PAT_C, ZX_FINDER_PAT_D, ZX_FINDER_PAT_E, ZX_FINDER_PAT_E },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_A, ZX_FINDER_PAT_B, ZX_FINDER_PAT_B, ZX_FINDER_PAT_C, ZX_FINDER_PAT_C, ZX_FINDER_PAT_D, ZX_FINDER_PAT_E, ZX_FINDER_PAT_F, ZX_FINDER_PAT_F },
  { ZX_FINDER_PAT_A, ZX_FINDER_PAT_A, ZX_FINDER_PAT_B, ZX_FINDER_PAT_B, ZX_FINDER_PAT_C, ZX_FINDER_PAT_D, ZX_FINDER_PAT_D, ZX_FINDER_PAT_E, ZX_FINDER_PAT_E, ZX_FINDER_PAT_F, ZX_FINDER_PAT_F },
};

@interface ZXRSSExpandedReader ()

@property (nonatomic, strong, readonly) ZXIntArray *startEnd;
@property (nonatomic, strong, readonly) NSMutableArray *pairs;
@property (nonatomic, strong) NSMutableArray *rows;
@property (nonatomic, assign) BOOL startFromEven;

@end

@implementation ZXRSSExpandedReader

- (id)init {
  if (self = [super init]) {
    _pairs = [NSMutableArray array];
    _rows = [NSMutableArray array];
    _startFromEven = NO;
    _startEnd = [[ZXIntArray alloc] initWithLength:2];
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  // Rows can start with even pattern in case in prev rows there where odd number of patters.
  // So lets try twice
  [self.pairs removeAllObjects];
  self.startFromEven = NO;
  NSMutableArray* pairs = [self decodeRow2pairs:rowNumber row:row error:error];
  if (pairs) {
    ZXResult *result = [self constructResult:pairs error:error];
    if (result) {
      return result;
    }
  }

  [self.pairs removeAllObjects];
  self.startFromEven = YES;
  pairs = [self decodeRow2pairs:rowNumber row:row error:error];
  if (!pairs) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  return [self constructResult:pairs error:error];
}

- (void)reset {
  [self.pairs removeAllObjects];
  [self.rows removeAllObjects];
}

- (NSMutableArray *)decodeRow2pairs:(int)rowNumber row:(ZXBitArray *)row error:(NSError **)error {
  while (YES) {
    ZXRSSExpandedPair *nextPair = [self retrieveNextPair:row previousPairs:self.pairs rowNumber:rowNumber];
    if (!nextPair) {
      if ([self.pairs count] == 0) {
        return nil;
      }
      break;
    }
    [self.pairs addObject:nextPair];
  }

  // TODO: verify sequence of finder patterns as in checkPairSequence()
  if ([self checkChecksum]) {
    return self.pairs;
  }

  BOOL tryStackedDecode = [self.rows count] > 0;
  BOOL wasReversed = NO; // TODO: deal with reversed rows
  [self storeRow:rowNumber wasReversed:wasReversed];
  if (tryStackedDecode) {
    // When the image is 180-rotated, then rows are sorted in wrong dirrection.
    // Try twice with both the directions.
    NSMutableArray *ps = [self checkRows:NO];
    if (ps) {
      return ps;
    }
    ps = [self checkRows:YES];
    if (ps) {
      return ps;
    }
  }

  return nil;
}

- (NSMutableArray *)checkRows:(BOOL)reverse {
  // Limit number of rows we are checking
  // We use recursive algorithm with pure complexity and don't want it to take forever
  // Stacked barcode can have up to 11 rows, so 25 seems resonable enough
  if (self.rows.count > 25) {
    [self.rows removeAllObjects];
    return nil;
  }

	[self.pairs removeAllObjects];
  if (reverse) {
    self.rows = [[[self.rows reverseObjectEnumerator] allObjects] mutableCopy];
  }

  NSMutableArray *ps = [self checkRows:[NSMutableArray array] current:0];

  if (reverse) {
    self.rows = [[[self.rows reverseObjectEnumerator] allObjects] mutableCopy];
  }

  return ps;
}

// Try to construct a valid rows sequence
// Recursion is used to implement backtracking
- (NSMutableArray *)checkRows:(NSMutableArray *)collectedRows current:(int)currentRow {
  for (int i = currentRow; i < [self.rows count]; i++) {
    ZXRSSExpandedRow *row = self.rows[i];
    [self.pairs removeAllObjects];
    NSUInteger size = [collectedRows count];
    for (int j = 0; j < size; j++) {
      [self.pairs addObjectsFromArray:[collectedRows[j] pairs]];
    }
    [self.pairs addObjectsFromArray:row.pairs];

    if (![self isValidSequence:self.pairs]) {
      continue;
    }

    if ([self checkChecksum]) {
      return self.pairs;
    }

    NSMutableArray *rs = [NSMutableArray array];
    [rs addObjectsFromArray:collectedRows];
    [rs addObject:row];
    NSMutableArray *ps = [self checkRows:rs current:i + 1];
    if (ps) {
      return ps;
    }
  }
  return nil;
}

// Whether the pairs form a valid find pattern seqience,
// either complete or a prefix
- (BOOL)isValidSequence:(NSArray *)pairs {
  int count = (int)[pairs count];
  for (int i = 0, sz = 2; i < ZX_FINDER_PATTERN_SEQUENCES_LEN; i++, sz++) {
    if (count > sz) {
      continue;
    }

    BOOL stop = YES;
    for (int j = 0; j < count; j++) {
      if ([[pairs[j] finderPattern] value] != ZX_FINDER_PATTERN_SEQUENCES[i][j]) {
        stop = NO;
        break;
      }
    }

    if (stop) {
      return YES;
    }
  }

  return NO;
}

- (void)storeRow:(int)rowNumber wasReversed:(BOOL)wasReversed {
  // Discard if duplicate above or below; otherwise insert in order by row number.
  int insertPos = 0;
  BOOL prevIsSame = NO;
  BOOL nextIsSame = NO;
  while (insertPos < [self.rows count]) {
    ZXRSSExpandedRow *erow = self.rows[insertPos];
    if (erow.rowNumber > rowNumber) {
      nextIsSame = [erow isEquivalent:self.pairs];
      break;
    }
    prevIsSame = [erow isEquivalent:self.pairs];
    insertPos++;
  }
  if (nextIsSame || prevIsSame) {
    return;
  }

  // When the row was partially decoded (e.g. 2 pairs found instead of 3),
  // it will prevent us from detecting the barcode.
  // Try to merge partial rows

  // Check whether the row is part of an allready detected row
  if ([self isPartialRow:self.pairs of:self.rows]) {
    return;
  }

  [self.rows insertObject:[[ZXRSSExpandedRow alloc] initWithPairs:self.pairs rowNumber:rowNumber wasReversed:wasReversed] atIndex:insertPos];

  [self removePartialRows:self.pairs from:self.rows];
}

// Remove all the rows that contains only specified pairs
- (void)removePartialRows:(NSArray *)pairs from:(NSMutableArray *)rows {
  NSMutableArray *toRemove = [NSMutableArray array];
  for (ZXRSSExpandedRow *r in rows) {
    if ([r.pairs count] == [pairs count]) {
      continue;
    }
    BOOL allFound = YES;
    for (ZXRSSExpandedPair *p in r.pairs) {
      BOOL found = NO;
      for (ZXRSSExpandedPair *pp in pairs) {
        if ([p isEqual:pp]) {
          found = YES;
          break;
        }
      }
      if (!found) {
        allFound = NO;
        break;
      }
    }
    if (allFound) {
      [toRemove addObject:r];
    }
  }

  for (ZXRSSExpandedRow *r in toRemove) {
    [rows removeObject:r];
  }
}

- (BOOL)isPartialRow:(NSArray *)pairs of:(NSArray *)rows {
  for (ZXRSSExpandedRow *r in rows) {
		BOOL allFound = YES;
    for (ZXRSSExpandedPair *p in pairs) {
      BOOL found = NO;
      for (ZXRSSExpandedPair *pp in r.pairs) {
        if ([p isEqual:pp]) {
          found = YES;
          break;
        }
      }
      if (!found) {
        allFound = NO;
        break;
      }
    }
    if (allFound) {
      // the row 'r' contain all the pairs from 'pairs'
      return YES;
    }
  }
  return NO;
}

- (ZXResult *)constructResult:(NSMutableArray *)pairs error:(NSError **)error {
  ZXBitArray *binary = [ZXBitArrayBuilder buildBitArray:pairs];

  ZXAbstractExpandedDecoder *decoder = [ZXAbstractExpandedDecoder createDecoder:binary];
  NSString *resultingString = [decoder parseInformationWithError:error];
  if (!resultingString) {
    return nil;
  }

  NSArray *firstPoints = [[((ZXRSSExpandedPair *)_pairs[0]) finderPattern] resultPoints];
  NSArray *lastPoints = [[((ZXRSSExpandedPair *)[_pairs lastObject]) finderPattern] resultPoints];

  return [ZXResult resultWithText:resultingString
                         rawBytes:nil
                     resultPoints:@[firstPoints[0], firstPoints[1], lastPoints[0], lastPoints[1]]
                           format:kBarcodeFormatRSSExpanded];
}

- (BOOL)checkChecksum {
  ZXRSSExpandedPair *firstPair = self.pairs[0];
  ZXRSSDataCharacter *checkCharacter = firstPair.leftChar;
  ZXRSSDataCharacter *firstCharacter = firstPair.rightChar;

  if (!firstCharacter) {
    return NO;
  }

  int checksum = [firstCharacter checksumPortion];
  int s = 2;

  for (int i = 1; i < self.pairs.count; ++i) {
    ZXRSSExpandedPair *currentPair = self.pairs[i];
    checksum += currentPair.leftChar.checksumPortion;
    s++;
    ZXRSSDataCharacter *currentRightChar = currentPair.rightChar;
    if (currentRightChar != nil) {
      checksum += currentRightChar.checksumPortion;
      s++;
    }
  }

  checksum %= 211;

  int checkCharacterValue = 211 * (s - 4) + checksum;

  return checkCharacterValue == checkCharacter.value;
}

- (int)nextSecondBar:(ZXBitArray *)row initialPos:(int)initialPos {
  int currentPos;
  if ([row get:initialPos]) {
    currentPos = [row nextUnset:initialPos];
    currentPos = [row nextSet:currentPos];
  } else {
    currentPos = [row nextSet:initialPos];
    currentPos = [row nextUnset:currentPos];
  }
  return currentPos;
}

- (ZXRSSExpandedPair *)retrieveNextPair:(ZXBitArray *)row previousPairs:(NSMutableArray *)previousPairs rowNumber:(int)rowNumber {
  BOOL isOddPattern = [previousPairs count] % 2 == 0;
  if (self.startFromEven) {
    isOddPattern = !isOddPattern;
  }

  ZXRSSFinderPattern *pattern;

  BOOL keepFinding = YES;
  int forcedOffset = -1;
  do {
    if (![self findNextPair:row previousPairs:previousPairs forcedOffset:forcedOffset]) {
      return nil;
    }
    pattern = [self parseFoundFinderPattern:row rowNumber:rowNumber oddPattern:isOddPattern];
    if (pattern == nil) {
      forcedOffset = [self nextSecondBar:row initialPos:self.startEnd.array[0]];
    } else {
      keepFinding = NO;
    }
  } while (keepFinding);

  // When stacked symbol is split over multiple rows, there's no way to guess if this pair can be last or not.
  // boolean mayBeLast = checkPairSequence(previousPairs, pattern);

  ZXRSSDataCharacter *leftChar = [self decodeDataCharacter:row pattern:pattern isOddPattern:isOddPattern leftChar:YES];
  if (!leftChar) {
    return nil;
  }

  if (previousPairs.count > 0 && [[previousPairs lastObject] mustBeLast]) {
    return nil;
  }

  ZXRSSDataCharacter *rightChar = [self decodeDataCharacter:row pattern:pattern isOddPattern:isOddPattern leftChar:NO];
  BOOL mayBeLast = YES;
  return [[ZXRSSExpandedPair alloc] initWithLeftChar:leftChar rightChar:rightChar finderPattern:pattern mayBeLast:mayBeLast];
}

- (BOOL)findNextPair:(ZXBitArray *)row previousPairs:(NSMutableArray *)previousPairs forcedOffset:(int)forcedOffset {
  ZXIntArray *counters = self.decodeFinderCounters;
  [counters clear];

  int width = row.size;

  int rowOffset;
  if (forcedOffset >= 0) {
    rowOffset = forcedOffset;
  } else if ([previousPairs count] == 0) {
    rowOffset = 0;
  } else {
    ZXRSSExpandedPair *lastPair = [previousPairs lastObject];
    rowOffset = [[lastPair finderPattern] startEnd].array[1];
  }
  BOOL searchingEvenPair = [previousPairs count] % 2 != 0;
  if (self.startFromEven) {
    searchingEvenPair = !searchingEvenPair;
  }

  BOOL isWhite = NO;
  while (rowOffset < width) {
    isWhite = ![row get:rowOffset];
    if (!isWhite) {
      break;
    }
    rowOffset++;
  }

  int counterPosition = 0;
  int patternStart = rowOffset;
  int32_t *array = counters.array;
  for (int x = rowOffset; x < width; x++) {
    if ([row get:x] ^ isWhite) {
      array[counterPosition]++;
    } else {
      if (counterPosition == 3) {
        if (searchingEvenPair) {
          [self reverseCounters:counters];
        }

        if ([ZXAbstractRSSReader isFinderPattern:counters]) {
          self.startEnd.array[0] = patternStart;
          self.startEnd.array[1] = x;
          return YES;
        }

        if (searchingEvenPair) {
          [self reverseCounters:counters];
        }

        patternStart += array[0] + array[1];
        array[0] = array[2];
        array[1] = array[3];
        array[2] = 0;
        array[3] = 0;
        counterPosition--;
      } else {
        counterPosition++;
      }
      array[counterPosition] = 1;
      isWhite = !isWhite;
    }
  }
  return NO;
}

- (void)reverseCounters:(ZXIntArray *)counters {
  int length = counters.length;
  int32_t *array = counters.array;
  for (int i = 0; i < length / 2; ++i) {
    int tmp = array[i];
    array[i] = array[length - i - 1];
    array[length - i - 1] = tmp;
  }
}

- (ZXRSSFinderPattern *)parseFoundFinderPattern:(ZXBitArray *)row rowNumber:(int)rowNumber oddPattern:(BOOL)oddPattern {
  // Actually we found elements 2-5.
  int firstCounter;
  int start;
  int end;

  if (oddPattern) {
    // If pattern number is odd, we need to locate element 1 *before *the current block.

    int firstElementStart = self.startEnd.array[0] - 1;
    // Locate element 1
    while (firstElementStart >= 0 && ![row get:firstElementStart]) {
      firstElementStart--;
    }

    firstElementStart++;
    firstCounter = self.startEnd.array[0] - firstElementStart;
    start = firstElementStart;
    end = self.startEnd.array[1];
  } else {
    // If pattern number is even, the pattern is reversed, so we need to locate element 1 *after *the current block.

    start = self.startEnd.array[0];

    end = [row nextUnset:self.startEnd.array[1] + 1];
    firstCounter = end - self.startEnd.array[1];
  }

  // Make 'counters' hold 1-4
  ZXIntArray *counters = [[ZXIntArray alloc] initWithLength:self.decodeFinderCounters.length];
  for (int i = 1; i < counters.length; i++) {
    counters.array[i] = self.decodeFinderCounters.array[i - 1];
  }

  counters.array[0] = firstCounter;
  memcpy(self.decodeFinderCounters.array, counters.array, counters.length * sizeof(int32_t));

  int value = [ZXAbstractRSSReader parseFinderValue:counters finderPatternType:ZX_RSS_PATTERNS_RSS_EXPANDED_PATTERNS];
  if (value == -1) {
    return nil;
  }
  return [[ZXRSSFinderPattern alloc] initWithValue:value startEnd:[[ZXIntArray alloc] initWithInts:start, end, -1] start:start end:end rowNumber:rowNumber];
}

- (ZXRSSDataCharacter *)decodeDataCharacter:(ZXBitArray *)row pattern:(ZXRSSFinderPattern *)pattern isOddPattern:(BOOL)isOddPattern leftChar:(BOOL)leftChar {
  ZXIntArray *counters = self.dataCharacterCounters;
  [counters clear];

  if (leftChar) {
    if (![ZXOneDReader recordPatternInReverse:row start:[pattern startEnd].array[0] counters:counters]) {
      return nil;
    }
  } else {
    if (![ZXOneDReader recordPattern:row start:[pattern startEnd].array[1] counters:counters]) {
      return nil;
    }
    // reverse it
    int32_t *array = counters.array;
    for (int i = 0, j = counters.length - 1; i < j; i++, j--) {
      int temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }//counters[] has the pixels of the module

  int numModules = 17; //left and right data characters have all the same length
  float elementWidth = (float)[ZXAbstractRSSReader count:counters] / (float)numModules;

  // Sanity check: element width for pattern and the character should match
  float expectedElementWidth = (pattern.startEnd.array[1] - pattern.startEnd.array[0]) / 15.0f;
  if (fabsf(elementWidth - expectedElementWidth) / expectedElementWidth > 0.3f) {
    return nil;
  }

  int32_t *array = counters.array;
  for (int i = 0; i < counters.length; i++) {
    float value = 1.0f * array[i] / elementWidth;
    int count = (int)(value + 0.5f);
    if (count < 1) {
      if (value < 0.3f) {
        return nil;
      }
      count = 1;
    } else if (count > 8) {
      if (value > 8.7f) {
        return nil;
      }
      count = 8;
    }
    int offset = i / 2;
    if ((i & 0x01) == 0) {
      self.oddCounts.array[offset] = count;
      self.oddRoundingErrors[offset] = value - count;
    } else {
      self.evenCounts.array[offset] = count;
      self.evenRoundingErrors[offset] = value - count;
    }
  }

  if (![self adjustOddEvenCounts:numModules]) {
    return nil;
  }

  int weightRowNumber = 4 * pattern.value + (isOddPattern ? 0 : 2) + (leftChar ? 0 : 1) - 1;

  int oddSum = 0;
  int oddChecksumPortion = 0;
  for (int i = self.oddCounts.length - 1; i >= 0; i--) {
    if ([self isNotA1left:pattern isOddPattern:isOddPattern leftChar:leftChar]) {
      int weight = ZX_WEIGHTS[weightRowNumber][2 * i];
      oddChecksumPortion += self.oddCounts.array[i] * weight;
    }
    oddSum += self.oddCounts.array[i];
  }
  int evenChecksumPortion = 0;
  //int evenSum = 0;
  for (int i = self.evenCounts.length - 1; i >= 0; i--) {
    if ([self isNotA1left:pattern isOddPattern:isOddPattern leftChar:leftChar]) {
      int weight = ZX_WEIGHTS[weightRowNumber][2 * i + 1];
      evenChecksumPortion += self.evenCounts.array[i] * weight;
    }
    //evenSum += self.evenCounts[i];
  }
  int checksumPortion = oddChecksumPortion + evenChecksumPortion;

  if ((oddSum & 0x01) != 0 || oddSum > 13 || oddSum < 4) {
    return nil;
  }

  int group = (13 - oddSum) / 2;
  int oddWidest = ZX_SYMBOL_WIDEST[group];
  int evenWidest = 9 - oddWidest;
  int vOdd = [ZXRSSUtils rssValue:self.oddCounts maxWidth:oddWidest noNarrow:YES];
  int vEven = [ZXRSSUtils rssValue:self.evenCounts maxWidth:evenWidest noNarrow:NO];
  int tEven = ZX_EVEN_TOTAL_SUBSET[group];
  int gSum = ZX_GSUM[group];
  int value = vOdd * tEven + vEven + gSum;
  return [[ZXRSSDataCharacter alloc] initWithValue:value checksumPortion:checksumPortion];
}

- (BOOL)isNotA1left:(ZXRSSFinderPattern *)pattern isOddPattern:(BOOL)isOddPattern leftChar:(BOOL)leftChar {
  return !([pattern value] == 0 && isOddPattern && leftChar);
}

- (BOOL)adjustOddEvenCounts:(int)numModules {
  int oddSum = [ZXAbstractRSSReader count:self.oddCounts];
  int evenSum = [ZXAbstractRSSReader count:self.evenCounts];
  int mismatch = oddSum + evenSum - numModules;
  BOOL oddParityBad = (oddSum & 0x01) == 1;
  BOOL evenParityBad = (evenSum & 0x01) == 0;
  BOOL incrementOdd = NO;
  BOOL decrementOdd = NO;
  if (oddSum > 13) {
    decrementOdd = YES;
  } else if (oddSum < 4) {
    incrementOdd = YES;
  }
  BOOL incrementEven = NO;
  BOOL decrementEven = NO;
  if (evenSum > 13) {
    decrementEven = YES;
  } else if (evenSum < 4) {
    incrementEven = YES;
  }

  if (mismatch == 1) {
    if (oddParityBad) {
      if (evenParityBad) {
        return NO;
      }
      decrementOdd = YES;
    } else {
      if (!evenParityBad) {
        return NO;
      }
      decrementEven = YES;
    }
  } else if (mismatch == -1) {
    if (oddParityBad) {
      if (evenParityBad) {
        return NO;
      }
      incrementOdd = YES;
    } else {
      if (!evenParityBad) {
        return NO;
      }
      incrementEven = YES;
    }
  } else if (mismatch == 0) {
    if (oddParityBad) {
      if (!evenParityBad) {
        return NO;
      }
      if (oddSum < evenSum) {
        incrementOdd = YES;
        decrementEven = YES;
      } else {
        decrementOdd = YES;
        incrementEven = YES;
      }
    } else {
      if (evenParityBad) {
        return NO;
      }
    }
  } else {
    return NO;
  }

  if (incrementOdd) {
    if (decrementOdd) {
      return NO;
    }
    [ZXAbstractRSSReader increment:self.oddCounts errors:self.oddRoundingErrors];
  }
  if (decrementOdd) {
    [ZXAbstractRSSReader decrement:self.oddCounts errors:self.oddRoundingErrors];
  }
  if (incrementEven) {
    if (decrementEven) {
      return NO;
    }
    [ZXAbstractRSSReader increment:self.evenCounts errors:self.oddRoundingErrors];
  }
  if (decrementEven) {
    [ZXAbstractRSSReader decrement:self.evenCounts errors:self.evenRoundingErrors];
  }
  return YES;
}

@end
