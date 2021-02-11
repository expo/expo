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

#import "FBSDKBase64.h"

@implementation FBSDKBase64

static FBSDKBase64 *_decoder;
static FBSDKBase64 *_encoder;

#pragma mark - Class Methods

+ (void)initialize
{
  if (self == [FBSDKBase64 class]) {
    _decoder = [[FBSDKBase64 alloc] init];
    _encoder = [[FBSDKBase64 alloc] init];
  }
}

+ (NSData *)decodeAsData:(NSString *)string
{
  return [_decoder decodeAsData:string];
}

+ (NSString *)decodeAsString:(NSString *)string
{
  return [_decoder decodeAsString:string];
}

+ (NSString *)encodeData:(NSData *)data
{
  return [_encoder encodeData:data];
}

+ (NSString *)encodeString:(NSString *)string
{
  return [_encoder encodeString:string];
}

+ (NSString *)base64FromBase64Url:(NSString *)base64Url
{
  NSString *base64 = [base64Url stringByReplacingOccurrencesOfString:@"-" withString:@"+"];
  base64 = [base64 stringByReplacingOccurrencesOfString:@"_" withString:@"/"];

  return base64;
}

#pragma mark - Object Lifecycle

#pragma mark - Implementation Methods

- (NSData *)decodeAsData:(NSString *)string
{
  if (!string) {
    return nil;
  }
  // This padding will be appended before stripping unknown characters, so if there are unknown characters of count % 4
  // it will not be able to decode.  Since we assume valid base64 data, we will take this as is.
  int needPadding = string.length % 4;
  if (needPadding > 0) {
    needPadding = 4 - needPadding;
    string = [string stringByPaddingToLength:string.length + needPadding withString:@"=" startingAtIndex:0];
  }

  return [[NSData alloc] initWithBase64EncodedString:string options:NSDataBase64DecodingIgnoreUnknownCharacters];
}

- (NSString *)decodeAsString:(NSString *)string
{
  NSData *data = [self decodeAsData:string];
  if (!data) {
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

- (NSString *)encodeData:(NSData *)data
{
  if (!data) {
    return nil;
  }

  return [data base64EncodedStringWithOptions:0];
}

- (NSString *)encodeString:(NSString *)string
{
  return [self encodeData:[string dataUsingEncoding:NSUTF8StringEncoding]];
}

@end
