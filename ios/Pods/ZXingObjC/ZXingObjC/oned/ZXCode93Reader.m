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
#import "ZXCode93Reader.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXResult.h"
#import "ZXResultPoint.h"

const NSString *ZX_CODE93_ALPHABET_STRING = @"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*";
const unichar ZX_CODE93_ALPHABET[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D',
  'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
  'X', 'Y', 'Z', '-', '.', ' ', '$', '/', '+', '%', 'a', 'b', 'c', 'd', '*'};

/**
 * These represent the encodings of characters, as patterns of wide and narrow bars.
 * The 9 least-significant bits of each int correspond to the pattern of wide and narrow.
 */
const int ZX_CODE93_CHARACTER_ENCODINGS[] = {
  0x114, 0x148, 0x144, 0x142, 0x128, 0x124, 0x122, 0x150, 0x112, 0x10A, // 0-9
  0x1A8, 0x1A4, 0x1A2, 0x194, 0x192, 0x18A, 0x168, 0x164, 0x162, 0x134, // A-J
  0x11A, 0x158, 0x14C, 0x146, 0x12C, 0x116, 0x1B4, 0x1B2, 0x1AC, 0x1A6, // K-T
  0x196, 0x19A, 0x16C, 0x166, 0x136, 0x13A, // U-Z
  0x12E, 0x1D4, 0x1D2, 0x1CA, 0x16E, 0x176, 0x1AE, // - - %
  0x126, 0x1DA, 0x1D6, 0x132, 0x15E, // Control chars? $-*
};

const int ZX_CODE93_ASTERISK_ENCODING = 0x15E;

@interface ZXCode93Reader ()

@property (nonatomic, strong, readonly) ZXIntArray *counters;

@end

@implementation ZXCode93Reader

- (id)init {
  if (self = [super init]) {
    _counters = [[ZXIntArray alloc] initWithLength:6];
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  ZXIntArray *start = [self findAsteriskPattern:row];
  if (!start) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  // Read off white space
  int nextStart = [row nextSet:start.array[1]];
  int end = row.size;

  ZXIntArray *theCounters = self.counters;
  memset(theCounters.array, 0, theCounters.length * sizeof(int32_t));
  NSMutableString *result = [NSMutableString string];

  unichar decodedChar;
  int lastStart;
  do {
    if (![ZXOneDReader recordPattern:row start:nextStart counters:theCounters]) {
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
    }
    int pattern = [self toPattern:theCounters];
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

  int lastPatternSize = [theCounters sum];

  // Should be at least one more black module
  if (nextStart == end || ![row get:nextStart]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  if ([result length] < 2) {
    // false positive -- need at least 2 checksum digits
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  if (![self checkChecksums:result error:error]) {
    return nil;
  }
  [result deleteCharactersInRange:NSMakeRange([result length] - 2, 2)];

  NSString *resultString = [self decodeExtended:result];
  if (!resultString) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }

  float left = (float) (start.array[1] + start.array[0]) / 2.0f;
  float right = lastStart + lastPatternSize / 2.0f;
  return [ZXResult resultWithText:resultString
                         rawBytes:nil
                     resultPoints:@[[[ZXResultPoint alloc] initWithX:left y:(float)rowNumber],
                                    [[ZXResultPoint alloc] initWithX:right y:(float)rowNumber]]
                           format:kBarcodeFormatCode93];
}

- (ZXIntArray *)findAsteriskPattern:(ZXBitArray *)row {
  int width = row.size;
  int rowOffset = [row nextSet:0];

  [self.counters clear];
  ZXIntArray *theCounters = self.counters;
  int patternStart = rowOffset;
  BOOL isWhite = NO;
  int patternLength = theCounters.length;

  int counterPosition = 0;
  for (int i = rowOffset; i < width; i++) {
    if ([row get:i] ^ isWhite) {
      theCounters.array[counterPosition]++;
    } else {
      if (counterPosition == patternLength - 1) {
        if ([self toPattern:theCounters] == ZX_CODE93_ASTERISK_ENCODING) {
          return [[ZXIntArray alloc] initWithInts:patternStart, i, -1];
        }
        patternStart += theCounters.array[0] + theCounters.array[1];
        for (int y = 2; y < patternLength; y++) {
          theCounters.array[y - 2] = theCounters.array[y];
        }
        theCounters.array[patternLength - 2] = 0;
        theCounters.array[patternLength - 1] = 0;
        counterPosition--;
      } else {
        counterPosition++;
      }
      theCounters.array[counterPosition] = 1;
      isWhite = !isWhite;
    }
  }

  return nil;
}

- (int)toPattern:(ZXIntArray *)counters {
  int max = counters.length;
  int sum = [counters sum];
  int32_t *array = counters.array;
  int pattern = 0;
  for (int i = 0; i < max; i++) {
    int scaled = round(array[i] * 9.0f / sum);
    if (scaled < 1 || scaled > 4) {
      return -1;
    }
    if ((i & 0x01) == 0) {
      for (int j = 0; j < scaled; j++) {
        pattern = (pattern << 1) | 0x01;
      }
    } else {
      pattern <<= scaled;
    }
  }
  return pattern;
}

- (unichar)patternToChar:(int)pattern {
  for (int i = 0; i < sizeof(ZX_CODE93_CHARACTER_ENCODINGS) / sizeof(int); i++) {
    if (ZX_CODE93_CHARACTER_ENCODINGS[i] == pattern) {
      return ZX_CODE93_ALPHABET[i];
    }
  }

  return -1;
}

- (NSString *)decodeExtended:(NSMutableString *)encoded {
  NSUInteger length = [encoded length];
  NSMutableString *decoded = [NSMutableString stringWithCapacity:length];
  for (int i = 0; i < length; i++) {
    unichar c = [encoded characterAtIndex:i];
    if (c >= 'a' && c <= 'd') {
      if (i >= length - 1) {
        return nil;
      }
      unichar next = [encoded characterAtIndex:i + 1];
      unichar decodedChar = '\0';
      switch (c) {
      case 'd':
        if (next >= 'A' && next <= 'Z') {
          decodedChar = (unichar)(next + 32);
        } else {
          return nil;
        }
        break;
      case 'a':
        if (next >= 'A' && next <= 'Z') {
          decodedChar = (unichar)(next - 64);
        } else {
          return nil;
        }
        break;
      case 'b':
        if (next >= 'A' && next <= 'E') {
          // %A to %E map to control codes ESC to USep
          decodedChar = (unichar)(next - 38);
        } else if (next >= 'F' && next <= 'J') {
          // %F to %J map to ; < = > ?
          decodedChar = (unichar)(next - 11);
        } else if (next >= 'K' && next <= 'O') {
          // %K to %O map to [ \ ] ^ _
          decodedChar = (unichar) (next + 16);
        } else if (next >= 'P' && next <= 'T') {
            // %P to %T map to { | } ~ DEL
          decodedChar = (unichar) (next + 43);
        } else if (next == 'U') {
            // %U map to NUL
            decodedChar = '\0';
        } else if (next == 'V') {
            // %V map to @
            decodedChar = '@';
        } else if (next == 'W') {
            // %W map to `
            decodedChar = '`';
        } else if (next >= 'X' && next <= 'Z') {
            // %X to %Z all map to DEL (127)
          decodedChar = 127;
        } else {
          return nil;
        }
        break;
      case 'c':
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
      i++;
    } else {
      [decoded appendFormat:@"%C", c];
    }
  }

  return decoded;
}

- (BOOL)checkChecksums:(NSMutableString *)result error:(NSError **)error {
  NSUInteger length = [result length];
  if (![self checkOneChecksum:result checkPosition:(int)length - 2 weightMax:20 error:error]) {
    return NO;
  }
  return [self checkOneChecksum:result checkPosition:(int)length - 1 weightMax:15 error:error];
}

- (BOOL)checkOneChecksum:(NSMutableString *)result checkPosition:(int)checkPosition weightMax:(int)weightMax error:(NSError **)error {
  int weight = 1;
  int total = 0;

  for (int i = checkPosition - 1; i >= 0; i--) {
    total += weight * [ZX_CODE93_ALPHABET_STRING rangeOfString:[NSString stringWithFormat:@"%C", [result characterAtIndex:i]]].location;
    if (++weight > weightMax) {
      weight = 1;
    }
  }

  if ([result characterAtIndex:checkPosition] != ZX_CODE93_ALPHABET[total % 47]) {
    if (error) *error = ZXChecksumErrorInstance();
    return NO;
  }
  return YES;
}

@end
