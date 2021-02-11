// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to
// use, copy, modify, and distribute this software in source code or binary form
// for use in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKAppLinkResolverRequestBuilder.h"

 #import <UIKit/UIKit.h>

 #import "FBSDKCoreKit+Internal.h"
 #import "FBSDKGraphRequest+Internal.h"

static NSString *const kIOSKey = @"ios";
static NSString *const kIPhoneKey = @"iphone";
static NSString *const kIPadKey = @"ipad";
static NSString *const kAppLinksKey = @"app_links";

@interface FBSDKAppLinkResolverRequestBuilder ()
@property (nonatomic, assign) UIUserInterfaceIdiom userInterfaceIdiom;
@end

@implementation FBSDKAppLinkResolverRequestBuilder

- (instancetype)initWithUserInterfaceIdiom:(UIUserInterfaceIdiom)userInterfaceIdiom
{
  if (self = [super init]) {
    self.userInterfaceIdiom = userInterfaceIdiom;
  }
  return self;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _userInterfaceIdiom = UIDevice.currentDevice.userInterfaceIdiom;
  }

  return self;
}

- (FBSDKGraphRequest *)requestForURLs:(NSArray<NSURL *> *)urls
{
  NSArray<NSString *> *fields = [self getUISpecificFields];
  NSArray<NSString *> *encodedURLs = [self getEncodedURLs:urls];

  NSString *path =
  [NSString stringWithFormat:@"?fields=%@.fields(%@)&ids=%@",
   kAppLinksKey,
   [fields componentsJoinedByString:@","],
   [encodedURLs componentsJoinedByString:@","]];
  return [[FBSDKGraphRequest alloc]
          initWithGraphPath:path
          parameters:nil
          flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError
          | FBSDKGraphRequestFlagDisableErrorRecovery];
}

- (NSString *_Nullable)getIdiomSpecificField
{
  NSString *idiomSpecificField = nil;

  switch (self.userInterfaceIdiom) {
    case UIUserInterfaceIdiomPad:
      idiomSpecificField = kIPadKey;
      break;
    case UIUserInterfaceIdiomPhone:
      idiomSpecificField = kIPhoneKey;
      break;
    default:
      break;
  }

  return idiomSpecificField;
}

- (NSArray<NSString *> *)getUISpecificFields
{
  NSMutableArray<NSString *> *fields = [NSMutableArray arrayWithObject:kIOSKey];
  NSString *idiomSpecificField = [self getIdiomSpecificField];

  if (idiomSpecificField) {
    [FBSDKTypeUtility array:fields addObject:idiomSpecificField];
  }

  return fields;
}

- (NSArray<NSString *> *)getEncodedURLs:(NSArray<NSURL *> *)urls
{
  NSMutableArray<NSString *> *encodedURLs = [NSMutableArray array];

  for (NSURL *url in urls) {
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wdeprecated-declarations"
    NSString *encodedURL = [url.absoluteString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
    #pragma clang diagnostic pop
    if (encodedURL) {
      [FBSDKTypeUtility array:encodedURLs addObject:encodedURL];
    }
  }

  return encodedURLs;
}

@end

#endif
