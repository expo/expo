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
#import "ZXDecodeHints.h"
#import "ZXEANManufacturerOrgSupport.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXResult.h"
#import "ZXResultPoint.h"
#import "ZXResultPointCallback.h"
#import "ZXUPCEANReader.h"
#import "ZXUPCEANExtensionSupport.h"

static float ZX_UPC_EAN_MAX_AVG_VARIANCE = 0.48f;
static float ZX_UPC_EAN_MAX_INDIVIDUAL_VARIANCE = 0.7f;

/**
 * Start/end guard pattern.
 */
const int ZX_UPC_EAN_START_END_PATTERN_LEN = 3;
const int ZX_UPC_EAN_START_END_PATTERN[ZX_UPC_EAN_START_END_PATTERN_LEN] = {1, 1, 1};

/**
 * Pattern marking the middle of a UPC/EAN pattern, separating the two halves.
 */
const int ZX_UPC_EAN_MIDDLE_PATTERN_LEN = 5;
const int ZX_UPC_EAN_MIDDLE_PATTERN[ZX_UPC_EAN_MIDDLE_PATTERN_LEN] = {1, 1, 1, 1, 1};

/**
 * "Odd", or "L" patterns used to encode UPC/EAN digits.
 */
const int ZX_UPC_EAN_L_PATTERNS_LEN = 10;
const int ZX_UPC_EAN_L_PATTERNS_SUB_LEN = 4;
const int ZX_UPC_EAN_L_PATTERNS[ZX_UPC_EAN_L_PATTERNS_LEN][ZX_UPC_EAN_L_PATTERNS_SUB_LEN] = {
  {3, 2, 1, 1}, // 0
  {2, 2, 2, 1}, // 1
  {2, 1, 2, 2}, // 2
  {1, 4, 1, 1}, // 3
  {1, 1, 3, 2}, // 4
  {1, 2, 3, 1}, // 5
  {1, 1, 1, 4}, // 6
  {1, 3, 1, 2}, // 7
  {1, 2, 1, 3}, // 8
  {3, 1, 1, 2}  // 9
};

/**
 * As above but also including the "even", or "G" patterns used to encode UPC/EAN digits.
 */
const int ZX_UPC_EAN_L_AND_G_PATTERNS_LEN = 20;
const int ZX_UPC_EAN_L_AND_G_PATTERNS_SUB_LEN = 4;
const int ZX_UPC_EAN_L_AND_G_PATTERNS[ZX_UPC_EAN_L_AND_G_PATTERNS_LEN][ZX_UPC_EAN_L_AND_G_PATTERNS_SUB_LEN] = {
  {3, 2, 1, 1}, // 0
  {2, 2, 2, 1}, // 1
  {2, 1, 2, 2}, // 2
  {1, 4, 1, 1}, // 3
  {1, 1, 3, 2}, // 4
  {1, 2, 3, 1}, // 5
  {1, 1, 1, 4}, // 6
  {1, 3, 1, 2}, // 7
  {1, 2, 1, 3}, // 8
  {3, 1, 1, 2}, // 9
  {1, 1, 2, 3}, // 10 reversed 0
  {1, 2, 2, 2}, // 11 reversed 1
  {2, 2, 1, 2}, // 12 reversed 2
  {1, 1, 4, 1}, // 13 reversed 3
  {2, 3, 1, 1}, // 14 reversed 4
  {1, 3, 2, 1}, // 15 reversed 5
  {4, 1, 1, 1}, // 16 reversed 6
  {2, 1, 3, 1}, // 17 reversed 7
  {3, 1, 2, 1}, // 18 reversed 8
  {2, 1, 1, 3}  // 19 reversed 9
};

@interface ZXUPCEANReader ()

@property (nonatomic, strong, readonly) NSMutableString *decodeRowNSMutableString;
@property (nonatomic, strong, readonly) ZXUPCEANExtensionSupport *extensionReader;
@property (nonatomic, strong, readonly) ZXEANManufacturerOrgSupport *eanManSupport;

@end

@implementation ZXUPCEANReader

- (id)init {
  if (self = [super init]) {
    _decodeRowNSMutableString = [NSMutableString stringWithCapacity:20];
    _extensionReader = [[ZXUPCEANExtensionSupport alloc] init];
    _eanManSupport = [[ZXEANManufacturerOrgSupport alloc] init];
  }

  return self;
}

+ (NSRange)findStartGuardPattern:(ZXBitArray *)row error:(NSError **)error {
  BOOL foundStart = NO;
  NSRange startRange = NSMakeRange(NSNotFound, 0);
  int nextStart = 0;
  ZXIntArray *counters = [[ZXIntArray alloc] initWithLength:ZX_UPC_EAN_START_END_PATTERN_LEN];
  while (!foundStart) {
    [counters clear];
    startRange = [self findGuardPattern:row rowOffset:nextStart
                             whiteFirst:NO
                                pattern:ZX_UPC_EAN_START_END_PATTERN
                             patternLen:ZX_UPC_EAN_START_END_PATTERN_LEN
                               counters:counters
                                  error:error];
    if (startRange.location == NSNotFound) {
      return startRange;
    }
    int start = (int)startRange.location;
    nextStart = (int)NSMaxRange(startRange);
    // Make sure there is a quiet zone at least as big as the start pattern before the barcode.
    // If this check would run off the left edge of the image, do not accept this barcode,
    // as it is very likely to be a false positive.
    int quietStart = start - (nextStart - start);
    if (quietStart >= 0) {
      foundStart = [row isRange:quietStart end:start value:NO];
    }
  }
  return startRange;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row hints:(ZXDecodeHints *)hints error:(NSError **)error {
  return [self decodeRow:rowNumber row:row startGuardRange:[[self class] findStartGuardPattern:row error:error] hints:hints error:error];
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row startGuardRange:(NSRange)startGuardRange hints:(ZXDecodeHints *)hints error:(NSError **)error {
  id<ZXResultPointCallback> resultPointCallback = hints == nil ? nil : hints.resultPointCallback;

  if (resultPointCallback != nil) {
    [resultPointCallback foundPossibleResultPoint:[[ZXResultPoint alloc] initWithX:(startGuardRange.location + NSMaxRange(startGuardRange)) / 2.0f y:rowNumber]];
  }

  NSMutableString *result = [NSMutableString string];
  int endStart = [self decodeMiddle:row startRange:startGuardRange result:result error:error];
  if (endStart == -1) {
    return nil;
  }

  if (resultPointCallback != nil) {
    [resultPointCallback foundPossibleResultPoint:[[ZXResultPoint alloc] initWithX:endStart y:rowNumber]];
  }

  NSRange endRange = [self decodeEnd:row endStart:endStart error:error];
  if (endRange.location == NSNotFound) {
    return nil;
  }

  if (resultPointCallback != nil) {
    [resultPointCallback foundPossibleResultPoint:[[ZXResultPoint alloc] initWithX:(endRange.location + NSMaxRange(endRange)) / 2.0f y:rowNumber]];
  }

  // Make sure there is a quiet zone at least as big as the end pattern after the barcode. The
  // spec might want more whitespace, but in practice this is the maximum we can count on.
  int end = (int)NSMaxRange(endRange);
  int quietEnd = end + (end - (int)endRange.location);
  if (quietEnd >= [row size] || ![row isRange:end end:quietEnd value:NO]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  NSString *resultString = [result description];
  // UPC/EAN should never be less than 8 chars anyway
  if ([resultString length] < 8) {
    if (error) *error = ZXFormatErrorInstance();
    return nil;
  }
  if (![self checkChecksum:resultString error:error]) {
    if (error) *error = ZXChecksumErrorInstance();
    return nil;
  }

  float left = (float)(NSMaxRange(startGuardRange) + startGuardRange.location) / 2.0f;
  float right = (float)(NSMaxRange(endRange) + endRange.location) / 2.0f;
  ZXBarcodeFormat format = [self barcodeFormat];

  ZXResult *decodeResult = [ZXResult resultWithText:resultString
                                           rawBytes:nil
                                       resultPoints:@[[[ZXResultPoint alloc] initWithX:left y:(float)rowNumber], [[ZXResultPoint alloc] initWithX:right y:(float)rowNumber]]
                                             format:format];

  int extensionLength = 0;

  ZXResult *extensionResult = [self.extensionReader decodeRow:rowNumber row:row rowOffset:(int)NSMaxRange(endRange) error:error];
  if (extensionResult) {
    [decodeResult putMetadata:kResultMetadataTypeUPCEANExtension value:extensionResult.text];
    [decodeResult putAllMetadata:[extensionResult resultMetadata]];
    [decodeResult addResultPoints:[extensionResult resultPoints]];
    extensionLength = (int)[extensionResult.text length];
  }

  ZXIntArray *allowedExtensions = hints == nil ? nil : hints.allowedEANExtensions;
  if (allowedExtensions != nil) {
    BOOL valid = NO;
    for (int i = 0; i < allowedExtensions.length; i++) {
      if (extensionLength == allowedExtensions.array[i]) {
        valid = YES;
        break;
      }
    }
    if (!valid) {
      if (error) *error = ZXNotFoundErrorInstance();
      return nil;
    }
  }

  if (format == kBarcodeFormatEan13 || format == kBarcodeFormatUPCA) {
    NSString *countryID = [self.eanManSupport lookupCountryIdentifier:resultString];
    if (countryID != nil) {
      [decodeResult putMetadata:kResultMetadataTypePossibleCountry value:countryID];
    }
  }
  return decodeResult;
}

- (BOOL)checkChecksum:(NSString *)s error:(NSError **)error {
  if ([[self class] checkStandardUPCEANChecksum:s]) {
    return YES;
  } else {
    if (error) *error = ZXFormatErrorInstance();
    return NO;
  }
}

+ (BOOL)checkStandardUPCEANChecksum:(NSString *)s {
  int length = (int)[s length];
  if (length == 0) {
    return NO;
  }
  int check = [[s substringWithRange:NSMakeRange((length - 1), 1)] intValue];
  return [self standardUPCEANChecksum:[s substringWithRange:NSMakeRange(0, length - 1)]] == check;
}

+ (int)standardUPCEANChecksum:(NSString *)s {
  int length = (int)[s length];
  int sum = 0;

  for (int i = length - 1; i >= 0; i -= 2) {
    int digit = (int)[s characterAtIndex:i] - (int)'0';
    if (digit < 0 || digit > 9) {
      return NO;
    }
    sum += digit;
  }

  sum *= 3;

  for (int i = length - 2; i >= 0; i -= 2) {
    int digit = (int)[s characterAtIndex:i] - (int)'0';
    if (digit < 0 || digit > 9) {
      return NO;
    }
    sum += digit;
  }

  return (1000 - sum) % 10;
}

- (NSRange)decodeEnd:(ZXBitArray *)row endStart:(int)endStart error:(NSError **)error {
  return [[self class] findGuardPattern:row
                              rowOffset:endStart
                             whiteFirst:NO
                                pattern:ZX_UPC_EAN_START_END_PATTERN
                             patternLen:ZX_UPC_EAN_START_END_PATTERN_LEN
                                  error:error];
}

+ (NSRange)findGuardPattern:(ZXBitArray *)row rowOffset:(int)rowOffset whiteFirst:(BOOL)whiteFirst pattern:(const int[])pattern patternLen:(int)patternLen error:(NSError **)error {
  ZXIntArray *counters = [[ZXIntArray alloc] initWithLength:patternLen];
  return [self findGuardPattern:row rowOffset:rowOffset whiteFirst:whiteFirst pattern:pattern patternLen:patternLen counters:counters error:error];
}

+ (NSRange)findGuardPattern:(ZXBitArray *)row rowOffset:(int)rowOffset whiteFirst:(BOOL)whiteFirst pattern:(const int[])pattern patternLen:(int)patternLen counters:(ZXIntArray *)counters error:(NSError **)error {
  int patternLength = patternLen;
  int width = row.size;
  BOOL isWhite = whiteFirst;
  rowOffset = whiteFirst ? [row nextUnset:rowOffset] : [row nextSet:rowOffset];
  int counterPosition = 0;
  int patternStart = rowOffset;
  int32_t *array = counters.array;
  for (int x = rowOffset; x < width; x++) {
    if ([row get:x] ^ isWhite) {
      array[counterPosition]++;
    } else {
      if (counterPosition == patternLength - 1) {
        if ([self patternMatchVariance:counters pattern:pattern maxIndividualVariance:ZX_UPC_EAN_MAX_INDIVIDUAL_VARIANCE] < ZX_UPC_EAN_MAX_AVG_VARIANCE) {
          return NSMakeRange(patternStart, x - patternStart);
        }
        patternStart += array[0] + array[1];

        for (int y = 2; y < patternLength; y++) {
          array[y - 2] = array[y];
        }

        array[patternLength - 2] = 0;
        array[patternLength - 1] = 0;
        counterPosition--;
      } else {
        counterPosition++;
      }
      array[counterPosition] = 1;
      isWhite = !isWhite;
    }
  }

  if (error) *error = ZXNotFoundErrorInstance();
  return NSMakeRange(NSNotFound, 0);
}

/**
 * Attempts to decode a single UPC/EAN-encoded digit.
 */
+ (int)decodeDigit:(ZXBitArray *)row counters:(ZXIntArray *)counters rowOffset:(int)rowOffset patternType:(ZX_UPC_EAN_PATTERNS)patternType error:(NSError **)error {
  if (![self recordPattern:row start:rowOffset counters:counters]) {
    if (error) *error = ZXNotFoundErrorInstance();
    return -1;
  }
  float bestVariance = ZX_UPC_EAN_MAX_AVG_VARIANCE;
  int bestMatch = -1;
  int max = 0;
  switch (patternType) {
    case ZX_UPC_EAN_PATTERNS_L_PATTERNS:
      max = ZX_UPC_EAN_L_PATTERNS_LEN;
      for (int i = 0; i < max; i++) {
        int pattern[counters.length];
        for (int j = 0; j < counters.length; j++){
          pattern[j] = ZX_UPC_EAN_L_PATTERNS[i][j];
        }

        float variance = [self patternMatchVariance:counters pattern:pattern maxIndividualVariance:ZX_UPC_EAN_MAX_INDIVIDUAL_VARIANCE];
        if (variance < bestVariance) {
          bestVariance = variance;
          bestMatch = i;
        }
      }
      break;
    case ZX_UPC_EAN_PATTERNS_L_AND_G_PATTERNS:
      max = ZX_UPC_EAN_L_AND_G_PATTERNS_LEN;
      for (int i = 0; i < max; i++) {
        int pattern[counters.length];
        for (int j = 0; j< counters.length; j++){
          pattern[j] = ZX_UPC_EAN_L_AND_G_PATTERNS[i][j];
        }

        float variance = [self patternMatchVariance:counters pattern:pattern maxIndividualVariance:ZX_UPC_EAN_MAX_INDIVIDUAL_VARIANCE];
        if (variance < bestVariance) {
          bestVariance = variance;
          bestMatch = i;
        }
      }
      break;
    default:
      break;
  }

  if (bestMatch >= 0) {
    return bestMatch;
  } else {
    if (error) *error = ZXNotFoundErrorInstance();
    return -1;
  }
}

- (ZXBarcodeFormat)barcodeFormat {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

- (int)decodeMiddle:(ZXBitArray *)row startRange:(NSRange)startRange result:(NSMutableString *)result error:(NSError **)error {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

@end
