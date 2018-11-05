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

#import "FBSDKSendButton.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKMessageDialog.h"
#import "FBSDKMessengerIcon.h"

@interface FBSDKSendButton () <FBSDKButtonImpressionTracking>
@end

@implementation FBSDKSendButton
{
  FBSDKMessageDialog *_dialog;
}

#pragma mark - Properties

- (id<FBSDKSharingContent>)shareContent
{
  return _dialog.shareContent;
}

- (void)setShareContent:(id<FBSDKSharingContent>)shareContent
{
  _dialog.shareContent = shareContent;
  [self checkImplicitlyDisabled];
}

#pragma mark - FBSDKButtonImpressionTracking

- (NSDictionary *)analyticsParameters
{
  return nil;
}

- (NSString *)impressionTrackingEventName
{
  return FBSDKAppEventNameFBSDKSendButtonImpression;
}

- (NSString *)impressionTrackingIdentifier
{
  return @"send";
}

#pragma mark - FBSDKButton

- (void)configureButton
{
  NSString *title =
  NSLocalizedStringWithDefaultValue(@"SendButton.Send", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                    @"Send",
                                    @"The label for FBSDKSendButton");

  UIColor *backgroundColor = [UIColor colorWithRed:0.0 green:132.0/255.0 blue:1.0 alpha:1.0];
  UIColor *highlightedColor = [UIColor colorWithRed:0.0 green:111.0/255.0 blue:1.0 alpha:1.0];

  [self configureWithIcon:[[FBSDKMessengerIcon alloc] init]
                    title:title
          backgroundColor:backgroundColor
         highlightedColor:highlightedColor];

  [self addTarget:self action:@selector(_share:) forControlEvents:UIControlEventTouchUpInside];
  _dialog = [[FBSDKMessageDialog alloc] init];
}

- (BOOL)isImplicitlyDisabled
{
  return ![_dialog canShow] || ![_dialog validateWithError:NULL];
}

#pragma mark - Helper Methods

- (void)_share:(id)sender
{
  [self logTapEventWithEventName:FBSDKAppEventNameFBSDKSendButtonDidTap parameters:[self analyticsParameters]];
  [_dialog show];
}

@end
