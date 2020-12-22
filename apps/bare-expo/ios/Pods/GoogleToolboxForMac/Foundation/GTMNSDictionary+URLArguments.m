//
//  GTMNSDictionary+URLArguments.m
//
//  Copyright 2006-2008 Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not
//  use this file except in compliance with the License.  You may obtain a copy
//  of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
//  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
//  License for the specific language governing permissions and limitations under
//  the License.
//

#import "GTMNSDictionary+URLArguments.h"
#import "GTMNSString+URLArguments.h"
#import "GTMMethodCheck.h"
#import "GTMDefines.h"


#pragma clang diagnostic push
// Ignore all of the deprecation warnings for GTMNSString+URLArguments
#pragma clang diagnostic ignored "-Wdeprecated-declarations"

@implementation NSDictionary (GTMNSDictionaryURLArgumentsAdditions)

GTM_METHOD_CHECK(NSString, gtm_stringByEscapingForURLArgument);
GTM_METHOD_CHECK(NSString, gtm_stringByUnescapingFromURLArgument);

+ (NSDictionary *)gtm_dictionaryWithHttpArgumentsString:(NSString *)argString {
  NSMutableDictionary* ret = [NSMutableDictionary dictionary];
  NSArray* components = [argString componentsSeparatedByString:@"&"];
  NSString* component;
  // Use reverse order so that the first occurrence of a key replaces
  // those subsequent.
  for (component in [components reverseObjectEnumerator]) {
    if ([component length] == 0)
      continue;
    NSRange pos = [component rangeOfString:@"="];
    NSString *key;
    NSString *val;
    if (pos.location == NSNotFound) {
      key = [component gtm_stringByUnescapingFromURLArgument];
      val = @"";
    } else {
      key = [[component substringToIndex:pos.location]
             gtm_stringByUnescapingFromURLArgument];
      val = [[component substringFromIndex:pos.location + pos.length]
             gtm_stringByUnescapingFromURLArgument];
    }
    // gtm_stringByUnescapingFromURLArgument returns nil on invalid UTF8
    // and NSMutableDictionary raises an exception when passed nil values.
    if (!key) key = @"";
    if (!val) val = @"";
    [ret setObject:val forKey:key];
  }
  return ret;
}

- (NSString *)gtm_httpArgumentsString {
  NSMutableArray* arguments = [NSMutableArray arrayWithCapacity:[self count]];
  NSString* key;
  for (key in self) {
    [arguments addObject:[NSString stringWithFormat:@"%@=%@",
                          [key gtm_stringByEscapingForURLArgument],
                          [[[self objectForKey:key] description] gtm_stringByEscapingForURLArgument]]];
  }

  return [arguments componentsJoinedByString:@"&"];
}

@end

#pragma clang diagnostic pop
