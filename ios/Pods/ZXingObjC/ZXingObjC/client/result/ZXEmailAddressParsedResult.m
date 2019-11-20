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
#import "ZXParsedResultType.h"

@implementation ZXEmailAddressParsedResult

- (id)initWithTo:(NSString *)to {
  return [self initWithTos:@[to] ccs:nil bccs:nil subject:nil body:nil];
}

- (id)initWithTos:(NSArray *)tos
              ccs:(NSArray *)ccs
             bccs:(NSArray *)bccs
          subject:(NSString *)subject
             body:(NSString *)body {
  if (self = [super initWithType:kParsedResultTypeEmailAddress]) {
    _tos = tos;
    _ccs = ccs;
    _bccs = bccs;
    _subject = subject;
    _body = body;
  }

  return self;
}

- (NSString *)emailAddress {
  return !self.tos || self.tos.count == 0 ? nil : self.tos[0];
}

- (NSString *)mailtoURI {
  return @"mailto:";
}

- (NSString *)displayResult {
  NSMutableString *result = [NSMutableString stringWithCapacity:30];
  [ZXParsedResult maybeAppendArray:self.tos result:result];
  [ZXParsedResult maybeAppendArray:self.ccs result:result];
  [ZXParsedResult maybeAppendArray:self.bccs result:result];
  [ZXParsedResult maybeAppend:self.subject result:result];
  [ZXParsedResult maybeAppend:self.body result:result];
  return result;
}

@end
