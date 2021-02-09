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

#import "ZXParsedResult.h"

@implementation ZXParsedResult

- (id)initWithType:(ZXParsedResultType)type {
  if (self = [super init]) {
    _type = type;
  }

  return self;
}

+ (id)parsedResultWithType:(ZXParsedResultType)type {
  return [[ZXParsedResult alloc] initWithType:type];
}

- (NSString *)displayResult {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

- (NSString *)description {
  return [self displayResult];
}

+ (void)maybeAppend:(NSString *)value result:(NSMutableString *)result {
  if (value != nil && (id)value != [NSNull null] && [value length] > 0) {
    // Don't add a newline before the first value
    if ([result length] > 0) {
      [result appendString:@"\n"];
    }
    [result appendString:value];
  }
}

+ (void)maybeAppendArray:(NSArray *)values result:(NSMutableString *)result {
  if (values != nil) {
    for (NSString *value in values) {
      [self maybeAppend:value result:result];
    }
  }
}

@end
