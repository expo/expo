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

#import "FBSDKMacros.h"

@implementation FBSDKBase64
{
  BOOL _optionsEnabled;
}

static FBSDKBase64 *_decoder;
static FBSDKBase64 *_encoder;

#pragma mark - Class Methods

+ (void)initialize
{
  if (self == [FBSDKBase64 class]) {
    BOOL optionsEnabled;
    optionsEnabled = [NSData instancesRespondToSelector:@selector(initWithBase64EncodedString:options:)];
    _decoder = [[FBSDKBase64 alloc] initWithOptionsEnabled:optionsEnabled];
    optionsEnabled = [NSData instancesRespondToSelector:@selector(base64EncodedStringWithOptions:)];
    _encoder = [[FBSDKBase64 alloc] initWithOptionsEnabled:optionsEnabled];
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

#pragma mark - Object Lifecycle

- (instancetype)init
{
  FBSDK_NOT_DESIGNATED_INITIALIZER(initWithOptionsEnabled:);
  return nil;
}

- (instancetype)initWithOptionsEnabled:(BOOL)optionsEnabled
{
  if ((self = [super init])) {
    _optionsEnabled = optionsEnabled;
  }
  return self;
}

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
    string = [string stringByPaddingToLength:string.length+needPadding withString:@"=" startingAtIndex:0];
  }
  if (_optionsEnabled) {
    return [[NSData alloc] initWithBase64EncodedString:string options:NSDataBase64DecodingIgnoreUnknownCharacters];
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    return [[NSData alloc] initWithBase64Encoding:string];
#pragma clang diagnostic pop
  }
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
  if (_optionsEnabled) {
    return [data base64EncodedStringWithOptions:0];
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    return [data base64Encoding];
#pragma clang diagnostic pop
  }
}

- (NSString *)encodeString:(NSString *)string
{
  return [self encodeData:[string dataUsingEncoding:NSUTF8StringEncoding]];
}

@end
