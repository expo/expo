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
#import "ZXResult.h"
#import "ZXSMTPResultParser.h"

@implementation ZXSMTPResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (!([rawText hasPrefix:@"smtp:"] || [rawText hasPrefix:@"SMTP:"])) {
    return nil;
  }
  NSString *emailAddress = [rawText substringFromIndex:5];
  NSString *subject = nil;
  NSString *body = nil;
  NSUInteger colon = [emailAddress rangeOfString:@":"].location;
  if (colon != NSNotFound) {
    subject = [emailAddress substringFromIndex:colon + 1];
    emailAddress = [emailAddress substringToIndex:colon];
    colon = [subject rangeOfString:@":"].location;
    if (colon != NSNotFound) {
      body = [subject substringFromIndex:colon + 1];
      subject = [subject substringToIndex:colon];
    }
  }
  return [[ZXEmailAddressParsedResult alloc] initWithTos:@[emailAddress] ccs:nil bccs:nil subject:subject body:body];
}

@end
