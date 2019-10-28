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

#import "ZXExpandedProductResultParser.h"
#import "ZXExpandedProductParsedResult.h"
#import "ZXResult.h"

@implementation ZXExpandedProductResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  ZXBarcodeFormat format = [result barcodeFormat];
  if (kBarcodeFormatRSSExpanded != format) {
    // ExtendedProductParsedResult NOT created. Not a RSS Expanded barcode
    return nil;
  }
  NSString *rawText = [ZXResultParser massagedText:result];

  NSString *productID = nil;
  NSString *sscc = nil;
  NSString *lotNumber = nil;
  NSString *productionDate = nil;
  NSString *packagingDate = nil;
  NSString *bestBeforeDate = nil;
  NSString *expirationDate = nil;
  NSString *weight = nil;
  NSString *weightType = nil;
  NSString *weightIncrement = nil;
  NSString *price = nil;
  NSString *priceIncrement = nil;
  NSString *priceCurrency = nil;
  NSMutableDictionary *uncommonAIs = [NSMutableDictionary dictionary];

  int i = 0;

  while (i < [rawText length]) {
    NSString *ai = [self findAIvalue:i rawText:rawText];
    if (ai == nil) {
      // Error. Code doesn't match with RSS expanded pattern
      // ExtendedProductParsedResult NOT created. Not match with RSS Expanded pattern
      return nil;
    }
    i += [ai length] + 2;
    NSString *value = [self findValue:i rawText:rawText];
    i += [value length];

    if ([@"00" isEqualToString:ai]) {
      sscc = value;
    } else if ([@"01" isEqualToString:ai]) {
      productID = value;
    } else if ([@"10" isEqualToString:ai]) {
      lotNumber = value;
    } else if ([@"11" isEqualToString:ai]) {
      productionDate = value;
    } else if ([@"13" isEqualToString:ai]) {
      packagingDate = value;
    } else if ([@"15" isEqualToString:ai]) {
      bestBeforeDate = value;
    } else if ([@"17" isEqualToString:ai]) {
      expirationDate = value;
    } else if ([@"3100" isEqualToString:ai] || [@"3101" isEqualToString:ai] || [@"3102" isEqualToString:ai] || [@"3103" isEqualToString:ai] || [@"3104" isEqualToString:ai] || [@"3105" isEqualToString:ai] || [@"3106" isEqualToString:ai] || [@"3107" isEqualToString:ai] || [@"3108" isEqualToString:ai] || [@"3109" isEqualToString:ai]) {
      weight = value;
      weightType = ZX_KILOGRAM;
      weightIncrement = [ai substringFromIndex:3];
    } else if ([@"3200" isEqualToString:ai] || [@"3201" isEqualToString:ai] || [@"3202" isEqualToString:ai] || [@"3203" isEqualToString:ai] || [@"3204" isEqualToString:ai] || [@"3205" isEqualToString:ai] || [@"3206" isEqualToString:ai] || [@"3207" isEqualToString:ai] || [@"3208" isEqualToString:ai] || [@"3209" isEqualToString:ai]) {
      weight = value;
      weightType = ZX_POUND;
      weightIncrement = [ai substringFromIndex:3];
    } else if ([@"3920" isEqualToString:ai] || [@"3921" isEqualToString:ai] || [@"3922" isEqualToString:ai] || [@"3923" isEqualToString:ai]) {
      price = value;
      priceIncrement = [ai substringFromIndex:3];
    } else if ([@"3930" isEqualToString:ai] || [@"3931" isEqualToString:ai] || [@"3932" isEqualToString:ai] || [@"3933" isEqualToString:ai]) {
      if ([value length] < 4) {
        // The value must have more of 3 symbols (3 for currency and
        // 1 at least for the price)
        // ExtendedProductParsedResult NOT created. Not match with RSS Expanded pattern
        return nil;
      }
      price = [value substringFromIndex:3];
      priceCurrency = [value substringToIndex:3];
      priceIncrement = [ai substringFromIndex:3];
    } else {
      // No match with common AIs
      uncommonAIs[ai] = value;
    }
  }

  return [ZXExpandedProductParsedResult expandedProductParsedResultWithRawText:rawText
                                                                     productID:productID
                                                                          sscc:sscc
                                                                     lotNumber:lotNumber
                                                                productionDate:productionDate
                                                                 packagingDate:packagingDate
                                                                bestBeforeDate:bestBeforeDate
                                                                expirationDate:expirationDate
                                                                        weight:weight
                                                                    weightType:weightType
                                                               weightIncrement:weightIncrement
                                                                         price:price
                                                                priceIncrement:priceIncrement
                                                                 priceCurrency:priceCurrency
                                                                   uncommonAIs:uncommonAIs];
}

- (NSString *)findAIvalue:(int)i rawText:(NSString *)rawText {
  unichar c = [rawText characterAtIndex:i];
  // First character must be a open parenthesis.If not, ERROR
  if (c != '(') {
    return nil;
  }

  NSString *rawTextAux = [rawText substringFromIndex:i + 1];

  NSMutableString *buf = [NSMutableString string];
  for (int index = 0; index < [rawTextAux length]; index++) {
    unichar currentChar = [rawTextAux characterAtIndex:index];
    if (currentChar == ')') {
      return buf;
    } else if (currentChar >= '0' && currentChar <= '9') {
      [buf appendFormat:@"%C", currentChar];
    } else {
      return nil;
    }
  }
  return buf;
}

- (NSString *)findValue:(int)i rawText:(NSString *)rawText {
  NSMutableString *buf = [NSMutableString string];
  NSString *rawTextAux = [rawText substringFromIndex:i];

  for (int index = 0; index < [rawTextAux length]; index++) {
    unichar c = [rawTextAux characterAtIndex:index];
    if (c == '(') {
      // We look for a new AI. If it doesn't exist (ERROR), we coninue
      // with the iteration
      if ([self findAIvalue:index rawText:rawTextAux] == nil) {
        [buf appendString:@"("];
      } else {
        break;
      }
    } else {
      [buf appendFormat:@"%C", c];
    }
  }

  return buf;
}

@end
