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
#import "ZXByteArray.h"
#import "ZXErrors.h"
#import "ZXQRCodeBitMatrixParser.h"
#import "ZXQRCodeDataMask.h"
#import "ZXQRCodeFormatInformation.h"
#import "ZXQRCodeVersion.h"

@interface ZXQRCodeBitMatrixParser ()

@property (nonatomic, strong, readonly) ZXBitMatrix *bitMatrix;
@property (nonatomic, assign) BOOL shouldMirror;
@property (nonatomic, strong) ZXQRCodeFormatInformation *parsedFormatInfo;
@property (nonatomic, strong) ZXQRCodeVersion *parsedVersion;

@end

@implementation ZXQRCodeBitMatrixParser

- (id)initWithBitMatrix:(ZXBitMatrix *)bitMatrix error:(NSError **)error {
  int dimension = bitMatrix.height;
  if (dimension < 21 || (dimension & 0x03) != 1) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }

  if (self = [super init]) {
    _bitMatrix = bitMatrix;
    _parsedFormatInfo = nil;
    _parsedVersion = nil;
  }
  return self;
}

- (ZXQRCodeFormatInformation *)readFormatInformationWithError:(NSError **)error {
  if (self.parsedFormatInfo != nil) {
    return self.parsedFormatInfo;
  }
  int formatInfoBits1 = 0;

  for (int i = 0; i < 6; i++) {
    formatInfoBits1 = [self copyBit:i j:8 versionBits:formatInfoBits1];
  }

  formatInfoBits1 = [self copyBit:7 j:8 versionBits:formatInfoBits1];
  formatInfoBits1 = [self copyBit:8 j:8 versionBits:formatInfoBits1];
  formatInfoBits1 = [self copyBit:8 j:7 versionBits:formatInfoBits1];

  for (int j = 5; j >= 0; j--) {
    formatInfoBits1 = [self copyBit:8 j:j versionBits:formatInfoBits1];
  }

  int dimension = self.bitMatrix.height;
  int formatInfoBits2 = 0;
  int jMin = dimension - 7;

  for (int j = dimension - 1; j >= jMin; j--) {
    formatInfoBits2 = [self copyBit:8 j:j versionBits:formatInfoBits2];
  }

  for (int i = dimension - 8; i < dimension; i++) {
    formatInfoBits2 = [self copyBit:i j:8 versionBits:formatInfoBits2];
  }

  self.parsedFormatInfo = [ZXQRCodeFormatInformation decodeFormatInformation:formatInfoBits1 maskedFormatInfo2:formatInfoBits2];
  if (self.parsedFormatInfo != nil) {
    return self.parsedFormatInfo;
  }
  if (error) *error = ZXFormatErrorInstance();
  return nil;
}

- (ZXQRCodeVersion *)readVersionWithError:(NSError **)error {
  if (self.parsedVersion != nil) {
    return self.parsedVersion;
  }
  int dimension = self.bitMatrix.height;
  int provisionalVersion = (dimension - 17) / 4;
  if (provisionalVersion <= 6) {
    return [ZXQRCodeVersion versionForNumber:provisionalVersion];
  }
  int versionBits = 0;
  int ijMin = dimension - 11;

  for (int j = 5; j >= 0; j--) {

    for (int i = dimension - 9; i >= ijMin; i--) {
      versionBits = [self copyBit:i j:j versionBits:versionBits];
    }

  }

  ZXQRCodeVersion *theParsedVersion = [ZXQRCodeVersion decodeVersionInformation:versionBits];
  if (theParsedVersion != nil && theParsedVersion.dimensionForVersion == dimension) {
    self.parsedVersion = theParsedVersion;
    return self.parsedVersion;
  }
  versionBits = 0;

  for (int i = 5; i >= 0; i--) {
    for (int j = dimension - 9; j >= ijMin; j--) {
      versionBits = [self copyBit:i j:j versionBits:versionBits];
    }
  }

  theParsedVersion = [ZXQRCodeVersion decodeVersionInformation:versionBits];
  if (theParsedVersion != nil && theParsedVersion.dimensionForVersion == dimension) {
    self.parsedVersion = theParsedVersion;
    return self.parsedVersion;
  }
  if (error) *error = ZXFormatErrorInstance();
  return nil;
}

- (int)copyBit:(int)i j:(int)j versionBits:(int)versionBits {
  BOOL bit = self.shouldMirror ? [self.bitMatrix getX:j y:i] : [self.bitMatrix getX:i y:j];
  return bit ? (versionBits << 1) | 0x1 : versionBits << 1;
}

- (ZXByteArray *)readCodewordsWithError:(NSError **)error {
  ZXQRCodeFormatInformation *formatInfo = [self readFormatInformationWithError:error];
  if (!formatInfo) {
    return nil;
  }

  ZXQRCodeVersion *version = [self readVersionWithError:error];
  if (!version) {
    return nil;
  }

  // Get the data mask for the format used in this QR Code. This will exclude
  // some bits from reading as we wind through the bit matrix.
  ZXQRCodeDataMask *dataMask = [ZXQRCodeDataMask forReference:[formatInfo dataMask]];
  int dimension = self.bitMatrix.height;
  [dataMask unmaskBitMatrix:self.bitMatrix dimension:dimension];

  ZXBitMatrix *functionPattern = [version buildFunctionPattern];

  BOOL readingUp = YES;
  ZXByteArray *result = [[ZXByteArray alloc] initWithLength:version.totalCodewords];
  int resultOffset = 0;
  int currentByte = 0;
  int bitsRead = 0;
  // Read columns in pairs, from right to left
  for (int j = dimension - 1; j > 0; j -= 2) {
    if (j == 6) {
      // Skip whole column with vertical alignment pattern;
      // saves time and makes the other code proceed more cleanly
      j--;
    }
    // Read alternatingly from bottom to top then top to bottom
    for (int count = 0; count < dimension; count++) {
      int i = readingUp ? dimension - 1 - count : count;
      for (int col = 0; col < 2; col++) {
        // Ignore bits covered by the function pattern
        if (![functionPattern getX:j - col y:i]) {
          // Read a bit
          bitsRead++;
          currentByte <<= 1;
          if ([self.bitMatrix getX:j - col y:i]) {
            currentByte |= 1;
          }
          // If we've made a whole byte, save it off
          if (bitsRead == 8) {
            result.array[resultOffset++] = (int8_t) currentByte;
            bitsRead = 0;
            currentByte = 0;
          }
        }
      }
    }
    readingUp ^= YES; // readingUp = !readingUp; // switch directions
  }
  if (resultOffset != [version totalCodewords]) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }
  return result;
}

- (void)remask {
  if (!self.parsedFormatInfo) {
    return; // We have no format information, and have no data mask
  }
  ZXQRCodeDataMask *dataMask = [ZXQRCodeDataMask forReference:self.parsedFormatInfo.dataMask];
  int dimension = self.bitMatrix.height;
  [dataMask unmaskBitMatrix:self.bitMatrix dimension:dimension];
}

- (void)setMirror:(BOOL)mirror {
  self.parsedVersion = nil;
  self.parsedFormatInfo = nil;
  self.shouldMirror = mirror;
}

- (void)mirror {
  for (int x = 0; x < self.bitMatrix.width; x++) {
    for (int y = x + 1; y < self.bitMatrix.height; y++) {
      if ([self.bitMatrix getX:x y:y] != [self.bitMatrix getX:y y:x]) {
        [self.bitMatrix flipX:y y:x];
        [self.bitMatrix flipX:x y:y];
      }
    }
  }
}

@end
