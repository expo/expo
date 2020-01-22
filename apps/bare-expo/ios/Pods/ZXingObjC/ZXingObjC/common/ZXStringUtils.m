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

#import "ZXByteArray.h"
#import "ZXDecodeHints.h"
#import "ZXStringUtils.h"

@implementation ZXStringUtils

+ (NSStringEncoding)guessEncoding:(ZXByteArray *)bytes hints:(ZXDecodeHints *)hints {
  NSStringEncoding systemEncoding = CFStringConvertEncodingToNSStringEncoding(CFStringGetSystemEncoding());
  BOOL assumeShiftJIS = systemEncoding == NSShiftJISStringEncoding || systemEncoding == NSJapaneseEUCStringEncoding;

  if (hints != nil) {
    NSStringEncoding encoding = hints.encoding;
    if (encoding > 0) {
      return encoding;
    }
  }
  // For now, merely tries to distinguish ISO-8859-1, UTF-8 and Shift_JIS,
  // which should be by far the most common encodings.
  int length = bytes.length;
  BOOL canBeISO88591 = YES;
  BOOL canBeShiftJIS = YES;
  BOOL canBeUTF8 = YES;
  int utf8BytesLeft = 0;
  //int utf8LowChars = 0;
  int utf2BytesChars = 0;
  int utf3BytesChars = 0;
  int utf4BytesChars = 0;
  int sjisBytesLeft = 0;
  //int sjisLowChars = 0;
  int sjisKatakanaChars = 0;
  //int sjisDoubleBytesChars = 0;
  int sjisCurKatakanaWordLength = 0;
  int sjisCurDoubleBytesWordLength = 0;
  int sjisMaxKatakanaWordLength = 0;
  int sjisMaxDoubleBytesWordLength = 0;
  //int isoLowChars = 0;
  //int isoHighChars = 0;
  int isoHighOther = 0;

  BOOL utf8bom = length > 3 &&
    bytes.array[0] == (int8_t) 0xEF &&
    bytes.array[1] == (int8_t) 0xBB &&
    bytes.array[2] == (int8_t) 0xBF;

  for (int i = 0;
       i < length && (canBeISO88591 || canBeShiftJIS || canBeUTF8);
       i++) {

    int value = bytes.array[i] & 0xFF;

    // UTF-8 stuff
    if (canBeUTF8) {
      if (utf8BytesLeft > 0) {
        if ((value & 0x80) == 0) {
          canBeUTF8 = NO;
        } else {
          utf8BytesLeft--;
        }
      } else if ((value & 0x80) != 0) {
        if ((value & 0x40) == 0) {
          canBeUTF8 = NO;
        } else {
          utf8BytesLeft++;
          if ((value & 0x20) == 0) {
            utf2BytesChars++;
          } else {
            utf8BytesLeft++;
            if ((value & 0x10) == 0) {
              utf3BytesChars++;
            } else {
              utf8BytesLeft++;
              if ((value & 0x08) == 0) {
                utf4BytesChars++;
              } else {
                canBeUTF8 = NO;
              }
            }
          }
        }
      } //else {
      //utf8LowChars++;
      //}
    }

    // ISO-8859-1 stuff
    if (canBeISO88591) {
      if (value > 0x7F && value < 0xA0) {
        canBeISO88591 = NO;
      } else if (value > 0x9F) {
        if (value < 0xC0 || value == 0xD7 || value == 0xF7) {
          isoHighOther++;
        } //else {
        //isoHighChars++;
        //}
      } //else {
      //isoLowChars++;
      //}
    }

    // Shift_JIS stuff
    if (canBeShiftJIS) {
      if (sjisBytesLeft > 0) {
        if (value < 0x40 || value == 0x7F || value > 0xFC) {
          canBeShiftJIS = NO;
        } else {
          sjisBytesLeft--;
        }
      } else if (value == 0x80 || value == 0xA0 || value > 0xEF) {
        canBeShiftJIS = NO;
      } else if (value > 0xA0 && value < 0xE0) {
        sjisKatakanaChars++;
        sjisCurDoubleBytesWordLength = 0;
        sjisCurKatakanaWordLength++;
        if (sjisCurKatakanaWordLength > sjisMaxKatakanaWordLength) {
          sjisMaxKatakanaWordLength = sjisCurKatakanaWordLength;
        }
      } else if (value > 0x7F) {
        sjisBytesLeft++;
        //sjisDoubleBytesChars++;
        sjisCurKatakanaWordLength = 0;
        sjisCurDoubleBytesWordLength++;
        if (sjisCurDoubleBytesWordLength > sjisMaxDoubleBytesWordLength) {
          sjisMaxDoubleBytesWordLength = sjisCurDoubleBytesWordLength;
        }
      } else {
        //sjisLowChars++;
        sjisCurKatakanaWordLength = 0;
        sjisCurDoubleBytesWordLength = 0;
      }
    }
  }

  if (canBeUTF8 && utf8BytesLeft > 0) {
    canBeUTF8 = NO;
  }
  if (canBeShiftJIS && sjisBytesLeft > 0) {
    canBeShiftJIS = NO;
  }

  // Easy -- if there is BOM or at least 1 valid not-single byte character (and no evidence it can't be UTF-8), done
  if (canBeUTF8 && (utf8bom || utf2BytesChars + utf3BytesChars + utf4BytesChars > 0)) {
    return NSUTF8StringEncoding;
  }
  // Easy -- if assuming Shift_JIS or at least 3 valid consecutive not-ascii characters (and no evidence it can't be), done
  if (canBeShiftJIS && (assumeShiftJIS || sjisMaxKatakanaWordLength >= 3 || sjisMaxDoubleBytesWordLength >= 3)) {
    return NSShiftJISStringEncoding;
  }
  // Distinguishing Shift_JIS and ISO-8859-1 can be a little tough for short words. The crude heuristic is:
  // - If we saw
  //   - only two consecutive katakana chars in the whole text, or
  //   - at least 10% of bytes that could be "upper" not-alphanumeric Latin1,
  // - then we conclude Shift_JIS, else ISO-8859-1
  if (canBeISO88591 && canBeShiftJIS) {
    return (sjisMaxKatakanaWordLength == 2 && sjisKatakanaChars == 2) || isoHighOther * 10 >= length
    ? NSShiftJISStringEncoding : NSISOLatin1StringEncoding;
  }

  // Otherwise, try in order ISO-8859-1, Shift JIS, UTF-8 and fall back to default platform encoding
  if (canBeISO88591) {
    return NSISOLatin1StringEncoding;
  }
  if (canBeShiftJIS) {
    return NSShiftJISStringEncoding;
  }
  if (canBeUTF8) {
    return NSUTF8StringEncoding;
  }
  // Otherwise, we take a wild guess with platform encoding
  return systemEncoding;
}

@end
