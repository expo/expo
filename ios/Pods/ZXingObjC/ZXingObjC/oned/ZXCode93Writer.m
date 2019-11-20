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
#import "ZXCode93Reader.h"
#import "ZXCode93Writer.h"
#import "ZXIntArray.h"

@implementation ZXCode93Writer

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (format != kBarcodeFormatCode93) {
    [NSException raise:NSInvalidArgumentException format:@"Can only encode CODE_93."];
  }
  return [super encode:contents format:format width:width height:height hints:hints error:error];
}

/**
 * @param contents barcode contents to encode. It should not be encoded for extended characters.
 * @return a {@code boolean[]} of horizontal pixels (false = white, true = black)
 */
- (ZXBoolArray *)encode:(NSString *)contents {
  contents = [self convertToExtended:contents];
  int length = (int)[contents length];
  if (length > 80) {
    [NSException raise:NSInvalidArgumentException
                format:@"Requested contents should be less than 80 digits long after converting to extended encoding, but got %d", length];
  }

  //lenght of code + 2 start/stop characters + 2 checksums, each of 9 bits, plus a termination bar
  int codeWidth = (length + 2 + 2) * 9 + 1;
  ZXBoolArray *result = [[ZXBoolArray alloc] initWithLength:codeWidth];

  //start character (*)
  int pos = [self appendPattern:result pos:0 a:ZX_CODE93_ASTERISK_ENCODING];

  for (int i = 0; i < length; i++) {
    NSUInteger indexInString = [ZX_CODE93_ALPHABET_STRING rangeOfString:[contents substringWithRange:NSMakeRange(i, 1)]].location;
    if (indexInString == NSNotFound) {
      [NSException raise:NSInvalidArgumentException format:@"Bad contents: %@", contents];
    }
    pos += [self appendPattern:result pos:pos a:ZX_CODE93_CHARACTER_ENCODINGS[indexInString]];
  }

  //add two checksums
  int check1 = [self computeChecksumIndexFrom:contents withMaxWeight:20];
  pos += [self appendPattern:result pos:pos a:ZX_CODE93_CHARACTER_ENCODINGS[check1]];

  //append the contents to reflect the first checksum added
  contents = [contents stringByAppendingString:[ZX_CODE93_ALPHABET_STRING substringWithRange:NSMakeRange(check1, 1)]];

  int check2 = [self computeChecksumIndexFrom:contents withMaxWeight:15];
  pos += [self appendPattern:result pos:pos a:ZX_CODE93_CHARACTER_ENCODINGS[check2]];

  //end character (*)
  pos += [self appendPattern:result pos:pos a:ZX_CODE93_ASTERISK_ENCODING];

  //termination bar (single black bar)
  result.array[pos] = true;

  return result;
}

- (NSString *)convertToExtended:(NSString *)contents {
  int length = (int)[contents length];
  NSMutableString *extendedContent = [[NSMutableString alloc] initWithCapacity:length * 2];
  for (int i = 0; i < length; i++) {
    unichar character = [contents characterAtIndex:i];
    // ($)=a, (%)=b, (/)=c, (+)=d. see Code93Reader.ALPHABET_STRING
    if (character == 0) {
      // NUL: (%)U
      [extendedContent appendString:@"bU"];
    } else if (character <= 26) {
      // SOH - SUB: ($)A - ($)Z
      [extendedContent appendFormat:@"%c", 'a'];
      [extendedContent appendFormat:@"%c", ('A' + character - 1)];
    } else if (character <= 31) {
      // ESC - US: (%)A - (%)E
      [extendedContent appendFormat:@"%c", 'b'];
      [extendedContent appendFormat:@"%c", ('A' + character - 27)];
    } else if (character == ' ' || character == '$' || character == '%' || character == '+') {
      // space $ % +
      [extendedContent appendFormat:@"%c", character];
    } else if (character <= ',') {
      // ! " # & ' ( ) * ,: (/)A - (/)L
      [extendedContent appendFormat:@"%c", 'c'];
      [extendedContent appendFormat:@"%c", ('A' + character - '!')];
    } else if (character <= '9') {
      [extendedContent appendFormat:@"%c", character];
    } else if (character == ':') {
      // :: (/)Z
      [extendedContent appendString:@"cZ"];
    } else if (character <= '?') {
      // ; - ?: (%)F - (%)J
      [extendedContent appendFormat:@"%c", 'b'];
      [extendedContent appendFormat:@"%c", ('F' + character - ';')];
    } else if (character == '@') {
      // @: (%)V
      [extendedContent appendString:@"bV"];
    } else if (character <= 'Z') {
      // A - Z
      [extendedContent appendFormat:@"%c", character];
    } else if (character <= '_') {
      // [ - _: (%)K - (%)O
      [extendedContent appendFormat:@"%c", 'b'];
      [extendedContent appendFormat:@"%c", ('K' + character - '[')];
    } else if (character == '`') {
      // `: (%)W
      [extendedContent appendString:@"bW"];
    } else if (character <= 'z') {
      // a - z: (*)A - (*)Z
      [extendedContent appendFormat:@"%c", 'd'];
      [extendedContent appendFormat:@"%c", ('A' + character - 'a')];
    } else if (character <= 127) {
      // { - DEL: (%)P - (%)T
      [extendedContent appendFormat:@"%c", 'b'];
      [extendedContent appendFormat:@"%c", ('P' + character - '{')];
    } else {
      [NSException raise:NSInvalidArgumentException
                  format:@"Requested content contains a non-encodable character: '%c'", character];
    }
  }
  return extendedContent;
}

- (int)appendPattern:(ZXBoolArray *)target pos:(int)pos pattern:(const int[])pattern patternLen:(int)patternLen {
  for (int i = 0; i < patternLen; i++) {
    target.array[pos++] = pattern[i] != 0;
  }
  return 9;
}

- (int)appendPattern:(ZXBoolArray *)target pos:(int)pos a:(int)a {
  for (int i = 0; i < 9; i++) {
    int temp = a & (1 << (8 - i));
    target.array[pos + i] = temp != 0;
  }
  return 9;
}

- (int)computeChecksumIndexFrom:(NSString *)contents withMaxWeight:(int)maxWeight {
  int weight = 1;
  int total = 0;
  int length = (int)[contents length];
  for (int i = length - 1; i >= 0; i--) {
    NSUInteger indexInString = [ZX_CODE93_ALPHABET_STRING rangeOfString:[contents substringWithRange:NSMakeRange(i, 1)]].location;
    if (indexInString == NSNotFound) {
      [NSException raise:NSInvalidArgumentException format:@"Bad contents: %@", contents];
    }
    total += indexInString * weight;
    if (++weight > maxWeight) {
      weight = 1;
    }
  }
  return total % 47;
}

@end
