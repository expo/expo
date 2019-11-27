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
#import "ZXCode39Reader.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXResult.h"
#import "ZXResultPoint.h"

unichar ZX_CODE39_ALPHABET[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D',
  'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
  'X', 'Y', 'Z', '-', '.', ' ', '$', '/', '+', '%'};
NSString *ZX_CODE39_ALPHABET_STRING = nil;


/**
 * These represent the encodings of characters, as patterns of wide and narrow bars.
 * The 9 least-significant bits of each int correspond to the pattern of wide and narrow,
 * with 1s representing "wide" and 0s representing narrow.
 */
const int ZX_CODE39_CHARACTER_ENCODINGS[] = {
  0x034, 0x121, 0x061, 0x160, 0x031, 0x130, 0x070, 0x025, 0x124, 0x064, // 0-9
  0x109, 0x049, 0x148, 0x019, 0x118, 0x058, 0x00D, 0x10C, 0x04C, 0x01C, // A-J
  0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106, 0x046, 0x016, // K-T
  0x181, 0x0C1, 0x1C0, 0x091, 0x190, 0x0D0, 0x085, 0x184, 0x0C4, 0x0A8, // U-$
  0x0A2, 0x08A, 0x02A // /-%
};

const int ZX_CODE39_ASTERISK_ENCODING = 0x094;

@interface ZXCode39Reader ()

@property (nonatomic, assign, readonly) BOOL extendedMode;
@property (nonatomic, assign, readonly) BOOL usingCheckDigit;
@property (nonatomic, strong, readonly) ZXIntArray *counters;

@end

@implementation ZXCode39Reader

+ (void)load {
  ZX_CODE39_ALPHABET_STRING = [[NSString alloc] initWithCharacters:ZX_CODE39_ALPHABET
                                                            length:sizeof(ZX_CODE39_ALPHABET) / sizeof(unichar)];
}

- (id)init {
  return [self initUsingCheckDigit:NO extendedMode:NO];
}

- (id)initUsingCheckDigit:(BOOL)isUsingCheckDigit {
  return [self initUsingCheckDigit:isUsingCheckDigit extendedMode:NO];
}

- (id)initUsingCheckDigit:(BOOL)usingCheckDigit extendedMode:(BOOL)extendedMode {
  if (self = [super init]) {
    _usingCheckDigit = usingCheckDigit;
    _extendedMode = extendedMode;
    _counters = [[ZXIntArray alloc] initWithLength:9];
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXIntArray *theCounters = self.counters;
  [theCounters clear];
  NSMutableString *result = [NSMutableString stringWithCapacity:20];

  ZXIntArray *start = [self findAsteriskPattern:row counters:theCounters];
  if (!start) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  // Read off white space
  int nextStart = [row nextSet:start.array[1]];
  int end = [row size];

  unichar decodedChar;
  int lastStart;
  do {
    if (![ZXOneDReader recordPattern:row start:nextStart counters:theCounters]) {
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
    }
    int pattern = [self toNarrowWidePattern:theCounters];
    if (pattern < 0) {
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
    }
    decodedChar = [self patternToChar:pattern];
    if (decodedChar == 0) {
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
    }
    [result appendFormat:@"%C", decodedChar];
    lastStart = nextStart;
    for (int i = 0; i < theCounters.length; i++) {
      nextStart += theCounters.array[i];
    }
    // Read off white space
    nextStart = [row nextSet:nextStart];
  } while (decodedChar != '*');
  [result deleteCharactersInRange:NSMakeRange([result length] - 1, 1)]; // remove asterisk

  // Look for whitespace after pattern:
  int lastPatternSize = 0;
  for (int i = 0; i < theCounters.length; i++) {
    lastPatternSize += theCounters.array[i];
  }
  int whiteSpaceAfterEnd = nextStart - lastStart - lastPatternSize;
  // If 50% of last pattern size, following last pattern, is not whitespace, fail
  // (but if it's whitespace to the very end of the image, that's OK)
  if (nextStart != end && (whiteSpaceAfterEnd << 1) < lastPatternSize) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  if (self.usingCheckDigit) {
    int max = (int)[result length] - 1;
    int total = 0;
    for (int i = 0; i < max; i++) {
      total += [ZX_CODE39_ALPHABET_STRING rangeOfString:[result substringWithRange:NSMakeRange(i, 1)]].location;
    }
    if ([result characterAtIndex:max] != ZX_CODE39_ALPHABET[total % 43]) {
      if (error) *error = ZXChecksumErrorInstance();
      return nil;
    }
    [result deleteCharactersInRange:NSMakeRange(max, 1)];
  }

  if ([result length] == 0) {
    // false positive
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  NSString *resultString;
  if (self.extendedMode) {
    resultString = [self decodeExtended:result];
    if (!resultString) {
      if (error) *error = ZXFormatErrorInstance();
      return nil;
    }
  } else {
    resultString = result;
  }

  float left = (float) (start.array[1] + start.array[0]) / 2.0f;
  float right = (lastStart + lastPatternSize) / 2.0f;

  return [ZXResult resultWithText:resultString
                         rawBytes:nil
                     resultPoints:@[[[ZXResultPoint alloc] initWithX:left y:(float)rowNumber],
                                    [[ZXResultPoint alloc] initWithX:right y:(float)rowNumber]]
                           format:kBarcodeFormatCode39];
}

- (ZXIntArray *)findAsteriskPattern:(ZXBitArray *)row counters:(ZXIntArray *)counters {
  int width = row.size;
  int rowOffset = [row nextSet:0];

  int counterPosition = 0;
  int patternStart = rowOffset;
  BOOL isWhite = NO;
  int patternLength = counters.length;
  int32_t *array = counters.array;

  for (int i = rowOffset; i < width; i++) {
    if ([row get:i] ^ isWhite) {
      array[counterPosition]++;
    } else {
      if (counterPosition == patternLength - 1) {
        // Look for whitespace before start pattern, >= 50% of width of start pattern
        if ([self toNarrowWidePattern:counters] == ZX_CODE39_ASTERISK_ENCODING &&
            [row isRange:MAX(0, patternStart - ((i - patternStart) / 2)) end:patternStart value:NO]) {
          return [[ZXIntArray alloc] initWithInts:patternLength, i, -1];
        }
        patternStart += array[0] + array[1];
        for (int y = 2; y < counters.length; y++) {
          array[y - 2] = array[y];
        }
        array[patternLength - 2] = 0;
        array[patternLength - 1] = 0;
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

// For efficiency, returns -1 on failure. Not throwing here saved as many as 700 exceptions
// per image when using some of our blackbox images.
- (int)toNarrowWidePattern:(ZXIntArray *)counters {
  int numCounters = counters.length;
  int maxNarrowCounter = 0;
  int wideCounters;
  do {
    int minCounter = INT_MAX;
    int32_t *array = counters.array;
    for (int i = 0; i < numCounters; i++) {
      int counter = array[i];
      if (counter < minCounter && counter > maxNarrowCounter) {
        minCounter = counter;
      }
    }
    maxNarrowCounter = minCounter;
    wideCounters = 0;
    int totalWideCountersWidth = 0;
    int pattern = 0;
    for (int i = 0; i < numCounters; i++) {
      int counter = array[i];
      if (array[i] > maxNarrowCounter) {
        pattern |= 1 << (numCounters - 1 - i);
        wideCounters++;
        totalWideCountersWidth += counter;
      }
    }
    if (wideCounters == 3) {
      // Found 3 wide counters, but are they close enough in width?
      // We can perform a cheap, conservative check to see if any individual
      // counter is more than 1.5 times the average:
      for (int i = 0; i < numCounters && wideCounters > 0; i++) {
        int counter = array[i];
        if (array[i] > maxNarrowCounter) {
          wideCounters--;
          // totalWideCountersWidth = 3 * average, so this checks if counter >= 3/2 * average
          if ((counter * 2) >= totalWideCountersWidth) {
            return -1;
          }
        }
      }
      return pattern;
    }
  } while (wideCounters > 3);
  return -1;
}

- (unichar)patternToChar:(int)pattern {
  for (int i = 0; i < sizeof(ZX_CODE39_CHARACTER_ENCODINGS) / sizeof(int); i++) {
    if (ZX_CODE39_CHARACTER_ENCODINGS[i] == pattern) {
      return ZX_CODE39_ALPHABET[i];
    }
  }
  if (pattern == ZX_CODE39_ASTERISK_ENCODING) {
    return '*';
  }
  return 0;
}

- (NSString *)decodeExtended:(NSMutableString *)encoded {
  NSUInteger length = [encoded length];
  NSMutableString *decoded = [NSMutableString stringWithCapacity:length];

  for (int i = 0; i < length; i++) {
    unichar c = [encoded characterAtIndex:i];
    if (c == '+' || c == '$' || c == '%' || c == '/') {
      unichar next = [encoded characterAtIndex:i + 1];
      unichar decodedChar = '\0';

      switch (c) {
        case '+':
          // +A to +Z map to a to z
          if (next >= 'A' && next <= 'Z') {
            decodedChar = (unichar)(next + 32);
          } else {
            return nil;
          }
          break;
        case '$':
          // $A to $Z map to control codes SH to SB
          if (next >= 'A' && next <= 'Z') {
            decodedChar = (unichar)(next - 64);
          } else {
            return nil;
          }
          break;
        case '%':
          // %A to %E map to control codes ESC to US
          if (next >= 'A' && next <= 'E') {
            decodedChar = (unichar)(next - 38);
          } else if (next >= 'F' && next <= 'J') {
            decodedChar = (unichar)(next - 11);
          } else if (next >= 'K' && next <= 'O') {
            decodedChar = (unichar) (next + 16);
          } else if (next >= 'P' && next <= 'T') {
            decodedChar = (unichar) (next + 43);
          } else if (next == 'U') {
            decodedChar = (unichar) 0;
          } else if (next == 'V') {
            decodedChar = '@';
          } else if (next == 'W') {
            decodedChar = '`';
          } else if (next == 'X' || next == 'Y' || next == 'Z') {
            decodedChar = (unichar) 127;

          } else {
            return nil;
          }
          break;
        case '/':
          // /A to /O map to ! to , and /Z maps to :
          if (next >= 'A' && next <= 'O') {
            decodedChar = (unichar)(next - 32);
          } else if (next == 'Z') {
            decodedChar = ':';
          } else {
            return nil;
          }
          break;
      }
      [decoded appendFormat:@"%C", decodedChar];
      // bump up i again since we read two characters
      i++;
    } else {
      [decoded appendFormat:@"%C", c];
    }
  }

  return decoded;
}

@end
