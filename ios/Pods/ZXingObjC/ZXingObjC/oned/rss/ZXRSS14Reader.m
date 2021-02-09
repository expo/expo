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
#import "ZXBarcodeFormat.h"
#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXResult.h"
#import "ZXResultPointCallback.h"
#import "ZXRSS14Reader.h"
#import "ZXRSSFinderPattern.h"
#import "ZXRSSPair.h"
#import "ZXRSSUtils.h"

const int ZX_RSS14_OUTSIDE_EVEN_TOTAL_SUBSET[5] = {1,10,34,70,126};
const int ZX_RSS14_INSIDE_ODD_TOTAL_SUBSET[4] = {4,20,48,81};
const int ZX_RSS14_OUTSIDE_GSUM[5] = {0,161,961,2015,2715};
const int ZX_RSS14_INSIDE_GSUM[4] = {0,336,1036,1516};
const int ZX_RSS14_OUTSIDE_ODD_WIDEST[5] = {8,6,4,3,1};
const int ZX_RSS14_INSIDE_ODD_WIDEST[4] = {2,4,6,8};

@interface ZXRSS14Reader ()

@property (nonatomic, strong, readonly) NSMutableArray *possibleLeftPairs;
@property (nonatomic, strong, readonly) NSMutableArray *possibleRightPairs;

@end

@implementation ZXRSS14Reader

- (id)init {
  if (self = [super init]) {
    _possibleLeftPairs = [NSMutableArray array];
    _possibleRightPairs = [NSMutableArray array];
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXRSSPair *leftPair = [self decodePair:row right:NO rowNumber:rowNumber hints:hints];
  [self addOrTally:self.possibleLeftPairs pair:leftPair];
  [row reverse];
  ZXRSSPair *rightPair = [self decodePair:row right:YES rowNumber:rowNumber hints:hints];
  [self addOrTally:self.possibleRightPairs pair:rightPair];
  [row reverse];

  for (ZXRSSPair *left in self.possibleLeftPairs) {
    if ([left count] > 1) {
      for (ZXRSSPair *right in self.possibleRightPairs) {
        if ([right count] > 1) {
          if ([self checkChecksum:left rightPair:right]) {
            return [self constructResult:left rightPair:right];
          }
        }
      }
    }
  }

  if (error) *error = ZXNotFoundErrorInstance();
  return nil;
}

- (void)addOrTally:(NSMutableArray *)possiblePairs pair:(ZXRSSPair *)pair {
  if (pair == nil) {
    return;
  }
  BOOL found = NO;
  for (ZXRSSPair *other in possiblePairs) {
    if (other.value == pair.value) {
      [other incrementCount];
      found = YES;
      break;
    }
  }

  if (!found) {
    [possiblePairs addObject:pair];
  }
}

- (void)reset {
  [self.possibleLeftPairs removeAllObjects];
  [self.possibleRightPairs removeAllObjects];
}

- (ZXResult *)constructResult:(ZXRSSPair *)leftPair rightPair:(ZXRSSPair *)rightPair {
  long long symbolValue = 4537077LL * leftPair.value + rightPair.value;
  NSString *text = [@(symbolValue) stringValue];
  NSMutableString *buffer = [NSMutableString stringWithCapacity:14];

  for (int i = 13 - (int)[text length]; i > 0; i--) {
    [buffer appendString:@"0"];
  }

  [buffer appendString:text];
  int checkDigit = 0;

  for (int i = 0; i < 13; i++) {
    int digit = [buffer characterAtIndex:i] - '0';
    checkDigit += (i & 0x01) == 0 ? 3 * digit : digit;
  }

  checkDigit = 10 - (checkDigit % 10);
  if (checkDigit == 10) {
    checkDigit = 0;
  }
  [buffer appendFormat:@"%d", checkDigit];
  NSArray *leftPoints = [[leftPair finderPattern] resultPoints];
  NSArray *rightPoints = [[rightPair finderPattern] resultPoints];
  return [ZXResult resultWithText:buffer
                         rawBytes:nil
                     resultPoints:@[leftPoints[0], leftPoints[1], rightPoints[0], rightPoints[1]]
                           format:kBarcodeFormatRSS14];
}

- (BOOL)checkChecksum:(ZXRSSPair *)leftPair rightPair:(ZXRSSPair *)rightPair {
//  int leftFPValue = leftPair.finderPattern.value;
//  int rightFPValue = rightPair.finderPattern.value;
//  if ((leftFPValue == 0 && rightFPValue == 8) || (leftFPValue == 8 && rightFPValue == 0)) {
//  }
  int checkValue = (leftPair.checksumPortion + 16 * rightPair.checksumPortion) % 79;
  int targetCheckValue = 9 * leftPair.finderPattern.value + rightPair.finderPattern.value;
  if (targetCheckValue > 72) {
    targetCheckValue--;
  }
  if (targetCheckValue > 8) {
    targetCheckValue--;
  }
  return checkValue == targetCheckValue;
}

- (ZXRSSPair *)decodePair:(ZXBitArray *)row right:(BOOL)right rowNumber:(int)rowNumber hints:(ZXDecodeHints *)hints {
  ZXIntArray *startEnd = [self findFinderPattern:row rowOffset:0 rightFinderPattern:right];
  if (!startEnd) {
    return nil;
  }
  ZXRSSFinderPattern *pattern = [self parseFoundFinderPattern:row rowNumber:rowNumber right:right startEnd:startEnd];
  if (!pattern) {
    return nil;
  }
  id<ZXResultPointCallback> resultPointCallback = hints == nil ? nil : hints.resultPointCallback;
  if (resultPointCallback != nil) {
    float center = (startEnd.array[0] + startEnd.array[1]) / 2.0f;
    if (right) {
      center = [row size] - 1 - center;
    }
    [resultPointCallback foundPossibleResultPoint:[[ZXResultPoint alloc] initWithX:center y:rowNumber]];
  }
  ZXRSSDataCharacter *outside = [self decodeDataCharacter:row pattern:pattern outsideChar:YES];
  ZXRSSDataCharacter *inside = [self decodeDataCharacter:row pattern:pattern outsideChar:NO];
  if (!outside || !inside) {
    return nil;
  }
  return [[ZXRSSPair alloc] initWithValue:1597 * outside.value + inside.value
                        checksumPortion:outside.checksumPortion + 4 * inside.checksumPortion
                          finderPattern:pattern];
}

- (ZXRSSDataCharacter *)decodeDataCharacter:(ZXBitArray *)row pattern:(ZXRSSFinderPattern *)pattern outsideChar:(BOOL)outsideChar {
  ZXIntArray *counters = self.dataCharacterCounters;
  [counters clear];
  int32_t *array = counters.array;

  if (outsideChar) {
    if (![ZXOneDReader recordPatternInReverse:row start:[pattern startEnd].array[0] counters:counters]) {
      return nil;
    }
  } else {
    if (![ZXOneDReader recordPattern:row start:[pattern startEnd].array[1] counters:counters]) {
      return nil;
    }

    for (int i = 0, j = counters.length - 1; i < j; i++, j--) {
      int temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  int numModules = outsideChar ? 16 : 15;
  float elementWidth = (float)[ZXAbstractRSSReader count:counters] / (float)numModules;

  for (int i = 0; i < counters.length; i++) {
    float value = (float) array[i] / elementWidth;
    int count = (int)(value + 0.5f);
    if (count < 1) {
      count = 1;
    } else if (count > 8) {
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

  if (![self adjustOddEvenCounts:outsideChar numModules:numModules]) {
    return nil;
  }

  int oddSum = 0;
  int oddChecksumPortion = 0;
  for (int i = self.oddCounts.length - 1; i >= 0; i--) {
    oddChecksumPortion *= 9;
    oddChecksumPortion += self.oddCounts.array[i];
    oddSum += self.oddCounts.array[i];
  }
  int evenChecksumPortion = 0;
  int evenSum = 0;
  for (int i = self.evenCounts.length - 1; i >= 0; i--) {
    evenChecksumPortion *= 9;
    evenChecksumPortion += self.evenCounts.array[i];
    evenSum += self.evenCounts.array[i];
  }
  int checksumPortion = oddChecksumPortion + 3 * evenChecksumPortion;

  if (outsideChar) {
    if ((oddSum & 0x01) != 0 || oddSum > 12 || oddSum < 4) {
      return nil;
    }
    int group = (12 - oddSum) / 2;
    int oddWidest = ZX_RSS14_OUTSIDE_ODD_WIDEST[group];
    int evenWidest = 9 - oddWidest;
    int vOdd = [ZXRSSUtils rssValue:self.oddCounts maxWidth:oddWidest noNarrow:NO];
    int vEven = [ZXRSSUtils rssValue:self.evenCounts maxWidth:evenWidest noNarrow:YES];
    int tEven = ZX_RSS14_OUTSIDE_EVEN_TOTAL_SUBSET[group];
    int gSum = ZX_RSS14_OUTSIDE_GSUM[group];
    return [[ZXRSSDataCharacter alloc] initWithValue:vOdd * tEven + vEven + gSum checksumPortion:checksumPortion];
  } else {
    if ((evenSum & 0x01) != 0 || evenSum > 10 || evenSum < 4) {
      return nil;
    }
    int group = (10 - evenSum) / 2;
    int oddWidest = ZX_RSS14_INSIDE_ODD_WIDEST[group];
    int evenWidest = 9 - oddWidest;
    int vOdd = [ZXRSSUtils rssValue:self.oddCounts maxWidth:oddWidest noNarrow:YES];
    int vEven = [ZXRSSUtils rssValue:self.evenCounts maxWidth:evenWidest noNarrow:NO];
    int tOdd = ZX_RSS14_INSIDE_ODD_TOTAL_SUBSET[group];
    int gSum = ZX_RSS14_INSIDE_GSUM[group];
    return [[ZXRSSDataCharacter alloc] initWithValue:vEven * tOdd + vOdd + gSum checksumPortion:checksumPortion];
  }
}

- (ZXIntArray *)findFinderPattern:(ZXBitArray *)row rowOffset:(int)rowOffset rightFinderPattern:(BOOL)rightFinderPattern {
  ZXIntArray *counters = self.decodeFinderCounters;
  [counters clear];
  int32_t *array = counters.array;

  int width = row.size;
  BOOL isWhite = NO;
  while (rowOffset < width) {
    isWhite = ![row get:rowOffset];
    if (rightFinderPattern == isWhite) {
      break;
    }
    rowOffset++;
  }

  int counterPosition = 0;
  int patternStart = rowOffset;
  for (int x = rowOffset; x < width; x++) {
    if ([row get:x] ^ isWhite) {
      array[counterPosition]++;
    } else {
      if (counterPosition == 3) {
        if ([ZXAbstractRSSReader isFinderPattern:counters]) {
          return [[ZXIntArray alloc] initWithInts:patternStart, x, -1];
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

  return nil;
}

- (ZXRSSFinderPattern *)parseFoundFinderPattern:(ZXBitArray *)row rowNumber:(int)rowNumber right:(BOOL)right startEnd:(ZXIntArray *)startEnd {
  BOOL firstIsBlack = [row get:startEnd.array[0]];
  int firstElementStart = startEnd.array[0] - 1;

  while (firstElementStart >= 0 && firstIsBlack ^ [row get:firstElementStart]) {
    firstElementStart--;
  }

  firstElementStart++;
  int firstCounter = startEnd.array[0] - firstElementStart;

  ZXIntArray *counters = self.decodeFinderCounters;
  int32_t *array = counters.array;
  for (int i = counters.length - 1; i > 0; i--) {
    array[i] = array[i-1];
  }
  array[0] = firstCounter;
  int value = [ZXAbstractRSSReader parseFinderValue:counters finderPatternType:ZX_RSS_PATTERNS_RSS14_PATTERNS];
  if (value == -1) {
    return nil;
  }
  int start = firstElementStart;
  int end = startEnd.array[1];
  if (right) {
    start = [row size] - 1 - start;
    end = [row size] - 1 - end;
  }
  return [[ZXRSSFinderPattern alloc] initWithValue:value
                                           startEnd:[[ZXIntArray alloc] initWithInts:firstElementStart, startEnd.array[1], -1]
                                              start:start
                                                end:end
                                          rowNumber:rowNumber];
}

- (BOOL)adjustOddEvenCounts:(BOOL)outsideChar numModules:(int)numModules {
  int oddSum = [ZXAbstractRSSReader count:self.oddCounts];
  int evenSum = [ZXAbstractRSSReader count:self.evenCounts];
  int mismatch = oddSum + evenSum - numModules;
  BOOL oddParityBad = (oddSum & 0x01) == (outsideChar ? 1 : 0);
  BOOL evenParityBad = (evenSum & 0x01) == 1;

  BOOL incrementOdd = NO;
  BOOL decrementOdd = NO;
  BOOL incrementEven = NO;
  BOOL decrementEven = NO;

  if (outsideChar) {
    if (oddSum > 12) {
      decrementOdd = YES;
    } else if (oddSum < 4) {
      incrementOdd = YES;
    }
    if (evenSum > 12) {
      decrementEven = YES;
    } else if (evenSum < 4) {
      incrementEven = YES;
    }
  } else {
    if (oddSum > 11) {
      decrementOdd = YES;
    } else if (oddSum < 5) {
      incrementOdd = YES;
    }
    if (evenSum > 10) {
      decrementEven = YES;
    } else if (evenSum < 4) {
      incrementEven = YES;
    }
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
