/*
 * Copyright 2013 ZXing authors
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

#import "ZXDataMatrixASCIIEncoder.h"
#import "ZXDataMatrixBase256Encoder.h"
#import "ZXDataMatrixC40Encoder.h"
#import "ZXDataMatrixEdifactEncoder.h"
#import "ZXDataMatrixEncoderContext.h"
#import "ZXDataMatrixHighLevelEncoder.h"
#import "ZXDataMatrixSymbolInfo.h"
#import "ZXDataMatrixTextEncoder.h"
#import "ZXDataMatrixX12Encoder.h"

/**
 * Padding character
 */
const unichar PAD_CHAR = 129;

/**
 * 05 Macro header
 */
static NSString *MACRO_05_HEADER = nil;

/**
 * 06 Macro header
 */
static NSString *MACRO_06_HEADER = nil;

/**
 * Macro trailer
 */
static NSString *MACRO_TRAILER = nil;

@implementation ZXDataMatrixHighLevelEncoder

+ (void)initialize {
  if ([self class] != [ZXDataMatrixHighLevelEncoder class]) return;

  MACRO_05_HEADER = [[NSString alloc] initWithFormat:@"[)>%C05%C", (unichar)0x001E, (unichar)0x001D];
  MACRO_06_HEADER = [[NSString alloc] initWithFormat:@"[)>%C06%C", (unichar)0x001E, (unichar)0x001D];
  MACRO_TRAILER = [[NSString alloc] initWithFormat:@"%C%C", (unichar)0x001E, (unichar)0x0004];
}

+ (unichar)latchToC40 {
  return 230;
}

+ (unichar)latchToBase256 {
  return 231;
}

+ (unichar)upperShift {
  return 235;
}

+ (unichar)macro05 {
  return 236;
}

+ (unichar)macro06 {
  return 237;
}

+ (unichar)latchToAnsiX12 {
  return 238;
}

+ (unichar)latchToText {
  return 239;
}

+ (unichar)latchToEdifact {
  return 240;
}

+ (unichar)c40Unlatch {
  return 254;
}

+ (unichar)x12Unlatch {
  return 254;
}

+ (int)asciiEncodation {
  return 0;
}

+ (int)c40Encodation {
  return 1;
}

+ (int)textEncodation {
  return 2;
}

+ (int)x12Encodation {
  return 3;
}

+ (int)edifactEncodation {
  return 4;
}

+ (int)base256Encodation {
  return 5;
}

/*
+ (int8_t *)bytesForMessage:(NSString *)msg {
  return (int8_t *)[[msg dataUsingEncoding:(NSStringEncoding) 0x80000400] bytes]; //See 4.4.3 and annex B of ISO/IEC 15438:2001(E)
}
*/

+ (unichar)randomize253State:(unichar)ch codewordPosition:(int)codewordPosition {
  int pseudoRandom = ((149 * codewordPosition) % 253) + 1;
  int tempVariable = ch + pseudoRandom;
  return tempVariable <= 254 ? (unichar) tempVariable : (unichar) (tempVariable - 254);
}

+ (NSString *)encodeHighLevel:(NSString *)msg {
  return [self encodeHighLevel:msg shape:ZXDataMatrixSymbolShapeHintForceNone minSize:nil maxSize:nil];
}

+ (NSString *)encodeHighLevel:(NSString *)msg shape:(ZXDataMatrixSymbolShapeHint)shape
                      minSize:(ZXDimension *)minSize maxSize:(ZXDimension *)maxSize {
  //the codewords 0..255 are encoded as Unicode characters
  NSArray *encoders = @[[[ZXDataMatrixASCIIEncoder alloc] init],
                        [[ZXDataMatrixC40Encoder alloc] init],
                        [[ZXDataMatrixTextEncoder alloc] init],
                        [[ZXDataMatrixX12Encoder alloc] init],
                        [[ZXDataMatrixEdifactEncoder alloc] init],
                        [[ZXDataMatrixBase256Encoder alloc] init]];

  ZXDataMatrixEncoderContext *context = [[ZXDataMatrixEncoderContext alloc] initWithMessage:msg];
  context.symbolShape = shape;
  [context setSizeConstraints:minSize maxSize:maxSize];

  if ([msg hasPrefix:MACRO_05_HEADER] && [msg hasSuffix:MACRO_TRAILER]) {
    [context writeCodeword:[self macro05]];
    [context setSkipAtEnd:2];
    context.pos += (int)MACRO_05_HEADER.length;
  } else if ([msg hasPrefix:MACRO_06_HEADER] && [msg hasSuffix:MACRO_TRAILER]) {
    [context writeCodeword:[self macro06]];
    [context setSkipAtEnd:2];
    context.pos += (int)MACRO_06_HEADER.length;
  }

  int encodingMode = [self asciiEncodation]; //Default mode
  while ([context hasMoreCharacters]) {
    [encoders[encodingMode] encode:context];
    if (context.newEncoding >= 0) {
      encodingMode = context.newEncoding;
      [context resetEncoderSignal];
    }
  }
  NSUInteger len = context.codewords.length;
  [context updateSymbolInfo];
  int capacity = context.symbolInfo.dataCapacity;
  if (len < capacity) {
    if (encodingMode != [self asciiEncodation] && encodingMode != [self base256Encodation] && encodingMode != [self edifactEncodation]) {
      [context writeCodeword:(unichar)0x00fe]; //Unlatch (254)
    }
  }
  //Padding
  NSMutableString *codewords = context.codewords;
  if (codewords.length < capacity) {
    [codewords appendFormat:@"%C", PAD_CHAR];
  }
  while (codewords.length < capacity) {
    [codewords appendFormat:@"%C", [self randomize253State:PAD_CHAR codewordPosition:(int)codewords.length + 1]];
  }

  return [NSString stringWithString:context.codewords];
}

+ (int)lookAheadTest:(NSString *)msg startpos:(int)startpos currentMode:(int)currentMode {
  if (startpos >= msg.length) {
    return currentMode;
  }
  float charCounts[6];
  //step J
  if (currentMode == [self asciiEncodation]) {
    charCounts[0] = 0;
    charCounts[1] = 1;
    charCounts[2] = 1;
    charCounts[3] = 1;
    charCounts[4] = 1;
    charCounts[5] = 1.25f;
  } else {
    charCounts[0] = 1;
    charCounts[1] = 2;
    charCounts[2] = 2;
    charCounts[3] = 2;
    charCounts[4] = 2;
    charCounts[5] = 2.25f;
    charCounts[currentMode] = 0;
  }

  int charsProcessed = 0;
  while (YES) {
    //step K
    if ((startpos + charsProcessed) == msg.length) {
      int min = INT_MAX;
      int8_t mins[6];
      int intCharCounts[6];
      min = [self findMinimums:charCounts intCharCounts:intCharCounts min:min mins:mins];
      int minCount = [self minimumCount:mins];

      if (intCharCounts[[self asciiEncodation]] == min) {
        return [self asciiEncodation];
      }
      if (minCount == 1 && mins[[self base256Encodation]] > 0) {
        return [self base256Encodation];
      }
      if (minCount == 1 && mins[[self edifactEncodation]] > 0) {
        return [self edifactEncodation];
      }
      if (minCount == 1 && mins[[self textEncodation]] > 0) {
        return [self textEncodation];
      }
      if (minCount == 1 && mins[[self x12Encodation]] > 0) {
        return [self x12Encodation];
      }
      return [self c40Encodation];
    }

    unichar c = [msg characterAtIndex:startpos + charsProcessed];
    charsProcessed++;

    //step L
    if ([self isDigit:c]) {
      charCounts[[self asciiEncodation]] += 0.5;
    } else if ([self isExtendedASCII:c]) {
      charCounts[[self asciiEncodation]] = (int) ceil(charCounts[[self asciiEncodation]]);
      charCounts[[self asciiEncodation]] += 2;
    } else {
      charCounts[[self asciiEncodation]] = (int) ceil(charCounts[[self asciiEncodation]]);
      charCounts[[self asciiEncodation]]++;
    }

    //step M
    if ([self isNativeC40:c]) {
      charCounts[[self c40Encodation]] += 2.0f / 3.0f;
    } else if ([self isExtendedASCII:c]) {
      charCounts[[self c40Encodation]] += 8.0f / 3.0f;
    } else {
      charCounts[[self c40Encodation]] += 4.0f / 3.0f;
    }

    //step N
    if ([self isNativeText:c]) {
      charCounts[[self textEncodation]] += 2.0f / 3.0f;
    } else if ([self isExtendedASCII:c]) {
      charCounts[[self textEncodation]] += 8.0f / 3.0f;
    } else {
      charCounts[[self textEncodation]] += 4.0f / 3.0f;
    }

    //step O
    if ([self isNativeX12:c]) {
      charCounts[[self x12Encodation]] += 2.0f / 3.0f;
    } else if ([self isExtendedASCII:c]) {
      charCounts[[self x12Encodation]] += 13.0f / 3.0f;
    } else {
      charCounts[[self x12Encodation]] += 10.0f / 3.0f;
    }

    //step P
    if ([self isNativeEDIFACT:c]) {
      charCounts[[self edifactEncodation]] += 3.0f / 4.0f;
    } else if ([self isExtendedASCII:c]) {
      charCounts[[self edifactEncodation]] += 17.0f / 4.0f;
    } else {
      charCounts[[self edifactEncodation]] += 13.0f / 4.0f;
    }

    // step Q
    if ([self isSpecialB256:c]) {
      charCounts[[self base256Encodation]] += 4;
    } else {
      charCounts[[self base256Encodation]]++;
    }

    //step R
    if (charsProcessed >= 4) {
      int intCharCounts[6];
      int8_t mins[6];
      [self findMinimums:charCounts intCharCounts:intCharCounts min:INT_MAX mins:mins];
      int minCount = [self minimumCount:mins];

      if (intCharCounts[[self asciiEncodation]] < intCharCounts[[self base256Encodation]]
          && intCharCounts[[self asciiEncodation]] < intCharCounts[[self c40Encodation]]
          && intCharCounts[[self asciiEncodation]] < intCharCounts[[self textEncodation]]
          && intCharCounts[[self asciiEncodation]] < intCharCounts[[self x12Encodation]]
          && intCharCounts[[self asciiEncodation]] < intCharCounts[[self edifactEncodation]]) {
        return [self asciiEncodation];
      }
      if (intCharCounts[[self base256Encodation]] < intCharCounts[[self asciiEncodation]]
          || (mins[[self c40Encodation]] + mins[[self textEncodation]] + mins[[self x12Encodation]] + mins[[self edifactEncodation]]) == 0) {
        return [self base256Encodation];
      }
      if (minCount == 1 && mins[[self edifactEncodation]] > 0) {
        return [self edifactEncodation];
      }
      if (minCount == 1 && mins[[self textEncodation]] > 0) {
        return [self textEncodation];
      }
      if (minCount == 1 && mins[[self x12Encodation]] > 0) {
        return [self x12Encodation];
      }
      if (intCharCounts[[self c40Encodation]] + 1 < intCharCounts[[self asciiEncodation]]
          && intCharCounts[[self c40Encodation]] + 1 < intCharCounts[[self base256Encodation]]
          && intCharCounts[[self c40Encodation]] + 1 < intCharCounts[[self edifactEncodation]]
          && intCharCounts[[self c40Encodation]] + 1 < intCharCounts[[self textEncodation]]) {
        if (intCharCounts[[self c40Encodation]] < intCharCounts[[self x12Encodation]]) {
          return [self c40Encodation];
        }
        if (intCharCounts[[self c40Encodation]] == intCharCounts[[self x12Encodation]]) {
          int p = startpos + charsProcessed + 1;
          while (p < msg.length) {
            char tc = [msg characterAtIndex:p];
            if ([self isX12TermSep:tc]) {
              return [self x12Encodation];
            }
            if (![self isNativeX12:tc]) {
              break;
            }
            p++;
          }
          return [self c40Encodation];
        }
      }
    }
  }
}

+ (int)findMinimums:(float *)charCounts intCharCounts:(int *)intCharCounts min:(int)min mins:(int8_t *)mins {
  memset(mins, 0, 6);
  for (int i = 0; i < 6; i++) {
    intCharCounts[i] = (int) ceil(charCounts[i]);
    int current = intCharCounts[i];
    if (min > current) {
      min = current;
      memset(mins, 0, 6);
    }
    if (min == current) {
      mins[i]++;
    }
  }
  return min;
}

+ (int)minimumCount:(int8_t *)mins {
  int minCount = 0;
  for (int i = 0; i < 6; i++) {
    minCount += mins[i];
  }
  return minCount;
}

+ (BOOL)isDigit:(unichar)ch {
  return ch >= '0' && ch <= '9';
}

+ (BOOL)isExtendedASCII:(unichar)ch {
  return ch >= 128 && ch <= 255;
}

+ (BOOL)isNativeC40:(unichar)ch {
  return (ch == ' ') || (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z');
}

+ (BOOL)isNativeText:(unichar)ch {
  return (ch == ' ') || (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'z');
}

+ (BOOL)isNativeX12:(unichar)ch {
  return [self isX12TermSep:ch] || (ch == ' ') || (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z');
}

+ (BOOL)isX12TermSep:(unichar)ch {
  return (ch == '\r') //CR
    || (ch == '*')
    || (ch == '>');
}

+ (BOOL)isNativeEDIFACT:(unichar)ch {
  return ch >= ' ' && ch <= '^';
}

+ (BOOL)isSpecialB256:(unichar)ch {
  return NO; //TODO NOT IMPLEMENTED YET!!!
}

+ (int)determineConsecutiveDigitCount:(NSString *)msg startpos:(int)startpos {
  int count = 0;
  NSUInteger len = msg.length;
  int idx = startpos;
  if (idx < len) {
    unichar ch = [msg characterAtIndex:idx];
    while ([self isDigit:ch] && idx < len) {
      count++;
      idx++;
      if (idx < len) {
        ch = [msg characterAtIndex:idx];
      }
    }
  }
  return count;
}

+ (void)illegalCharacter:(unichar)c {
  NSString *hex = [NSString stringWithFormat:@"%x", c];
  hex = [[@"0000" substringWithRange:NSMakeRange(0, hex.length)] stringByAppendingString:hex];
  [NSException raise:NSInvalidArgumentException format:@"Illegal character: %C (0x%@)", c, hex];
}

@end
