//
//  GTMNSDictionary+URLArguments.h
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

#import <Foundation/Foundation.h>

/// Utility for building a URL or POST argument string.
@interface NSDictionary (GTMNSDictionaryURLArgumentsAdditions)

/// Returns a dictionary of the decoded key-value pairs in a http arguments
/// string of the form key1=value1&key2=value2&...&keyN=valueN.
/// Keys and values will be unescaped automatically.
/// Only the first value for a repeated key is returned.
///
/// NOTE: Apps targeting iOS 8 or OS X 10.10 and later should use
///       NSURLComponents and NSURLQueryItem to create URLs with
///       query arguments instead of using these category methods.
+ (NSDictionary *)gtm_dictionaryWithHttpArgumentsString:(NSString *)argString;

/// Gets a string representation of the dictionary in the form
/// key1=value1&key2=value2&...&keyN=valueN, suitable for use as either
/// URL arguments (after a '?') or POST body. Keys and values will be escaped
/// automatically, so should be unescaped in the dictionary.
- (NSString *)gtm_httpArgumentsString;

@end
