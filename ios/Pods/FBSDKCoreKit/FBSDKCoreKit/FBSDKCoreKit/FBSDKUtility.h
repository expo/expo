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

NS_ASSUME_NONNULL_BEGIN

/**
  Class to contain common utility methods.
 */
NS_SWIFT_NAME(Utility)
@interface FBSDKUtility : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
  Parses a query string into a dictionary.
 @param queryString The query string value.
 @return A dictionary with the key/value pairs.
 */
+ (NSDictionary<NSString *, NSString *> *)dictionaryWithQueryString:(NSString *)queryString
NS_SWIFT_NAME(dictionary(withQuery:));

/**
  Constructs a query string from a dictionary.
 @param dictionary The dictionary with key/value pairs for the query string.
 @param errorRef If an error occurs, upon return contains an NSError object that describes the problem.
 @return Query string representation of the parameters.
 */
+ (NSString *)queryStringWithDictionary:(NSDictionary<NSString *, id> *)dictionary
                                  error:(NSError **)errorRef
NS_SWIFT_NAME(query(from:))
__attribute__((swift_error(nonnull_error)));

/**
  Decodes a value from an URL.
 @param value The value to decode.
 @return The decoded value.
 */
+ (NSString *)URLDecode:(NSString *)value
NS_SWIFT_NAME(decode(urlString:));

/**
  Encodes a value for an URL.
 @param value The value to encode.
 @return The encoded value.
 */
+ (NSString *)URLEncode:(NSString *)value
NS_SWIFT_NAME(encode(urlString:));

/**
  Creates a timer using Grand Central Dispatch.
 @param interval The interval to fire the timer, in seconds.
 @param block The code block to execute when timer is fired.
 @return The dispatch handle.
 */
+ (dispatch_source_t)startGCDTimerWithInterval:(double)interval block:(dispatch_block_t)block;

/**
 Stop a timer that was started by startGCDTimerWithInterval.
 @param timer The dispatch handle received from startGCDTimerWithInterval.
 */
+ (void)stopGCDTimer:(dispatch_source_t)timer;

/**
 Get SHA256 hased string of NSString/NSData

 @param input The data that needs to be hashed, it could be NSString or NSData.
 */
+ (nullable NSString *)SHA256Hash:(nullable NSObject *)input
NS_SWIFT_NAME(sha256Hash(_:));

@end

NS_ASSUME_NONNULL_END
