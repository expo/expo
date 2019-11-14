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

#import "FBSDKLoginTooltipView.h"

#ifdef COCOAPODS
#import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>
#else
#import "FBSDKCoreKit+Internal.h"
#endif

@interface FBSDKLoginTooltipView ()
@end

@implementation FBSDKLoginTooltipView

- (instancetype)init
{
  NSString *tooltipMessage =
  NSLocalizedStringWithDefaultValue(@"LoginTooltip.Message", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                    @"You're in control - choose what info you want to share with apps.",
                                    @"The message of the FBSDKLoginTooltipView");
  return [super initWithTagline:nil message:tooltipMessage colorStyle:FBSDKTooltipColorStyleFriendlyBlue];
}

- (void)presentInView:(UIView *)view withArrowPosition:(CGPoint)arrowPosition direction:(FBSDKTooltipViewArrowDirection)arrowDirection
{
  if (self.forceDisplay) {
    [super presentInView:view withArrowPosition:arrowPosition direction:arrowDirection];
  } else {

    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:^(FBSDKServerConfiguration *serverConfiguration, NSError *error) {
      self.message = serverConfiguration.loginTooltipText;
      BOOL shouldDisplay = serverConfiguration.loginTooltipEnabled;
      if ([self.delegate respondsToSelector:@selector(loginTooltipView:shouldAppear:)]) {
        shouldDisplay = [self.delegate loginTooltipView:self shouldAppear:shouldDisplay];
      }
      if (shouldDisplay) {
        [super presentInView:view withArrowPosition:arrowPosition direction:arrowDirection];
        if ([self.delegate respondsToSelector:@selector(loginTooltipViewWillAppear:)]) {
          [self.delegate loginTooltipViewWillAppear:self];
        }
      } else {
        if ([self.delegate respondsToSelector:@selector(loginTooltipViewWillNotAppear:)]) {
          [self.delegate loginTooltipViewWillNotAppear:self];
        }
      }
    }];
  }
}
@end
