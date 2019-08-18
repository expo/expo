/*
 * Copyright 2019 Google
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

#import "FIRInstanceIDURLQueryItem.h"

@implementation FIRInstanceIDURLQueryItem

+ (instancetype)queryItemWithName:(NSString *)name value:(NSString *)value {
  return [[[self class] alloc] initWithName:name value:value];
}

- (instancetype)initWithName:(NSString *)name value:(NSString *)value {
  self = [super init];
  if (self) {
    _name = [name copy];
    _value = [value copy];
  }
  return self;
}
@end

NSString *FIRInstanceIDQueryFromQueryItems(NSArray<FIRInstanceIDURLQueryItem *> *queryItems) {
  if ([NSURLQueryItem class]) {
    // We are iOS 8.0 and above. Convert to NSURLQueryItems and get query that way
    // to take advantage of any automatic encoding
    NSMutableArray<NSURLQueryItem *> *urlItems =
        [NSMutableArray arrayWithCapacity:queryItems.count];
    for (FIRInstanceIDURLQueryItem *queryItem in queryItems) {
      [urlItems addObject:[NSURLQueryItem queryItemWithName:queryItem.name value:queryItem.value]];
    }
    NSURLComponents *components = [[NSURLComponents alloc] init];
    components.queryItems = urlItems;
    return components.query;
  } else {
    // We are on iOS 7.0. Manually create the query string
    NSMutableArray<NSString *> *pairs = [NSMutableArray arrayWithCapacity:queryItems.count];
    for (FIRInstanceIDURLQueryItem *queryItem in queryItems) {
      [pairs addObject:[NSString stringWithFormat:@"%@=%@", queryItem.name, queryItem.value]];
    }
    return [pairs componentsJoinedByString:@"&"];
  }
}
