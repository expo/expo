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
#import "ZXCodaBarReader.h"
#import "ZXCodaBarWriter.h"

const unichar ZX_CODA_START_END_CHARS[] = {'A', 'B', 'C', 'D'};
const unichar ZX_CODA_ALT_START_END_CHARS[] = {'T', 'N', '*', 'E'};
const unichar ZX_CHARS_WHICH_ARE_TEN_LENGTH_EACH_AFTER_DECODED[] = {'/', ':', '+', '.'};
static unichar ZX_CODA_DEFAULT_GUARD;

@implementation ZXCodaBarWriter

+ (void)initialize {
  if ([self class] != [ZXCodaBarWriter class]) return;

  ZX_CODA_DEFAULT_GUARD = ZX_CODA_START_END_CHARS[0];
}

- (ZXBoolArray *)encode:(NSString *)contents {
  if ([contents length] < 2) {
    // Can't have a start/end guard, so tentatively add default guards
    contents = [NSString stringWithFormat:@"%C%@%C", ZX_CODA_DEFAULT_GUARD, contents, ZX_CODA_DEFAULT_GUARD];
  } else {
    // Verify input and calculate decoded length.
    unichar firstChar = [[contents uppercaseString] characterAtIndex:0];
    unichar lastChar = [[contents uppercaseString] characterAtIndex:contents.length - 1];
    BOOL startsNormal = [ZXCodaBarReader arrayContains:ZX_CODA_START_END_CHARS length:sizeof(ZX_CODA_START_END_CHARS) / sizeof(unichar) key:firstChar];
    BOOL endsNormal = [ZXCodaBarReader arrayContains:ZX_CODA_START_END_CHARS length:sizeof(ZX_CODA_START_END_CHARS) / sizeof(unichar) key:lastChar];
    BOOL startsAlt = [ZXCodaBarReader arrayContains:ZX_CODA_ALT_START_END_CHARS length:sizeof(ZX_CODA_ALT_START_END_CHARS) / sizeof(unichar) key:firstChar];
    BOOL endsAlt = [ZXCodaBarReader arrayContains:ZX_CODA_ALT_START_END_CHARS length:sizeof(ZX_CODA_ALT_START_END_CHARS) / sizeof(unichar) key:lastChar];
    if (startsNormal) {
      if (!endsNormal) {
        @throw [NSException exceptionWithName:NSInvalidArgumentException
                                       reason:[NSString stringWithFormat:@"Invalid start/end guards: %@", contents]
                                     userInfo:nil];
      }
      // else already has valid start/end
    } else if (startsAlt) {
      if (!endsAlt) {
        @throw [NSException exceptionWithName:NSInvalidArgumentException
                                       reason:[NSString stringWithFormat:@"Invalid start/end guards: %@", contents]
                                     userInfo:nil];
      }
      // else already has valid start/end
    } else {
      // Doesn't start with a guard
      if (endsNormal || endsAlt) {
        @throw [NSException exceptionWithName:NSInvalidArgumentException
                                       reason:[NSString stringWithFormat:@"Invalid start/end guards: %@", contents]
                                     userInfo:nil];
      }
      // else doesn't end with guard either, so add a default
      contents = [NSString stringWithFormat:@"%C%@%C", ZX_CODA_DEFAULT_GUARD, contents, ZX_CODA_DEFAULT_GUARD];
    }
  }

  // The start character and the end character are decoded to 10 length each.
  int resultLength = 20;
  for (int i = 1; i < contents.length - 1; i++) {
    if (([contents characterAtIndex:i] >= '0' && [contents characterAtIndex:i] <= '9') ||
        [contents characterAtIndex:i] == '-' || [contents characterAtIndex:i] == '$') {
      resultLength += 9;
    } else if ([ZXCodaBarReader arrayContains:ZX_CHARS_WHICH_ARE_TEN_LENGTH_EACH_AFTER_DECODED length:4 key:[contents characterAtIndex:i]]) {
      resultLength += 10;
    } else {
      @throw [NSException exceptionWithName:NSInvalidArgumentException
                                     reason:[NSString stringWithFormat:@"Cannot encode : '%C'", [contents characterAtIndex:i]]
                                   userInfo:nil];
    }
  }
  // A blank is placed between each character.
  resultLength += contents.length - 1;

  ZXBoolArray *result = [[ZXBoolArray alloc] initWithLength:resultLength];
  int position = 0;
  for (int index = 0; index < contents.length; index++) {
    unichar c = [[contents uppercaseString] characterAtIndex:index];
    if (index == 0 || index == contents.length - 1) {
      // The start/end chars are not in the CodaBarReader.ALPHABET.
      switch (c) {
        case 'T':
          c = 'A';
          break;
        case 'N':
          c = 'B';
          break;
        case '*':
          c = 'C';
          break;
        case 'E':
          c = 'D';
          break;
      }
    }
    int code = 0;
    for (int i = 0; i < ZX_CODA_ALPHABET_LEN; i++) {
      // Found any, because I checked above.
      if (c == ZX_CODA_ALPHABET[i]) {
        code = ZX_CODA_CHARACTER_ENCODINGS[i];
        break;
      }
    }
    BOOL color = YES;
    int counter = 0;
    int bit = 0;
    while (bit < 7) { // A character consists of 7 digit.
      result.array[position] = color;
      position++;
      if (((code >> (6 - bit)) & 1) == 0 || counter == 1) {
        color = !color; // Flip the color.
        bit++;
        counter = 0;
      } else {
        counter++;
      }
    }
    if (index < contents.length - 1) {
      result.array[position] = NO;
      position++;
    }
  }
  return result;
}

@end
