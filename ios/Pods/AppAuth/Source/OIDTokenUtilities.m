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

@end
