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

#import "ZXBarcodeFormat.h"
#import "ZXBitArray.h"
#import "ZXErrors.h"
#import "ZXIntArray.h"
#import "ZXResult.h"
#import "ZXResultMetadataType.h"
#import "ZXResultPoint.h"
#import "ZXUPCEANExtension5Support.h"
#import "ZXUPCEANReader.h"

const int ZX_UPCEAN_CHECK_DIGIT_ENCODINGS[] = {
  0x18, 0x14, 0x12, 0x11, 0x0C, 0x06, 0x03, 0x0A, 0x09, 0x05
};

@interface ZXUPCEANExtension5Support ()

@property (nonatomic, strong, readonly) ZXIntArray *decodeMiddleCounters;

@end

@implementation ZXUPCEANExtension5Support

- (id)init {
  if (self = [super init]) {
    _decodeMiddleCounters = [[ZXIntArray alloc] initWithLength:4];
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row extensionStartRange:(NSRange)extensionStartRange error:(NSError **)error {
  NSMutableString *resultString = [NSMutableString string];
  int end = [self decodeMiddle:row startRange:extensionStartRange result:resultString error:error];
  if (end == -1) {
    return nil;
  }

  NSMutableDictionary *extensionData = [self parseExtensionString:resultString];

  ZXResult *extensionResult = [[ZXResult alloc] initWithText:resultString
                                                     rawBytes:nil
                                                 resultPoints:@[[[ZXResultPoint alloc] initWithX:(extensionStartRange.location + NSMaxRange(extensionStartRange)) / 2.0f y:rowNumber],
                                                                [[ZXResultPoint alloc] initWithX:end y:rowNumber]]
                                                       format:kBarcodeFormatUPCEANExtension];
  if (extensionData != nil) {
    [extensionResult putAllMetadata:extensionData];
  }
  return extensionResult;
}

- (int)decodeMiddle:(ZXBitArray *)row startRange:(NSRange)startRange result:(NSMutableString *)result error:(NSError **)error {
  ZXIntArray *counters = self.decodeMiddleCounters;
  [counters clear];

  int end = [row size];
  int rowOffset = (int)NSMaxRange(startRange);

  int lgPatternFound = 0;

  for (int x = 0; x < 5 && rowOffset < end; x++) {
    int bestMatch = [ZXUPCEANReader decodeDigit:row counters:counters rowOffset:rowOffset patternType:ZX_UPC_EAN_PATTERNS_L_AND_G_PATTERNS error:error];
    if (bestMatch == -1) {
      return -1;
    }
    [result appendFormat:@"%C", (unichar)('0' + bestMatch % 10)];
    rowOffset += [counters sum];
    if (bestMatch >= 10) {
      lgPatternFound |= 1 << (4 - x);
    }
    if (x != 4) {
      // Read off separator if not last
      rowOffset = [row nextSet:rowOffset];
      rowOffset = [row nextUnset:rowOffset];
    }
  }

  if (result.length != 5) {
    if (error) *error = ZXNotFoundErrorInstance();
    return -1;
  }

  int checkDigit = [self determineCheckDigit:lgPatternFound];
  if (checkDigit == -1) {
    if (error) *error = ZXNotFoundErrorInstance();
    return -1;
  } else if ([self extensionChecksum:result] != checkDigit) {
    if (error) *error = ZXNotFoundErrorInstance();
    return -1;
  }

  return rowOffset;
}

- (int)extensionChecksum:(NSString *)s {
  int length = (int)[s length];
  int sum = 0;
  for (int i = length - 2; i >= 0; i -= 2) {
    sum += (int)[s characterAtIndex:i] - (int)'0';
  }
  sum *= 3;
  for (int i = length - 1; i >= 0; i -= 2) {
    sum += (int)[s characterAtIndex:i] - (int)'0';
  }
  sum *= 3;
  return sum % 10;
}

- (int)determineCheckDigit:(int)lgPatternFound {
  for (int d = 0; d < 10; d++) {
    if (lgPatternFound == ZX_UPCEAN_CHECK_DIGIT_ENCODINGS[d]) {
      return d;
    }
  }
  return -1;
}

/**
 * @param raw raw content of extension
 * @return formatted interpretation of raw content as a NSDictionary mapping
 *  one ZXResultMetadataType to appropriate value, or nil if not known
 */
- (NSMutableDictionary *)parseExtensionString:(NSString *)raw {
  if (raw.length != 5) {
    return nil;
  }
  id value = [self parseExtension5String:raw];
  if (value) {
    return [NSMutableDictionary dictionaryWithObject:value forKey:@(kResultMetadataTypeSuggestedPrice)];
  } else {
    return nil;
  }
}

- (NSString *)parseExtension5String:(NSString *)raw {
  NSString *currency;
  switch ([raw characterAtIndex:0]) {
    case '0':
      currency = @"£";
      break;
    case '5':
      currency = @"$";
      break;
    case '9':
      if ([@"90000" isEqualToString:raw]) {
        return nil;
      }
      if ([@"99991" isEqualToString:raw]) {
        return @"0.00";
      }
      if ([@"99990" isEqualToString:raw]) {
        return @"Used";
      }
      currency = @"";
      break;
    default:
      currency = @"";
      break;
  }
  int rawAmount = [[raw substringFromIndex:1] intValue];
  NSString *unitsString = [@(rawAmount / 100) stringValue];
  int hundredths = rawAmount % 100;
  NSString *hundredthsString = hundredths < 10 ?
  [NSString stringWithFormat:@"0%d", hundredths] : [@(hundredths) stringValue];
  return [NSString stringWithFormat:@"%@%@.%@", currency, unitsString, hundredthsString];
}

@end
