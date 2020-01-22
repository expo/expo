// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <Foundation/Foundation.h>

NS_SWIFT_NAME(Base64)
@interface FBSDKBase64 : NSObject

/**
  Decodes a base-64 encoded string.
 @param string The base-64 encoded string.
 @return NSData containing the decoded bytes.
 */
+ (NSData *)decodeAsData:(NSString *)string;

/**
  Decodes a base-64 encoded string into a string.
 @param string The base-64 encoded string.
 @return NSString with the decoded UTF-8 value.
 */
+ (NSString *)decodeAsString:(NSString *)string;

/**
  Encodes data into a string.
 @param data The data to be encoded.
 @return The base-64 encoded string.
 */
+ (NSString *)encodeData:(NSData *)data;

/**
  Encodes string into a base-64 representation.
 @param string The string to be encoded.
 @return The base-64 encoded string.
 */
+ (NSString *)encodeString:(NSString *)string;

@end
