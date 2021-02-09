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

#import "ZXSMSParsedResult.h"

@implementation ZXSMSParsedResult

- (id)initWithNumber:(NSString *)number via:(NSString *)via subject:(NSString *)subject body:(NSString *)body {
  NSArray *numbers;
  if (number) {
    numbers = @[number];
  }

  NSArray *vias;
  if (via) {
    vias = @[via];
  }

  return [self initWithNumbers:numbers vias:vias subject:subject body:body];
}

- (id)initWithNumbers:(NSArray *)numbers vias:(NSArray *)vias subject:(NSString *)subject body:(NSString *)body {
  if (self = [super initWithType:kParsedResultTypeSMS]) {
    _numbers = numbers;
    _vias = vias;
    _subject = subject;
    _body = body;
  }

  return self;
}

+ (id)smsParsedResultWithNumber:(NSString *)number via:(NSString *)via subject:(NSString *)subject body:(NSString *)body {
  return [[self alloc] initWithNumber:number via:via subject:subject body:body];
}

+ (id)smsParsedResultWithNumbers:(NSArray *)numbers vias:(NSArray *)vias subject:(NSString *)subject body:(NSString *)body {
  return [[self alloc] initWithNumbers:numbers vias:vias subject:subject body:body];
}

- (NSString *)sMSURI {
  NSMutableString *result = [NSMutableString stringWithString:@"sms:"];
  BOOL first = YES;
  for (int i = 0; i < self.numbers.count; i++) {
    if (first) {
      first = NO;
    } else {
      [result appendString:@","];
    }
    [result appendString:self.numbers[i]];
    if (self.vias != nil && self.vias[i] != [NSNull null]) {
      [result appendString:@";via="];
      [result appendString:self.vias[i]];
    }
  }

  BOOL hasBody = self.body != nil;
  BOOL hasSubject = self.subject != nil;
  if (hasBody || hasSubject) {
    [result appendString:@"?"];
    if (hasBody) {
      [result appendString:@"body="];
      [result appendString:self.body];
    }
    if (hasSubject) {
      if (hasBody) {
        [result appendString:@"&"];
      }
      [result appendString:@"subject="];
      [result appendString:self.subject];
    }
  }
  return result;
}

- (NSString *)displayResult {
  NSMutableString *result = [NSMutableString stringWithCapacity:100];
  [ZXParsedResult maybeAppendArray:self.numbers result:result];
  [ZXParsedResult maybeAppend:self.subject result:result];
  [ZXParsedResult maybeAppend:self.body result:result];
  return result;
}

@end
