/*
 * Copyright 2014 ZXing authors
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

#import "ZXVINParsedResult.h"
#import "ZXVINResultParser.h"

static NSRegularExpression *ZX_IOQ = nil;
static NSRegularExpression *ZX_AZ09 = nil;

@implementation ZXVINResultParser

+ (void)initialize {
  if ([self class] != [ZXVINResultParser class]) return;

  ZX_IOQ = [[NSRegularExpression alloc] initWithPattern:@"[IOQ]" options:0 error:nil];
  ZX_AZ09 = [[NSRegularExpression alloc] initWithPattern:@"[A-Z0-9]{17}" options:0 error:nil];
}

- (ZXVINParsedResult *)parse:(ZXResult *)result {
  if (result.barcodeFormat != kBarcodeFormatCode39) {
    return nil;
  }
  NSString *rawText = result.text;
  rawText = [[ZX_IOQ stringByReplacingMatchesInString:rawText options:0 range:NSMakeRange(0, rawText.length) withTemplate:@""] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if ([ZX_AZ09 matchesInString:rawText options:0 range:NSMakeRange(0, rawText.length)] == 0) {
    return nil;
  }
  if (![self checkChecksum:rawText]) {
    return nil;
  }

  int modelYear = [self modelYear:[rawText characterAtIndex:9]];
  if (modelYear == -1) {
    return nil;
  }

  NSString *wmi = [rawText substringToIndex:3];
  return [[ZXVINParsedResult alloc] initWithVIN:rawText
                            worldManufacturerID:wmi
                       vehicleDescriptorSection:[rawText substringWithRange:NSMakeRange(3, 6)]
                       vehicleIdentifierSection:[rawText substringWithRange:NSMakeRange(9, 8)]
                                    countryCode:[self countryCode:wmi]
                              vehicleAttributes:[rawText substringWithRange:NSMakeRange(3, 5)]
                                      modelYear:modelYear
                                      plantCode:[rawText characterAtIndex:10]
                               sequentialNumber:[rawText substringFromIndex:11]];
}

- (BOOL)checkChecksum:(NSString *)vin {
  int sum = 0;
  for (int i = 0; i < [vin length]; i++) {
    int vinPositionWeight = [self vinPositionWeight:i + 1];
    if (vinPositionWeight == -1) {
      return NO;
    }
    int vinCharValue = [self vinCharValue:[vin characterAtIndex:i]];
    if (vinCharValue == -1) {
      return NO;
    }
    sum += vinPositionWeight * vinCharValue;
  }
  unichar checkChar = [vin characterAtIndex:8];
  if (checkChar == '\0') {
    return NO;
  }
  unichar expectedCheckChar = [self checkChar:sum % 11];
  return checkChar == expectedCheckChar;
}

- (int)vinCharValue:(unichar)c {
  if (c >= 'A' && c <= 'I') {
    return (c - 'A') + 1;
  }
  if (c >= 'J' && c <= 'R') {
    return (c - 'J') + 1;
  }
  if (c >= 'S' && c <= 'Z') {
    return (c - 'S') + 2;
  }
  if (c >= '0' && c <= '9') {
    return c - '0';
  }
  return -1;
}

- (int)vinPositionWeight:(int)position {
  if (position >= 1 && position <= 7) {
    return 9 - position;
  }
  if (position == 8) {
    return 10;
  }
  if (position == 9) {
    return 0;
  }
  if (position >= 10 && position <= 17) {
    return 19 - position;
  }
  return -1;
}

- (unichar)checkChar:(int)remainder {
  if (remainder < 10) {
    return (unichar) ('0' + remainder);
  }
  if (remainder == 10) {
    return 'X';
  }
  return '\0';
}

- (int)modelYear:(unichar)c {
  if (c >= 'E' && c <= 'H') {
    return (c - 'E') + 1984;
  }
  if (c >= 'J' && c <= 'N') {
    return (c - 'J') + 1988;
  }
  if (c == 'P') {
    return 1993;
  }
  if (c >= 'R' && c <= 'T') {
    return (c - 'R') + 1994;
  }
  if (c >= 'V' && c <= 'Y') {
    return (c - 'V') + 1997;
  }
  if (c >= '1' && c <= '9') {
    return (c - '1') + 2001;
  }
  if (c >= 'A' && c <= 'D') {
    return (c - 'A') + 2010;
  }
  return -1;
}

- (NSString *)countryCode:(NSString *)wmi {
  unichar c1 = [wmi characterAtIndex:0];
  unichar c2 = [wmi characterAtIndex:1];
  switch (c1) {
    case '1':
    case '4':
    case '5':
      return @"US";
    case '2':
      return @"CA";
    case '3':
      if (c2 >= 'A' && c2 <= 'W') {
        return @"MX";
      }
      break;
    case '9':
      if ((c2 >= 'A' && c2 <= 'E') || (c2 >= '3' && c2 <= '9')) {
        return @"BR";
      }
      break;
    case 'J':
      if (c2 >= 'A' && c2 <= 'T') {
        return @"JP";
      }
      break;
    case 'K':
      if (c2 >= 'L' && c2 <= 'R') {
        return @"KO";
      }
      break;
    case 'L':
      return @"CN";
    case 'M':
      if (c2 >= 'A' && c2 <= 'E') {
        return @"IN";
      }
      break;
    case 'S':
      if (c2 >= 'A' && c2 <= 'M') {
        return @"UK";
      }
      if (c2 >= 'N' && c2 <= 'T') {
        return @"DE";
      }
      break;
    case 'V':
      if (c2 >= 'F' && c2 <= 'R') {
        return @"FR";
      }
      if (c2 >= 'S' && c2 <= 'W') {
        return @"ES";
      }
      break;
    case 'W':
      return @"DE";
    case 'X':
      if (c2 == '0' || (c2 >= '3' && c2 <= '9')) {
        return @"RU";
      }
      break;
    case 'Z':
      if (c2 >= 'A' && c2 <= 'R') {
        return @"IT";
      }
      break;
  }
  return nil;
}

@end
