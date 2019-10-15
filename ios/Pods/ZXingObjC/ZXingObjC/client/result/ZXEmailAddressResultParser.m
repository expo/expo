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

#import "ZXEmailAddressParsedResult.h"
#import "ZXEmailAddressResultParser.h"
#import "ZXEmailDoCoMoResultParser.h"
#import "ZXResult.h"

static NSCharacterSet *ZX_EMAIL_ADDRESS_RESULT_COMMA = nil;

@implementation ZXEmailAddressResultParser

+ (void)initialize {
  if ([self class] != [ZXEmailAddressResultParser class]) return;

  ZX_EMAIL_ADDRESS_RESULT_COMMA = [NSCharacterSet characterSetWithCharactersInString:@","];
}

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if ([rawText hasPrefix:@"mailto:"] || [rawText hasPrefix:@"MAILTO:"]) {
    // If it starts with mailto:, assume it is definitely trying to be an email address
    NSString *hostEmail = [rawText substringFromIndex:7];
    NSUInteger queryStart = [hostEmail rangeOfString:@"?"].location;
    if (queryStart != NSNotFound) {
      hostEmail = [hostEmail substringToIndex:queryStart];
    }
    hostEmail = [[self class] urlDecode:hostEmail];
    NSArray *tos;
    if (hostEmail.length > 0) {
      tos = [hostEmail componentsSeparatedByCharactersInSet:ZX_EMAIL_ADDRESS_RESULT_COMMA];
    }
    NSMutableDictionary *nameValues = [self parseNameValuePairs:rawText];
    NSArray *ccs;
    NSArray *bccs;
    NSString *subject = nil;
    NSString *body = nil;
    if (nameValues != nil) {
      if (!tos) {
        NSString *tosString = nameValues[@"to"];
        if (tosString) {
          tos = [tosString componentsSeparatedByCharactersInSet:ZX_EMAIL_ADDRESS_RESULT_COMMA];
        }
      }
      NSString *ccString = nameValues[@"cc"];
      if (ccString) {
        ccs = [ccString componentsSeparatedByCharactersInSet:ZX_EMAIL_ADDRESS_RESULT_COMMA];
      }
      NSString *bccString = nameValues[@"bcc"];
      if (bccString) {
        bccs = [bccString componentsSeparatedByCharactersInSet:ZX_EMAIL_ADDRESS_RESULT_COMMA];
      }
      subject = nameValues[@"subject"];
      body = nameValues[@"body"];
    }
    return [[ZXEmailAddressParsedResult alloc] initWithTos:tos ccs:ccs bccs:bccs subject:subject body:body];
  } else {
    if (![ZXEmailDoCoMoResultParser isBasicallyValidEmailAddress:rawText]) {
      return nil;
    }
    return [[ZXEmailAddressParsedResult alloc] initWithTo:rawText];
  }
}

@end
