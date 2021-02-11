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

#import "FBSDKErrorRecoveryConfiguration.h"

@class FBSDKGraphRequest;

// maps codes and subcodes pairs to FBSDKErrorRecoveryConfiguration instances.
NS_SWIFT_NAME(ErrorConfiguration)
@interface FBSDKErrorConfiguration : NSObject <NSSecureCoding, NSCopying>

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

// initialize from optional dictionary of existing configurations. If not supplied a fallback will be created.
- (instancetype)initWithDictionary:(NSDictionary *)dictionary NS_DESIGNATED_INITIALIZER;

// parses the array (supplied from app settings endpoint)
- (void)parseArray:(NSArray<NSDictionary *> *)array;

// NSString "code" instances support "*" wildcard semantics (nil is treated as "*" also)
// 'request' is optional, typically for identifying special graph request semantics (e.g., no recovery for client token)
- (FBSDKErrorRecoveryConfiguration *)recoveryConfigurationForCode:(NSString *)code subcode:(NSString *)subcode request:(FBSDKGraphRequest *)request;

@end
