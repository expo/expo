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
#import "ZXCodaBarReader.h"
#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXResult.h"
#import "ZXResultPoint.h"

// These values are critical for determining how permissive the decoding
// will be. All stripe sizes must be within the window these define, as
// compared to the average stripe size.
static float ZX_CODA_MAX_ACCEPTABLE = 2.0f;
static float ZX_CODA_PADDING = 1.5f;

const unichar ZX_CODA_ALPHABET[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '-', '$', ':', '/', '.', '+', 'A', 'B', 'C', 'D', 'T', 'N'};
const int ZX_CODA_ALPHABET_LEN = sizeof(ZX_CODA_ALPHABET) / sizeof(unichar);

/**
 * These represent the encodings of characters, as patterns of wide and narrow bars. The 7 least-significant bits of
 * each int correspond to the pattern of wide and narrow, with 1s representing "wide" and 0s representing narrow.
 */
const int ZX_CODA_CHARACTER_ENCODINGS[] = {
  0x003, 0x006, 0x009, 0x060, 0x012, 0x042, 0x021, 0x024, 0x030, 0x048, // 0-9
  0x00c, 0x018, 0x045, 0x051, 0x054, 0x015, 0x01A, 0x029, 0x00B, 0x00E, // -$:/.+ABCD
};

// minimal number of characters that should be present (inclusing start and stop characters)
// under normal circumstances this should be set to 3, but can be set higher
// as a last-ditch attempt to reduce false positives.
const int ZX_CODA_MIN_CHARACTER_LENGTH = 3;

// official start and end patterns
const unichar ZX_CODA_STARTEND_ENCODING[]  = {'A', 'B', 'C', 'D'};

// some codabar generator allow the codabar string to be closed by every
// character. This will cause lots of false positives!

// some industries use a checksum standard but this is not part of the original codabar standard
// for more information see : http://www.mecsw.com/specs/codabar.html

@interface ZXCodaBarReader ()

@property (nonatomic, strong) NSMutableString *decodeRowResult;
@property (nonatomic, strong) ZXIntArray *counters;
@property (nonatomic, assign) int counterLength;

@end

@implementation ZXCodaBarReader

- (id)init {
  if (self = [super init]) {
    _decodeRowResult = [NSMutableString stringWithCapacity:20];
    _counters = [[ZXIntArray alloc] initWithLength:80];
    _counterLength = 0;
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  [self.counters clear];

  if (![self setCountersWithRow:row]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  int startOffset = [self findStartPattern];
  if (startOffset == -1) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  int nextStart = startOffset;

  self.decodeRowResult = [NSMutableString string];
  do {
    int charOffset = [self toNarrowWidePattern:nextStart];
    if (charOffset == -1) {
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
    }
    // Hack: We store the position in the alphabet table into a
    // NSMutableString, so that we can access the decoded patterns in
    // validatePattern. We'll translate to the actual characters later.
    [self.decodeRowResult appendFormat:@"%C", (unichar)charOffset];
    nextStart += 8;
    // Stop as soon as we see the end character.
    if (self.decodeRowResult.length > 1 &&
        [ZXCodaBarReader arrayContains:ZX_CODA_STARTEND_ENCODING
                                length:sizeof(ZX_CODA_STARTEND_ENCODING) / sizeof(unichar)
                                   key:ZX_CODA_ALPHABET[charOffset]]) {
      break;
    }
  } while (nextStart < self.counterLength); // no fixed end pattern so keep on reading while data is available

  // Look for whitespace after pattern:
  int trailingWhitespace = self.counters.array[nextStart - 1];
  int lastPatternSize = 0;
  for (int i = -8; i < -1; i++) {
    lastPatternSize += self.counters.array[nextStart + i];
  }

  // We need to see whitespace equal to 50% of the last pattern size,
  // otherwise this is probably a false positive. The exception is if we are
  // at the end of the row. (I.e. the barcode barely fits.)
  if (nextStart < self.counterLength && trailingWhitespace < lastPatternSize / 2) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  if (![self validatePattern:startOffset]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  // Translate character table offsets to actual characters.
  for (int i = 0; i < self.decodeRowResult.length; i++) {
    [self.decodeRowResult replaceCharactersInRange:NSMakeRange(i, 1) withString:[NSString stringWithFormat:@"%c", ZX_CODA_ALPHABET[[self.decodeRowResult characterAtIndex:i]]]];
  }
  // Ensure a valid start and end character
  unichar startchar = [self.decodeRowResult characterAtIndex:0];
  if (![ZXCodaBarReader arrayContains:ZX_CODA_STARTEND_ENCODING
                               length:sizeof(ZX_CODA_STARTEND_ENCODING) / sizeof(unichar)
                                  key:startchar]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  unichar endchar = [self.decodeRowResult characterAtIndex:self.decodeRowResult.length - 1];
  if (![ZXCodaBarReader arrayContains:ZX_CODA_STARTEND_ENCODING
                               length:sizeof(ZX_CODA_STARTEND_ENCODING) / sizeof(unichar)
                                  key:endchar]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  // remove stop/start characters character and check if a long enough string is contained
  if (self.decodeRowResult.length <= ZX_CODA_MIN_CHARACTER_LENGTH) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  if (!hints.returnCodaBarStartEnd) {
    [self.decodeRowResult deleteCharactersInRange:NSMakeRange(self.decodeRowResult.length - 1, 1)];
    [self.decodeRowResult deleteCharactersInRange:NSMakeRange(0, 1)];
  }

  int runningCount = 0;
  for (int i = 0; i < startOffset; i++) {
    runningCount += self.counters.array[i];
  }
  float left = (float) runningCount;
  for (int i = startOffset; i < nextStart - 1; i++) {
    runningCount += self.counters.array[i];
  }
  float right = (float) runningCount;
  return [ZXResult resultWithText:self.decodeRowResult
                         rawBytes:nil
                     resultPoints:@[[[ZXResultPoint alloc] initWithX:left y:(float)rowNumber],
                                    [[ZXResultPoint alloc] initWithX:right y:(float)rowNumber]]
                           format:kBarcodeFormatCodabar];
}

- (BOOL)validatePattern:(int)start {
  // First, sum up the total size of our four categories of stripe sizes;
  int sizes[4] = {0, 0, 0, 0};
  int counts[4] = {0, 0, 0, 0};
  int end = (int)self.decodeRowResult.length - 1;

  // We break out of this loop in the middle, in order to handle
  // inter-character spaces properly.
  int pos = start;
  for (int i = 0; true; i++) {
    int pattern = ZX_CODA_CHARACTER_ENCODINGS[[self.decodeRowResult characterAtIndex:i]];
    for (int j = 6; j >= 0; j--) {
      // Even j = bars, while odd j = spaces. Categories 2 and 3 are for
      // long stripes, while 0 and 1 are for short stripes.
      int category = (j & 1) + (pattern & 1) * 2;
      sizes[category] += self.counters.array[pos + j];
      counts[category]++;
      pattern >>= 1;
    }
    if (i >= end) {
      break;
    }
    // We ignore the inter-character space - it could be of any size.
    pos += 8;
  }

  // Calculate our allowable size thresholds using fixed-point math.
  float maxes[4] = {0.0f, 0.0f, 0.0f, 0.0f};
  float mins[4] = {0.0f, 0.0f, 0.0f, 0.0f};
  // Define the threshold of acceptability to be the midpoint between the
  // average small stripe and the average large stripe. No stripe lengths
  // should be on the "wrong" side of that line.
  for (int i = 0; i < 2; i++) {
    mins[i] = 0.0f;  // Accept arbitrarily small "short" stripes.
    mins[i + 2] = ((float) sizes[i] / counts[i] + (float) sizes[i + 2] / counts[i + 2]) / 2.0f;
    maxes[i] = mins[i + 2];
    maxes[i + 2] = (sizes[i + 2] * ZX_CODA_MAX_ACCEPTABLE + ZX_CODA_PADDING) / counts[i + 2];
  }

  // Now verify that all of the stripes are within the thresholds.
  pos = start;
  for (int i = 0; true; i++) {
    int pattern = ZX_CODA_CHARACTER_ENCODINGS[[self.decodeRowResult characterAtIndex:i]];
    for (int j = 6; j >= 0; j--) {
      // Even j = bars, while odd j = spaces. Categories 2 and 3 are for
      // long stripes, while 0 and 1 are for short stripes.
      int category = (j & 1) + (pattern & 1) * 2;
      int size = self.counters.array[pos + j];
      if (size < mins[category] || size > maxes[category]) {
        return NO;
      }
      pattern >>= 1;
    }
    if (i >= end) {
      break;
    }
    pos += 8;
  }

  return YES;
}

/**
 * Records the size of all runs of white and black pixels, starting with white.
 * This is just like recordPattern, except it records all the counters, and
 * uses our builtin "counters" member for storage.
 */
- (BOOL)setCountersWithRow:(ZXBitArray *)row {
  self.counterLength = 0;
  // Start from the first white bit.
  int i = [row nextUnset:0];
  int end = row.size;
  if (i >= end) {
    return NO;
  }
  BOOL isWhite = YES;
  int count = 0;
  while (i < end) {
    if ([row get:i] ^ isWhite) { // that is, exactly one is true
      count++;
    } else {
      [self counterAppend:count];
      count = 1;
      isWhite = !isWhite;
    }
    i++;
  }
  [self counterAppend:count];
  return YES;
}

- (void)counterAppend:(int)e {
  self.counters.array[self.counterLength] = e;
  self.counterLength++;
  if (self.counterLength >= self.counters.length) {
    ZXIntArray *temp = [[ZXIntArray alloc] initWithLength:self.counterLength * 2];
    memcpy(temp.array, self.counters.array, self.counters.length * sizeof(int32_t));
    self.counters = temp;
  }
}

- (int)findStartPattern {
  for (int i = 1; i < self.counterLength; i += 2) {
    int charOffset = [self toNarrowWidePattern:i];
    if (charOffset != -1 && [[self class] arrayContains:ZX_CODA_STARTEND_ENCODING
                                                 length:sizeof(ZX_CODA_STARTEND_ENCODING) / sizeof(unichar)
                                                    key:ZX_CODA_ALPHABET[charOffset]]) {
      // Look for whitespace before start pattern, >= 50% of width of start pattern
      // We make an exception if the whitespace is the first element.
      int patternSize = 0;
      for (int j = i; j < i + 7; j++) {
        patternSize += self.counters.array[j];
      }
      if (i == 1 || self.counters.array[i-1] >= patternSize / 2) {
        return i;
      }
    }
  }

  return -1;
}

+ (BOOL)arrayContains:(const unichar *)array length:(unsigned int)length key:(unichar)key {
  if (array != nil) {
    for (int i = 0; i < length; i++) {
      if (array[i] == key) {
        return YES;
      }
    }
  }
  return NO;
}

// Assumes that counters[position] is a bar.
- (int)toNarrowWidePattern:(int)position {
  int32_t *array = self.counters.array;
  int end = position + 7;
  if (end >= self.counterLength) {
    return -1;
  }

  int maxBar = 0;
  int minBar = INT_MAX;
  for (int j = position; j < end; j += 2) {
    int currentCounter = array[j];
    if (currentCounter < minBar) {
      minBar = currentCounter;
    }
    if (currentCounter > maxBar) {
      maxBar = currentCounter;
    }
  }
  int thresholdBar = (minBar + maxBar) / 2;

  int maxSpace = 0;
  int minSpace = INT_MAX;
  for (int j = position + 1; j < end; j += 2) {
    int currentCounter = array[j];
    if (currentCounter < minSpace) {
      minSpace = currentCounter;
    }
    if (currentCounter > maxSpace) {
      maxSpace = currentCounter;
    }
  }
  int thresholdSpace = (minSpace + maxSpace) / 2;

  int bitmask = 1 << 7;
  int pattern = 0;
  for (int i = 0; i < 7; i++) {
    int threshold = (i & 1) == 0 ? thresholdBar : thresholdSpace;
    bitmask >>= 1;
    if (array[position + i] > threshold) {
      pattern |= bitmask;
    }
  }

  for (int i = 0; i < sizeof(ZX_CODA_CHARACTER_ENCODINGS) / sizeof(int); i++) {
    if (ZX_CODA_CHARACTER_ENCODINGS[i] == pattern) {
      return i;
    }
  }
  return -1;
}

@end
