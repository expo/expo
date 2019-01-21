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

#import "FBSDKKeychainStoreViaBundleID.h"

#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKInternalUtility.h"

@implementation FBSDKKeychainStoreViaBundleID

- (instancetype)init
{
  return [super initWithService:[NSBundle mainBundle].bundleIdentifier accessGroup:nil];
}

- (instancetype)initWithService:(NSString *)service accessGroup:(NSString *)accessGroup
{
  return [self init];
}

- (NSMutableDictionary*)queryForKey:(NSString *)key
{
  NSMutableDictionary *query = [NSMutableDictionary dictionary];
  query[(__bridge id)[FBSDKDynamicFrameworkLoader loadkSecClass]] = (__bridge id)([FBSDKDynamicFrameworkLoader loadkSecClassGenericPassword]);
  query[(__bridge id)[FBSDKDynamicFrameworkLoader loadkSecAttrService]] = self.service;
  query[(__bridge id)[FBSDKDynamicFrameworkLoader loadkSecAttrGeneric]] = key;

#if !TARGET_IPHONE_SIMULATOR
  [FBSDKInternalUtility dictionary:query setObject:self.accessGroup forKey:[FBSDKDynamicFrameworkLoader loadkSecAttrAccessGroup]];
#endif

  return query;
}

@end
