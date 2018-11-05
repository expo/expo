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

#import "FBSDKShareMessengerURLActionButton.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareUtility.h"

static NSString *const kURLActionButtonTitleKey = @"title";
static NSString *const kURLActionButtonURLKey = @"url";
static NSString *const kURLActionButtonWebviewHeightRatioKey = @"webviewHeightRatio";
static NSString *const kURLActionButtonMessengerExtensionsKey = @"messengerExtensions";
static NSString *const kURLActionButtonFallbackURLKey = @"fallbackURL";
static NSString *const kURLActionButtonShouldHideWebviewShareButtonKey = @"shouldHideWebviewShareButton";

@implementation FBSDKShareMessengerURLActionButton

#pragma mark - Properties

@synthesize title = _title;

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _title = [decoder decodeObjectOfClass:[NSString class] forKey:kURLActionButtonTitleKey];
    _url = [decoder decodeObjectOfClass:[NSURL class] forKey:kURLActionButtonURLKey];
    _webviewHeightRatio = [[decoder decodeObjectOfClass:[NSNumber class] forKey:kURLActionButtonWebviewHeightRatioKey] unsignedIntegerValue];
    _isMessengerExtensionURL = [decoder decodeBoolForKey:kURLActionButtonMessengerExtensionsKey];
    _fallbackURL = [decoder decodeObjectOfClass:[NSURL class] forKey:kURLActionButtonFallbackURLKey];
    _shouldHideWebviewShareButton = [decoder decodeBoolForKey:kURLActionButtonShouldHideWebviewShareButtonKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_title forKey:kURLActionButtonTitleKey];
  [encoder encodeObject:_url forKey:kURLActionButtonURLKey];
  [encoder encodeObject:@(_webviewHeightRatio) forKey:kURLActionButtonWebviewHeightRatioKey];
  [encoder encodeBool:_isMessengerExtensionURL forKey:kURLActionButtonMessengerExtensionsKey];
  [encoder encodeObject:_fallbackURL forKey:kURLActionButtonFallbackURLKey];
  [encoder encodeBool:_shouldHideWebviewShareButton forKey:kURLActionButtonShouldHideWebviewShareButtonKey];

}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareMessengerURLActionButton *copy = [[FBSDKShareMessengerURLActionButton alloc] init];
  copy->_title = [_title copy];
  copy->_url = [_url copy];
  copy->_webviewHeightRatio = _webviewHeightRatio;
  copy->_isMessengerExtensionURL = _isMessengerExtensionURL;
  copy->_fallbackURL = [_fallbackURL copy];
  copy->_shouldHideWebviewShareButton = _shouldHideWebviewShareButton;
  return copy;
}

@end
