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

#import "ZXBoolArray.h"
#import "ZXCode128Reader.h"
#import "ZXCode128Writer.h"

// Dummy characters used to specify control characters in input
const unichar ZX_CODE128_ESCAPE_FNC_1 = L'\u00f1';
const unichar ZX_CODE128_ESCAPE_FNC_2 = L'\u00f2';
const unichar ZX_CODE128_ESCAPE_FNC_3 = L'\u00f3';
const unichar ZX_CODE128_ESCAPE_FNC_4 = L'\u00f4';

// Results of minimal lookahead for Code C
typedef enum {
  ZXCTypeUncodable = 0,
  ZXCTypeOneDigit,
  ZXCTypeTwoDigits,
  ZXCTypeFNC1
} ZXCType;

@implementation ZXCode128Writer

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (format != kBarcodeFormatCode128) {
    [NSException raise:NSInvalidArgumentException format:@"Can only encode CODE_128"];
  }
  return [super encode:contents format:format width:width height:height hints:hints error:error];
}

- (ZXBoolArray *)encode:(NSString *)contents {
  int length = (int)[contents length];
  // Check length
  if (length < 1 || length > 80) {
    [NSException raise:NSInvalidArgumentException format:@"Contents length should be between 1 and 80 characters, but got %d", length];
  }
  // Check content
  for (int i = 0; i < length; i++) {
    unichar c = [contents characterAtIndex:i];
    switch (c) {
      case ZX_CODE128_ESCAPE_FNC_1:
      case ZX_CODE128_ESCAPE_FNC_2:
      case ZX_CODE128_ESCAPE_FNC_3:
      case ZX_CODE128_ESCAPE_FNC_4:
        break;
      default:
        if (c > 127) {
          // support for FNC4 isn't implemented, no full Latin-1 character set available at the moment
          [NSException raise:NSInvalidArgumentException format:@"Bad character in input: %C", c];
        }
    }
  }

  NSMutableArray *patterns = [NSMutableArray array]; // temporary storage for patterns
  int checkSum = 0;
  int checkWeight = 1;
  int codeSet = 0; // selected code (CODE_CODE_B or CODE_CODE_C)
  int position = 0; // position in contents

  while (position < length) {
    //Select code to use
    int newCodeSet = [self chooseCodeFrom:contents position:position oldCode:codeSet];

    //Get the pattern index
    int patternIndex;
    if (newCodeSet == codeSet) {
      // Encode the current character
      // First handle escapes
      switch ([contents characterAtIndex:position]) {
        case ZX_CODE128_ESCAPE_FNC_1:
          patternIndex = ZX_CODE128_CODE_FNC_1;
          break;
        case ZX_CODE128_ESCAPE_FNC_2:
          patternIndex = ZX_CODE128_CODE_FNC_2;
          break;
        case ZX_CODE128_ESCAPE_FNC_3:
          patternIndex = ZX_CODE128_CODE_FNC_3;
          break;
        case ZX_CODE128_ESCAPE_FNC_4:
          if (codeSet == ZX_CODE128_CODE_CODE_A) {
            patternIndex = ZX_CODE128_CODE_FNC_4_A;
          } else {
            patternIndex = ZX_CODE128_CODE_FNC_4_B;
          }
          break;
        default:
          // Then handle normal characters otherwise
          if (codeSet == ZX_CODE128_CODE_CODE_A) {
            patternIndex = [contents characterAtIndex:position] - ' ';
            if (patternIndex < 0) {
              // everything below a space character comes behind the underscore in the code patterns table
              patternIndex += '`';
            }
          } else if (codeSet == ZX_CODE128_CODE_CODE_B) {
            patternIndex = [contents characterAtIndex:position] - ' ';
          } else {
            // CODE_CODE_C
            patternIndex = [[contents substringWithRange:NSMakeRange(position, 2)] intValue];
            position++; // Also incremented below
          }
      }
      position++;
    } else {
      // Should we change the current code?
      // Do we have a code set?
      if (codeSet == 0) {
        // No, we don't have a code set
        if (newCodeSet == ZX_CODE128_CODE_CODE_A) {
          patternIndex = ZX_CODE128_CODE_START_A;
        } else if (newCodeSet == ZX_CODE128_CODE_CODE_B) {
          patternIndex = ZX_CODE128_CODE_START_B;
        } else {
          // CODE_CODE_C
          patternIndex = ZX_CODE128_CODE_START_C;
        }
      } else {
        // Yes, we have a code set
        patternIndex = newCodeSet;
      }
      codeSet = newCodeSet;
    }

    // Get the pattern
    NSMutableArray *pattern = [NSMutableArray array];
    for (int i = 0; i < sizeof(ZX_CODE128_CODE_PATTERNS[patternIndex]) / sizeof(int); i++) {
      [pattern addObject:@(ZX_CODE128_CODE_PATTERNS[patternIndex][i])];
    }
    [patterns addObject:pattern];

    // Compute checksum
    checkSum += patternIndex * checkWeight;
    if (position != 0) {
      checkWeight++;
    }
  }

  // Compute and append checksum
  checkSum %= 103;
  NSMutableArray *pattern = [NSMutableArray array];
  for (int i = 0; i < sizeof(ZX_CODE128_CODE_PATTERNS[checkSum]) / sizeof(int); i++) {
    [pattern addObject:@(ZX_CODE128_CODE_PATTERNS[checkSum][i])];
  }
  [patterns addObject:pattern];

  // Append stop code
  pattern = [NSMutableArray array];
  for (int i = 0; i < sizeof(ZX_CODE128_CODE_PATTERNS[ZX_CODE128_CODE_STOP]) / sizeof(int); i++) {
    [pattern addObject:@(ZX_CODE128_CODE_PATTERNS[ZX_CODE128_CODE_STOP][i])];
  }
  [patterns addObject:pattern];

  // Compute code width
  int codeWidth = 0;
  for (pattern in patterns) {
    for (int i = 0; i < pattern.count; i++) {
      codeWidth += [pattern[i] intValue];
    }
  }

  // Compute result
  ZXBoolArray *result = [[ZXBoolArray alloc] initWithLength:codeWidth];
  int pos = 0;
  for (NSArray *patternArray in patterns) {
    int patternLen = (int)[patternArray count];
    int pattern[patternLen];
    for (int i = 0; i < patternLen; i++) {
      pattern[i] = [patternArray[i] intValue];
    }

    pos += [self appendPattern:result pos:pos pattern:pattern patternLen:patternLen startColor:YES];
  }

  return result;
}

- (ZXCType)findCTypeIn:(NSString *)value start:(int)start {
  int last = (int)[value length];
  if (start >= last) {
    return ZXCTypeUncodable;
  }
  unichar c = [value characterAtIndex:start];
  if (c == ZX_CODE128_ESCAPE_FNC_1) {
    return ZXCTypeFNC1;
  }
  if (c < '0' || c > '9') {
    return ZXCTypeUncodable;
  }
  if (start + 1 >= last) {
    return ZXCTypeOneDigit;
  }
  c = [value characterAtIndex:start + 1];
  if (c < '0' || c > '9') {
    return ZXCTypeOneDigit;
  }
  return ZXCTypeTwoDigits;
}

- (int)chooseCodeFrom:(NSString *)contents position:(int)position oldCode:(int)oldCode {
  ZXCType lookahead = [self findCTypeIn:contents start:position];
  if (lookahead == ZXCTypeOneDigit) {
    if (oldCode == ZX_CODE128_CODE_CODE_A) {
      return ZX_CODE128_CODE_CODE_A;
    }
    return ZX_CODE128_CODE_CODE_B;
  }
  if (lookahead == ZXCTypeUncodable) {
    if (position < contents.length) {
      unichar c = [contents characterAtIndex:position];
      if (c < ' ' || (oldCode == ZX_CODE128_CODE_CODE_A && (c < '`' || (c >= ZX_CODE128_ESCAPE_FNC_1 && c <= ZX_CODE128_ESCAPE_FNC_4)))) {
        // can continue in code A, encodes ASCII 0 to 95 or FNC1 to FNC4
        return ZX_CODE128_CODE_CODE_A;
      }
    }
    return ZX_CODE128_CODE_CODE_B; // no choice
  }
  if (oldCode == ZX_CODE128_CODE_CODE_A && lookahead == ZXCTypeFNC1) {
    return ZX_CODE128_CODE_CODE_A;
  }
  if (oldCode == ZX_CODE128_CODE_CODE_C) { // can continue in code C
    return ZX_CODE128_CODE_CODE_C;
  }
  if (oldCode == ZX_CODE128_CODE_CODE_B) {
    if (lookahead == ZXCTypeFNC1) {
      return ZX_CODE128_CODE_CODE_B; // can continue in code B
    }
    // Seen two consecutive digits, see what follows
    lookahead = [self findCTypeIn:contents start:position + 2];
    if (lookahead == ZXCTypeUncodable || lookahead == ZXCTypeOneDigit) {
      return ZX_CODE128_CODE_CODE_B; // not worth switching now
    }
    if (lookahead == ZXCTypeFNC1) { // two digits, then FNC_1...
      lookahead = [self findCTypeIn:contents start:position + 3];
      if (lookahead == ZXCTypeTwoDigits) { // then two more digits, switch
        return ZX_CODE128_CODE_CODE_C;
      } else {
        return ZX_CODE128_CODE_CODE_B; // otherwise not worth switching
      }
    }
    // At this point, there are at least 4 consecutive digits.
    // Look ahead to choose whether to switch now or on the next round.
    int index = position + 4;
    while ((lookahead = [self findCTypeIn:contents start:index]) == ZXCTypeTwoDigits) {
      index += 2;
    }
    if (lookahead == ZXCTypeOneDigit) { // odd number of digits, switch later
      return ZX_CODE128_CODE_CODE_B;
    }
    return ZX_CODE128_CODE_CODE_C; // even number of digits, switch now
  }
  // Here oldCode == 0, which means we are choosing the initial code
  if (lookahead == ZXCTypeFNC1) { // ignore FNC_1
    lookahead = [self findCTypeIn:contents start:position + 1];
  }
  if (lookahead == ZXCTypeTwoDigits) { // at least two digits, start in code C
    return ZX_CODE128_CODE_CODE_C;
  }
  return ZX_CODE128_CODE_CODE_B;
}

@end
