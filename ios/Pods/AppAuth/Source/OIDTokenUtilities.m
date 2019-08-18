/*! @file OIDTokenUtilities.m
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

#import "OIDTokenUtilities.h"

#import <CommonCrypto/CommonDigest.h>

/*! @brief String representing the set of characters that are allowed as is for the
        application/x-www-form-urlencoded encoding algorithm.
 */
static NSString *const kFormUrlEncodedAllowedCharacters =
    @" *-._0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

@implementation OIDTokenUtilities

+ (NSString *)encodeBase64urlNoPadding:(NSData *)data {
  NSString *base64string = [data base64EncodedStringWithOptions:0];
  // converts base64 to base64url
  base64string = [base64string stringByReplacingOccurrencesOfString:@"+" withString:@"-"];
  base64string = [base64string stringByReplacingOccurrencesOfString:@"/" withString:@"_"];
  // strips padding
  base64string = [base64string stringByReplacingOccurrencesOfString:@"=" withString:@""];
  return base64string;
}

+ (nullable NSString *)randomURLSafeStringWithSize:(NSUInteger)size {
  NSMutableData *randomData = [NSMutableData dataWithLength:size];
  int result = SecRandomCopyBytes(kSecRandomDefault, randomData.length, randomData.mutableBytes);
  if (result != 0) {
    return nil;
  }
  return [[self class] encodeBase64urlNoPadding:randomData];
}

+ (NSData *)sha265:(NSString *)inputString {
  NSData *verifierData = [inputString dataUsingEncoding:NSUTF8StringEncoding];
  NSMutableData *sha256Verifier = [NSMutableData dataWithLength:CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(verifierData.bytes, (CC_LONG)verifierData.length, sha256Verifier.mutableBytes);
  return sha256Verifier;
}

+ (NSString *)redact:(NSString *)inputString {
  if (inputString == nil) {
    return nil;
  }
  switch(inputString.length){
    case 0:
      return @"";
    case 1 ... 8:
      return @"[redacted]";
    case 9:
    default:
      return [[inputString substringToIndex:6] stringByAppendingString:@"...[redacted]"];
  }
}

+ (NSString*)formUrlEncode:(NSString*)inputString {
  // https://www.w3.org/TR/html5/sec-forms.html#application-x-www-form-urlencoded-encoding-algorithm
  // Following the spec from the above link, application/x-www-form-urlencoded percent encode all
  // the characters except *-._A-Za-z0-9
  // Space character is replaced by + in the resulting bytes sequence
  if (inputString.length == 0) {
    return inputString;
  }
  NSCharacterSet *allowedCharacters =
      [NSCharacterSet characterSetWithCharactersInString:kFormUrlEncodedAllowedCharacters];
  // Percent encode all characters not present in the provided set.
  NSString *encodedString =
      [inputString stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
  // Replace occurences of space by '+' character
  return [encodedString stringByReplacingOccurrencesOfString:@" " withString:@"+"];
}

@end
