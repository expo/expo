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
#import "ZXBoolArray.h"
#import "ZXCode39Reader.h"
#import "ZXCode39Writer.h"
#import "ZXIntArray.h"

@implementation ZXCode39Writer

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (format != kBarcodeFormatCode39) {
    [NSException raise:NSInvalidArgumentException format:@"Can only encode CODE_39."];
  }
  return [super encode:contents format:format width:width height:height hints:hints error:error];
}

- (ZXBoolArray *)encode:(NSString *)contents {
  int length = (int)[contents length];
  if (length > 80) {
    [NSException raise:NSInvalidArgumentException
                format:@"Requested contents should be less than 80 digits long, but got %d", length];
  }

  for (int i = 0; i < length; i++) {
    NSUInteger indexInString = [ZX_CODE39_ALPHABET_STRING rangeOfString:[contents substringWithRange:NSMakeRange(i, 1)]].location;
    if (indexInString == NSNotFound) {
      contents = [self tryToConvertToExtendedMode:contents];
      length = (int)[contents length];
      if (length > 80) {
        [NSException raise:NSInvalidArgumentException format:@"Requested contents should be less than 80 digits long, but got %d (extended full ASCII mode)", length];
      }
    }
  }

  ZXIntArray *widths = [[ZXIntArray alloc] initWithLength:9];
  int codeWidth = 24 + 1 + (13 * length);
  ZXBoolArray *result = [[ZXBoolArray alloc] initWithLength:codeWidth];
  [self toIntArray:ZX_CODE39_ASTERISK_ENCODING toReturn:widths];
  int pos = [self appendPattern:result pos:0 pattern:widths.array patternLen:widths.length startColor:YES];
  ZXIntArray *narrowWhite = [[ZXIntArray alloc] initWithInts:1, -1];
  pos += [self appendPattern:result pos:pos pattern:narrowWhite.array patternLen:narrowWhite.length startColor:NO];
  //append next character to byte matrix
  for (int i = 0; i < length; i++) {
    NSUInteger indexInString = [ZX_CODE39_ALPHABET_STRING rangeOfString:[contents substringWithRange:NSMakeRange(i, 1)]].location;
    [self toIntArray:ZX_CODE39_CHARACTER_ENCODINGS[indexInString] toReturn:widths];
    pos += [self appendPattern:result pos:pos pattern:widths.array patternLen:widths.length startColor:YES];
    pos += [self appendPattern:result pos:pos pattern:narrowWhite.array patternLen:narrowWhite.length startColor:NO];
  }

  [self toIntArray:ZX_CODE39_ASTERISK_ENCODING toReturn:widths];
  [self appendPattern:result pos:pos pattern:widths.array patternLen:widths.length startColor:YES];
  return result;
}

- (void)toIntArray:(int)a toReturn:(ZXIntArray *)toReturn {
  for (int i = 0; i < 9; i++) {
    int temp = a & (1 << (8 - i));
    toReturn.array[i] = temp == 0 ? 1 : 2;
  }
}

- (NSString *)tryToConvertToExtendedMode:(NSString *)contents {
  int length = (int)[contents length];
  NSMutableString *extendedContent = [NSMutableString new];

  for (int i = 0; i < length; i++) {
    unichar character = [contents characterAtIndex:i];
    switch (character) {
      case 0x0000:
        [extendedContent appendString:@"%U"];
        break;
      case ' ':
      case '-':
      case '.':
        [extendedContent appendFormat:@"%C", character];
        break;
      case '@':
        [extendedContent appendString:@"%V"];
        break;
      case '`':
        [extendedContent appendString:@"%W"];
        break;
      default:
        if (character > 0 && character < 27) {
          [extendedContent appendFormat:@"%C", (unichar) '$'];
          [extendedContent appendFormat:@"%C", (unichar) ('A' + (character - 1))];
        } else if (character > 26 && character < ' ') {
          [extendedContent appendFormat:@"%C", (unichar) '%'];
          [extendedContent appendFormat:@"%C", (unichar) ('A' + (character - 27))];
        } else if ((character > ' ' && character < '-') || character == '/' || character == ':') {
          [extendedContent appendFormat:@"%C", (unichar) '/'];
          [extendedContent appendFormat:@"%C", (unichar) ('A' + (character - 33))];
        } else if (character > '/' && character < ':') {
          [extendedContent appendFormat:@"%C", (unichar) ('0' + (character - 48))];
        } else if (character > ':' && character < '@') {
          [extendedContent appendFormat:@"%C", (unichar) '%'];
          [extendedContent appendFormat:@"%C", (unichar) ('F' + (character - 59))];
        } else if (character > '@' && character < '[') {
          [extendedContent appendFormat:@"%C", (unichar) ('A' + (character - 65))];
        } else if (character > 'Z' && character < '`') {
          [extendedContent appendFormat:@"%C", (unichar) '%'];
          [extendedContent appendFormat:@"%C", (unichar) ('K' + (character - 91))];
        } else if (character > '`' && character < '{') {
          [extendedContent appendFormat:@"%C", (unichar) '+'];
          [extendedContent appendFormat:@"%C", (unichar) ('A' + (character - 97))];
        } else if (character > 'z' && character < 128) {
          [extendedContent appendFormat:@"%C", (unichar) '%'];
          [extendedContent appendFormat:@"%C", (unichar) ('P' + (character - 123))];
        } else {
          [NSException raise:NSInvalidArgumentException format:@"Requested content contains a non-encodable character: '%@'", [contents substringWithRange:NSMakeRange(i, 1)]];
        }
        break;
    }
  }

  return extendedContent;
}

@end
