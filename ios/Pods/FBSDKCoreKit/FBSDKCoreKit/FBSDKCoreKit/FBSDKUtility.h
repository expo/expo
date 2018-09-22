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

/**
  Class to contain common utility methods.
 */
@interface FBSDKUtility : NSObject

/**
  Parses a query string into a dictionary.
 - Parameter queryString: The query string value.
 - Returns: A dictionary with the key/value pairs.
 */
+ (NSDictionary *)dictionaryWithQueryString:(NSString *)queryString;

/**
  Constructs a query string from a dictionary.
 - Parameter dictionary: The dictionary with key/value pairs for the query string.
 - Parameter errorRef: If an error occurs, upon return contains an NSError object that describes the problem.
 - Returns: Query string representation of the parameters.
 */
+ (NSString *)queryStringWithDictionary:(NSDictionary *)dictionary error:(NSError *__autoreleasing *)errorRef;

/**
  Decodes a value from an URL.
 - Parameter value: The value to decode.
 - Returns: The decoded value.
 */
+ (NSString *)URLDecode:(NSString *)value;

/**
  Encodes a value for an URL.
 - Parameter value: The value to encode.
 - Returns: The encoded value.
 */
+ (NSString *)URLEncode:(NSString *)value;

/**
  Creates a timer using Grand Central Dispatch.
 - Parameter interval: The interval to fire the timer, in seconds.
 - Parameter block: The code block to execute when timer is fired.
 - Returns: The dispatch handle.
 */
+ (dispatch_source_t)startGCDTimerWithInterval:(double)interval block:(dispatch_block_t)block;

/**
 Stop a timer that was started by startGCDTimerWithInterval.
 - Parameter timer: The dispatch handle received from startGCDTimerWithInterval.
 */
+ (void)stopGCDTimer:(dispatch_source_t)timer;

@end
