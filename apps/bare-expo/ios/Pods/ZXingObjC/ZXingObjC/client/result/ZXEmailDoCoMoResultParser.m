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
#import "ZXEmailDoCoMoResultParser.h"
#import "ZXResult.h"

static NSRegularExpression *ZX_ATEXT_ALPHANUMERIC = nil;

@implementation ZXEmailDoCoMoResultParser

+ (void)initialize {
  if ([self class] != [ZXEmailDoCoMoResultParser class]) return;

  ZX_ATEXT_ALPHANUMERIC = [[NSRegularExpression alloc] initWithPattern:@"^[a-zA-Z0-9@.!#$%&'*+\\-/=?^_`{|}~]+$"
                                                               options:0 error:nil];
}

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (![rawText hasPrefix:@"MATMSG:"]) {
    return nil;
  }
  NSArray *tos = [[self class] matchDoCoMoPrefixedField:@"TO:" rawText:rawText trim:YES];
  if (tos == nil) {
    return nil;
  }
  for (NSString *to in tos) {
    if (![[self class] isBasicallyValidEmailAddress:to]) {
      return nil;
    }
  }
  NSString *subject = [[self class] matchSingleDoCoMoPrefixedField:@"SUB:" rawText:rawText trim:NO];
  NSString *body = [[self class] matchSingleDoCoMoPrefixedField:@"BODY:" rawText:rawText trim:NO];

  return [[ZXEmailAddressParsedResult alloc] initWithTos:tos ccs:nil bccs:nil subject:subject body:body];
}

+ (BOOL)isBasicallyValidEmailAddress:(NSString *)email {
  return email != nil && [ZX_ATEXT_ALPHANUMERIC numberOfMatchesInString:email options:0 range:NSMakeRange(0, email.length)] > 0 && [email rangeOfString:@"@"].location != NSNotFound;
}

@end
