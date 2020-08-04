/*! @file OIDScopeUtilities.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2015 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import "OIDScopeUtilities.h"

@implementation OIDScopeUtilities

/*! @brief A character set with the characters NOT allowed in a scope name.
    @see https://tools.ietf.org/html/rfc6749#section-3.3
 */
+ (NSCharacterSet *)disallowedScopeCharacters {
  static NSCharacterSet *disallowedCharacters;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableCharacterSet *allowedCharacters;
    allowedCharacters =
        [NSMutableCharacterSet characterSetWithRange:NSMakeRange(0x23, 0x5B - 0x23 + 1)];
    [allowedCharacters addCharactersInRange:NSMakeRange(0x5D, 0x7E - 0x5D + 1)];
    [allowedCharacters addCharactersInString:@"\x21"];
    disallowedCharacters = [allowedCharacters invertedSet];
  });
  return disallowedCharacters;
}

+ (NSString *)scopesWithArray:(NSArray<NSString *> *)scopes {
#if !defined(NS_BLOCK_ASSERTIONS)
  NSCharacterSet *disallowedCharacters = [self disallowedScopeCharacters];
  for (NSString *scope in scopes) {
    NSAssert(scope.length, @"Found illegal empty scope string.");
    NSAssert([scope rangeOfCharacterFromSet:disallowedCharacters].location == NSNotFound,
             @"Found illegal character in scope string.");
  }
#endif // !defined(NS_BLOCK_ASSERTIONS)

  NSString *scopeString = [scopes componentsJoinedByString:@" "];
  return scopeString;
}

+ (NSArray<NSString *> *)scopesArrayWithString:(NSString *)scopes {
  return [scopes componentsSeparatedByString:@" "];
}

@end
