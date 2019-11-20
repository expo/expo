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

#import "FBSDKUtility.h"

#import <CommonCrypto/CommonDigest.h>

#import "FBSDKInternalUtility.h"

@implementation FBSDKUtility

+ (NSDictionary *)dictionaryWithQueryString:(NSString *)queryString
{
  return [FBSDKBasicUtility dictionaryWithQueryString:queryString];
}

+ (NSString *)queryStringWithDictionary:(NSDictionary<NSString *, id> *)dictionary error:(NSError **)errorRef
{
  return [FBSDKBasicUtility queryStringWithDictionary:dictionary error:errorRef invalidObjectHandler:NULL];
}

+ (NSString *)URLDecode:(NSString *)value
{
  return [FBSDKBasicUtility URLDecode:value];
}

+ (NSString *)URLEncode:(NSString *)value
{
  return [FBSDKBasicUtility URLEncode:value];
}

+ (dispatch_source_t)startGCDTimerWithInterval:(double)interval block:(dispatch_block_t)block
{
  dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, // source type
                                                   0, // handle
                                                   0, // mask
                                                   dispatch_get_main_queue()); // queue

  dispatch_source_set_timer(timer, // dispatch source
                            dispatch_time(DISPATCH_TIME_NOW, interval * NSEC_PER_SEC), // start
                            interval * NSEC_PER_SEC, // interval
                            0 * NSEC_PER_SEC); // leeway

  dispatch_source_set_event_handler(timer, block);

  dispatch_resume(timer);

  return timer;
}

+ (void)stopGCDTimer:(dispatch_source_t)timer
{
  if (timer) {
    dispatch_source_cancel(timer);
  }
}

+ (NSString *)SHA256Hash:(NSObject *)input
{
  NSData *data = nil;

  if ([input isKindOfClass:[NSData class]]) {
    data = (NSData *)input;
  } else if ([input isKindOfClass:[NSString class]]) {
    data = [(NSString *)input dataUsingEncoding:NSUTF8StringEncoding];
  }

  if (!data) {
    return nil;
  }

  uint8_t digest[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(data.bytes, (CC_LONG)data.length, digest);
  NSMutableString *hashed = [NSMutableString stringWithCapacity:CC_SHA256_DIGEST_LENGTH * 2];
  for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++) {
    [hashed appendFormat:@"%02x", digest[i]];
  }

  return [hashed copy];
}

@end
