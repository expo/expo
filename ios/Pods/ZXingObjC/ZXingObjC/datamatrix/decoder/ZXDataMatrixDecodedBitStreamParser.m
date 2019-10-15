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

#import "ZXBitSource.h"
#import "ZXByteArray.h"
#import "ZXDataMatrixDecodedBitStreamParser.h"
#import "ZXDecoderResult.h"
#import "ZXErrors.h"

/**
 * See ISO 16022:2006, Annex C Table C.1
 * The C40 Basic Character Set (*'s used for placeholders for the shift values)
 */
static const unichar C40_BASIC_SET_CHARS[40] = {
  '*', '*', '*', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
};

static const unichar C40_SHIFT2_SET_CHARS[40] = {
  '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*',  '+', ',', '-', '.',
  '/', ':', ';', '<', '=', '>', '?',  '@', '[', '\\', ']', '^', '_'
};

/**
 * See ISO 16022:2006, Annex C Table C.2
 * The Text Basic Character Set (*'s used for placeholders for the shift values)
 */
static const unichar TEXT_BASIC_SET_CHARS[40] = {
  '*', '*', '*', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
};

// Shift 2 for Text is the same encoding as C40
static unichar TEXT_SHIFT2_SET_CHARS[40];

static const unichar TEXT_SHIFT3_SET_CHARS[32] = {
  '`', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O',  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '{', '|', '}', '~', (unichar) 127
};

enum {
  PAD_ENCODE = 0, // Not really a mode
  ASCII_ENCODE,
  C40_ENCODE,
  TEXT_ENCODE,
  ANSIX12_ENCODE,
  EDIFACT_ENCODE,
  BASE256_ENCODE
};

@implementation ZXDataMatrixDecodedBitStreamParser

+ (void)initialize {
  if ([self class] != [ZXDataMatrixDecodedBitStreamParser class]) return;

  memcpy(TEXT_SHIFT2_SET_CHARS, C40_SHIFT2_SET_CHARS, sizeof(C40_SHIFT2_SET_CHARS));
}

+ (ZXDecoderResult *)decode:(ZXByteArray *)bytes error:(NSError **)error {
  ZXBitSource *bits = [[ZXBitSource alloc] initWithBytes:bytes];
  NSMutableString *result = [NSMutableString stringWithCapacity:100];
  NSMutableString *resultTrailer = [NSMutableString string];
  NSMutableArray *byteSegments = [NSMutableArray arrayWithCapacity:1];
  int mode = ASCII_ENCODE;
  do {
    if (mode == ASCII_ENCODE) {
      mode = [self decodeAsciiSegment:bits result:result resultTrailer:resultTrailer];
      if (mode == -1) {
        if (error) *error = ZXFormatErrorInstance();
        return nil;
      }
    } else {
      switch (mode) {
      case C40_ENCODE:
        if (![self decodeC40Segment:bits result:result]) {
          if (error) *error = ZXFormatErrorInstance();
          return nil;
        }
        break;
      case TEXT_ENCODE:
        if (![self decodeTextSegment:bits result:result]) {
          if (error) *error = ZXFormatErrorInstance();
          return nil;
        }
        break;
      case ANSIX12_ENCODE:
        if (![self decodeAnsiX12Segment:bits result:result]) {
          if (error) *error = ZXFormatErrorInstance();
          return nil;
        }
        break;
      case EDIFACT_ENCODE:
        [self decodeEdifactSegment:bits result:result];
        break;
      case BASE256_ENCODE:
        if (![self decodeBase256Segment:bits result:result byteSegments:byteSegments]) {
          if (error) *error = ZXFormatErrorInstance();
          return nil;
        }
        break;
      default:
        if (error) *error = ZXFormatErrorInstance();
        return nil;
      }
      mode = ASCII_ENCODE;
    }
  } while (mode != PAD_ENCODE && bits.available > 0);
  if ([resultTrailer length] > 0) {
    [result appendString:resultTrailer];
  }
  return [[ZXDecoderResult alloc] initWithRawBytes:bytes
                                              text:result
                                      byteSegments:[byteSegments count] == 0 ? nil : byteSegments
                                           ecLevel:nil];
}

/**
 * See ISO 16022:2006, 5.2.3 and Annex C, Table C.2
 */
+ (int)decodeAsciiSegment:(ZXBitSource *)bits result:(NSMutableString *)result resultTrailer:(NSMutableString *)resultTrailer {
  BOOL upperShift = NO;
  do {
    int oneByte = [bits readBits:8];
    if (oneByte == 0) {
      return -1;
    } else if (oneByte <= 128) {  // ASCII data (ASCII value + 1)
      if (upperShift) {
        oneByte += 128;
        //upperShift = NO;
      }
      [result appendFormat:@"%C", (unichar)(oneByte - 1)];
      return ASCII_ENCODE;
    } else if (oneByte == 129) {  // Pad
      return PAD_ENCODE;
    } else if (oneByte <= 229) {  // 2-digit data 00-99 (Numeric Value + 130)
      int value = oneByte - 130;
      if (value < 10) { // pad with '0' for single digit values
        [result appendString:@"0"];
      }
      [result appendFormat:@"%d", value];
    } else if (oneByte == 230) {  // Latch to C40 encodation
      return C40_ENCODE;
    } else if (oneByte == 231) {  // Latch to Base 256 encodation
      return BASE256_ENCODE;
    } else if (oneByte == 232) {
      // FNC1
      [result appendFormat:@"%C", (unichar)29]; // translate as ASCII 29
    } else if (oneByte == 233 || oneByte == 234) {
      // Structured Append, Reader Programming
      // Ignore these symbols for now
      //return -1;
    } else if (oneByte == 235) {  // Upper Shift (shift to Extended ASCII)
      upperShift = YES;
    } else if (oneByte == 236) {  // 05 Macro
      [result appendFormat:@"[)>%C%C", (unichar)0x001E05, (unichar)0x001D];
      [resultTrailer insertString:[NSString stringWithFormat:@"%C%C", (unichar)0x001E, (unichar)0x0004] atIndex:0];
    } else if (oneByte == 237) {  // 06 Macro
      [result appendFormat:@"[)>%C%C", (unichar)0x001E06, (unichar)0x001D];
      [resultTrailer insertString:[NSString stringWithFormat:@"%C%C", (unichar)0x001E, (unichar)0x0004] atIndex:0];
    } else if (oneByte == 238) {  // Latch to ANSI X12 encodation
      return ANSIX12_ENCODE;
    } else if (oneByte == 239) {  // Latch to Text encodation
      return TEXT_ENCODE;
    } else if (oneByte == 240) {  // Latch to EDIFACT encodation
      return EDIFACT_ENCODE;
    } else if (oneByte == 241) {  // ECI Character
      // TODO(bbrown): I think we need to support ECI
      // Ignore this symbol for now
    } else if (oneByte >= 242) {  // Not to be used in ASCII encodation
      // ... but work around encoders that end with 254, latch back to ASCII
      if (oneByte != 254 || bits.available != 0) {
        return -1;
      }
    }
  } while (bits.available > 0);
  return ASCII_ENCODE;
}

/**
 * See ISO 16022:2006, 5.2.5 and Annex C, Table C.1
 */
+ (BOOL)decodeC40Segment:(ZXBitSource *)bits result:(NSMutableString *)result {
  // Three C40 values are encoded in a 16-bit value as
  // (1600 * C1) + (40 * C2) + C3 + 1
  // TODO(bbrown): The Upper Shift with C40 doesn't work in the 4 value scenario all the time
  BOOL upperShift = NO;

  int cValues[3] = {0};
  int shift = 0;

  do {
    // If there is only one byte left then it will be encoded as ASCII
    if ([bits available] == 8) {
      return YES;
    }
    int firstByte = [bits readBits:8];
    if (firstByte == 254) {  // Unlatch codeword
      return YES;
    }

    [self parseTwoBytes:firstByte secondByte:[bits readBits:8] result:cValues];

    for (int i = 0; i < 3; i++) {
      int cValue = cValues[i];
      switch (shift) {
      case 0:
        if (cValue < 3) {
          shift = cValue + 1;
        } else if (cValue < sizeof(C40_BASIC_SET_CHARS) / sizeof(char)) {
          unichar c40char = C40_BASIC_SET_CHARS[cValue];
          if (upperShift) {
            [result appendFormat:@"%C", (unichar)(c40char + 128)];
            upperShift = NO;
          } else {
            [result appendFormat:@"%C", c40char];
          }
        } else {
          return NO;
        }
        break;
      case 1:
        if (upperShift) {
          [result appendFormat:@"%C", (unichar)(cValue + 128)];
          upperShift = NO;
        } else {
          [result appendFormat:@"%C", (unichar)cValue];
        }
        shift = 0;
        break;
      case 2:
        if (cValue < sizeof(C40_SHIFT2_SET_CHARS) / sizeof(char)) {
          unichar c40char = C40_SHIFT2_SET_CHARS[cValue];
          if (upperShift) {
            [result appendFormat:@"%C", (unichar)(c40char + 128)];
            upperShift = NO;
          } else {
            [result appendFormat:@"%C", c40char];
          }
        } else if (cValue == 27) {  // FNC1
          [result appendFormat:@"%C", (unichar)29]; // translate as ASCII 29
        } else if (cValue == 30) {  // Upper Shift
          upperShift = YES;
        } else {
          return NO;
        }
        shift = 0;
        break;
      case 3:
        if (upperShift) {
          [result appendFormat:@"%C", (unichar)(cValue + 224)];
          upperShift = NO;
        } else {
          [result appendFormat:@"%C", (unichar)(cValue + 96)];
        }
        shift = 0;
        break;
      default:
        return NO;
      }
    }
  } while (bits.available > 0);

  return YES;
}

/**
 * See ISO 16022:2006, 5.2.6 and Annex C, Table C.2
 */
+ (BOOL)decodeTextSegment:(ZXBitSource *)bits result:(NSMutableString *)result {
  // Three Text values are encoded in a 16-bit value as
  // (1600 * C1) + (40 * C2) + C3 + 1
  // TODO(bbrown): The Upper Shift with Text doesn't work in the 4 value scenario all the time
  BOOL upperShift = NO;

  int cValues[3] = {0};

  int shift = 0;
  do {
    // If there is only one byte left then it will be encoded as ASCII
    if (bits.available == 8) {
      return YES;
    }
    int firstByte = [bits readBits:8];
    if (firstByte == 254) {  // Unlatch codeword
      return YES;
    }

    [self parseTwoBytes:firstByte secondByte:[bits readBits:8] result:cValues];

    for (int i = 0; i < 3; i++) {
      int cValue = cValues[i];
      switch (shift) {
      case 0:
        if (cValue < 3) {
          shift = cValue + 1;
        } else if (cValue < sizeof(TEXT_BASIC_SET_CHARS) / sizeof(char)) {
          unichar textChar = TEXT_BASIC_SET_CHARS[cValue];
          if (upperShift) {
            [result appendFormat:@"%C", (unichar)(textChar + 128)];
            upperShift = NO;
          } else {
            [result appendFormat:@"%C", textChar];
          }
        } else {
          return NO;
        }
        break;
      case 1:
        if (upperShift) {
          [result appendFormat:@"%C", (unichar)(cValue + 128)];
          upperShift = NO;
        } else {
          [result appendFormat:@"%C", (unichar)cValue];
        }
        shift = 0;
        break;
      case 2:
          // Shift 2 for Text is the same encoding as C40
        if (cValue < sizeof(TEXT_SHIFT2_SET_CHARS) / sizeof(unichar)) {
          unichar textChar = TEXT_SHIFT2_SET_CHARS[cValue];
          if (upperShift) {
            [result appendFormat:@"%C", (unichar)(textChar + 128)];
            upperShift = NO;
          } else {
            [result appendFormat:@"%C", textChar];
          }
        } else if (cValue == 27) {
          [result appendFormat:@"%C", (unichar)29]; // translate as ASCII 29
        } else if (cValue == 30) {  // Upper Shift
          upperShift = YES;
        } else {
          return NO;
        }
        shift = 0;
        break;
      case 3:
        if (cValue < sizeof(TEXT_SHIFT3_SET_CHARS) / sizeof(char)) {
          unichar textChar = TEXT_SHIFT3_SET_CHARS[cValue];
          if (upperShift) {
            [result appendFormat:@"%C", (unichar)(textChar + 128)];
            upperShift = NO;
          } else {
            [result appendFormat:@"%C", textChar];
          }
          shift = 0;
        } else {
          return NO;
        }
        break;
      default:
        return NO;
      }
    }
  } while (bits.available > 0);
  return YES;
}

/**
 * See ISO 16022:2006, 5.2.7
 */
+ (BOOL)decodeAnsiX12Segment:(ZXBitSource *)bits result:(NSMutableString *)result {
  // Three ANSI X12 values are encoded in a 16-bit value as
  // (1600 * C1) + (40 * C2) + C3 + 1

  int cValues[3] = {0};
  do {
    // If there is only one byte left then it will be encoded as ASCII
    if (bits.available == 8) {
      return YES;
    }
    int firstByte = [bits readBits:8];
    if (firstByte == 254) {  // Unlatch codeword
      return YES;
    }

    [self parseTwoBytes:firstByte secondByte:[bits readBits:8] result:cValues];

    for (int i = 0; i < 3; i++) {
      int cValue = cValues[i];
      if (cValue == 0) {  // X12 segment terminator <CR>
        [result appendString:@"\r"];
      } else if (cValue == 1) {  // X12 segment separator *
        [result appendString:@"*"];
      } else if (cValue == 2) {  // X12 sub-element separator >
        [result appendString:@">"];
      } else if (cValue == 3) {  // space
        [result appendString:@" "];
      } else if (cValue < 14) {  // 0 - 9
        [result appendFormat:@"%C", (unichar)(cValue + 44)];
      } else if (cValue < 40) {  // A - Z
        [result appendFormat:@"%C", (unichar)(cValue + 51)];
      } else {
        return NO;
      }
    }
  } while (bits.available > 0);
  return YES;
}

+ (void)parseTwoBytes:(int)firstByte secondByte:(int)secondByte result:(int[])result {
  int fullBitValue = (firstByte << 8) + secondByte - 1;
  int temp = fullBitValue / 1600;
  result[0] = temp;
  fullBitValue -= temp * 1600;
  temp = fullBitValue / 40;
  result[1] = temp;
  result[2] = fullBitValue - temp * 40;
}

/**
 * See ISO 16022:2006, 5.2.8 and Annex C Table C.3
 */
+ (void)decodeEdifactSegment:(ZXBitSource *)bits result:(NSMutableString *)result {
  do {
    // If there is only two or less bytes left then it will be encoded as ASCII
    if (bits.available <= 16) {
      return;
    }

    for (int i = 0; i < 4; i++) {
      int edifactValue = [bits readBits:6];

      // Check for the unlatch character
      if (edifactValue == 0x1F) {  // 011111
        // Read rest of byte, which should be 0, and stop
        int bitsLeft = 8 - bits.bitOffset;
        if (bitsLeft != 8) {
          [bits readBits:bitsLeft];
        }
        return;
      }

      if ((edifactValue & 0x20) == 0) {  // no 1 in the leading (6th) bit
        edifactValue |= 0x40;  // Add a leading 01 to the 6 bit binary value
      }
      [result appendFormat:@"%c", (char)edifactValue];
    }
  } while (bits.available > 0);
}

/**
 * See ISO 16022:2006, 5.2.9 and Annex B, B.2
 */
+ (BOOL)decodeBase256Segment:(ZXBitSource *)bits result:(NSMutableString *)result byteSegments:(NSMutableArray *)byteSegments {
  int codewordPosition = 1 + bits.byteOffset; // position is 1-indexed
  int d1 = [self unrandomize255State:[bits readBits:8] base256CodewordPosition:codewordPosition++];
  int count;
  if (d1 == 0) {
    count = [bits available] / 8;
  } else if (d1 < 250) {
    count = d1;
  } else {
    count = 250 * (d1 - 249) + [self unrandomize255State:[bits readBits:8] base256CodewordPosition:codewordPosition++];
  }

  if (count < 0) {
    return NO;
  }

  ZXByteArray *bytes = [[ZXByteArray alloc] initWithLength:count];
  for (int i = 0; i < count; i++) {
    if ([bits available] < 8) {
      return NO;
    }
    bytes.array[i] = (int8_t)[self unrandomize255State:[bits readBits:8] base256CodewordPosition:codewordPosition++];
  }
  [byteSegments addObject:bytes];

  [result appendString:[[NSString alloc] initWithBytes:bytes.array length:bytes.length encoding:NSISOLatin1StringEncoding]];
  return YES;
}

/**
 * See ISO 16022:2006, Annex B, B.2
 */
+ (int)unrandomize255State:(int)randomizedBase256Codeword base256CodewordPosition:(int)base256CodewordPosition {
  int pseudoRandomNumber = ((149 * base256CodewordPosition) % 255) + 1;
  int tempVariable = randomizedBase256Codeword - pseudoRandomNumber;
  return tempVariable >= 0 ? tempVariable : tempVariable + 256;
}

@end
