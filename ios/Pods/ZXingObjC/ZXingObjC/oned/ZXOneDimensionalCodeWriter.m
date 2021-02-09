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
#import "ZXEncodeHints.h"
#import "ZXOneDimensionalCodeWriter.h"
#import "ZXUPCAReader.h"
@interface ZXOneDimensionalCodeWriter ()

@property NSMutableArray *longLinePositions;
@property BOOL showLongLines;

@end

@implementation ZXOneDimensionalCodeWriter

- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height error:(NSError **)error {
  return [self encode:contents format:format width:width height:height hints:nil error:error];
}

/**
 * Encode the contents following specified format.
 * width and height are required size. This method may return bigger size
 * ZXBitMatrix when specified size is too small. The user can set both {width and
 * height to zero to get minimum size barcode. If negative value is set to width
 * or height, IllegalArgumentException is thrown.
 */
- (ZXBitMatrix *)encode:(NSString *)contents format:(ZXBarcodeFormat)format width:(int)width height:(int)height
                  hints:(ZXEncodeHints *)hints error:(NSError **)error {
  if (contents.length == 0) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Found empty contents" userInfo:nil];
  }

  if (width < 0 || height < 0) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:[NSString stringWithFormat:@"Negative size is not allowed. Input: %dx%d", width, height]
                                 userInfo:nil];
  }

  self.longLinePositions = [NSMutableArray new];
  self.showLongLines = NO;
  if (hints.showLongLines) {
    if (format == kBarcodeFormatEan13) {
      self.showLongLines = YES;
    }
    if (format == kBarcodeFormatEan8) {
      self.showLongLines = YES;
    }
  }

  int sidesMargin = [self defaultMargin];
  if (hints && hints.margin) {
    sidesMargin = hints.margin.intValue;
  }

  ZXBoolArray *code = [self encode:contents];
  return [self renderResult:code width:width height:height sidesMargin:sidesMargin];
}

/**
 * @return BOOL, YES iff input contains no other characters than digits 0-9.
 */
- (BOOL)isNumeric:(NSString *)contents {
  NSCharacterSet* notDigits = [[NSCharacterSet decimalDigitCharacterSet] invertedSet];
  if ([contents rangeOfCharacterFromSet:notDigits].location == NSNotFound) {
    return YES;
  } else {
    return NO;
  }
}

/**
 * @return a byte array of horizontal pixels (0 = white, 1 = black)
 */
- (ZXBitMatrix *)renderResult:(ZXBoolArray *)code width:(int)width height:(int)height sidesMargin:(int)sidesMargin {
  int inputWidth = code.length;
  // Add quiet zone on both sides.
  int fullWidth = inputWidth + sidesMargin;
  int outputWidth = MAX(width, fullWidth);
  int outputHeight = MAX(1, height);

  int multiple = outputWidth / fullWidth;
  int leftPadding = (outputWidth - (inputWidth * multiple)) / 2;

  ZXBitMatrix *output = [[ZXBitMatrix alloc] initWithWidth:outputWidth height:outputHeight];
  for (int inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
    if (code.array[inputX]) {
      int barcodeHeight = outputHeight;
      if (self.showLongLines) {
        // if the position is not in the list for long lines we shorten the line by 10%
        if (![self containsPos:inputX]) {
          barcodeHeight = (int) ((float) outputHeight * 0.90f);
        }
      }
      [output setRegionAtLeft:outputX top:0 width:multiple height:barcodeHeight];
    }
  }
  return output;
}

/**
 * @param target encode black/white pattern into this array
 * @param pos position to start encoding at in target
 * @param pattern lengths of black/white runs to encode *
 * @param startColor starting color - false for white, true for black
 * @return the number of elements added to target.
 */
- (int)appendPattern:(ZXBoolArray *)target pos:(int)pos pattern:(const int[])pattern patternLen:(int)patternLen startColor:(BOOL)startColor {
  BOOL color = startColor;
  int numAdded = 0;
  for (int i = 0; i < patternLen; i++) {
    for (int j = 0; j < pattern[i]; j++) {
      if (self.showLongLines && [self isLongLinePattern:pattern]) {
        [self.longLinePositions addObject:[NSNumber numberWithInt:pos]];
      }
      target.array[pos++] = color;
    }
    numAdded += pattern[i];
    color = !color; // flip color after each segment
  }
  return numAdded;
}

- (BOOL)isLongLinePattern:(const int[])pattern
{
  if (pattern == ZX_UPC_EAN_MIDDLE_PATTERN) {
    return YES;
  }
  if (pattern == ZX_UPC_EAN_START_END_PATTERN) {
    return YES;
  }
  return NO;
}

- (BOOL)containsPos:(int)pos
{
  for (NSNumber *number in self.longLinePositions) {
    if (number.intValue == pos) {
      return YES;
    }
  }
  return NO;
}

- (int)defaultMargin {
  // CodaBar spec requires a side margin to be more than ten times wider than narrow space.
  // This seems like a decent idea for a default for all formats.
  return 10;
}

/**
 * Encode the contents to boolean array expression of one-dimensional barcode.
 * Start code and end code should be included in result, and side margins should not be included.
 *
 * @param contents barcode contents to encode
 * @return a ZXBoolArray of horizontal pixels (false = white, true = black)
 */
- (ZXBoolArray *)encode:(NSString *)contents {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

@end
