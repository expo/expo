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

#import <FBSDKCoreKit/FBSDKButton.h>

#import "FBSDKIcon.h"

@protocol FBSDKButtonImpressionTracking <NSObject>

@property (nonatomic, readonly, copy) NSDictionary<NSString *, id> *analyticsParameters;
@property (nonatomic, readonly, copy) NSString *impressionTrackingEventName;
@property (nonatomic, readonly, copy) NSString *impressionTrackingIdentifier;

@end

@interface FBSDKButton ()

@property (nonatomic, readonly, getter=isImplicitlyDisabled) BOOL implicitlyDisabled;

- (void)logTapEventWithEventName:(NSString *)eventName
                      parameters:(NSDictionary *)parameters;
- (void)checkImplicitlyDisabled;
- (void)configureButton;
- (void)configureWithIcon:(FBSDKIcon *)icon
                    title:(NSString *)title
          backgroundColor:(UIColor *)backgroundColor
         highlightedColor:(UIColor *)highlightedColor;
- (void)configureWithIcon:(FBSDKIcon *)icon
                    title:(NSString *)title
          backgroundColor:(UIColor *)backgroundColor
         highlightedColor:(UIColor *)highlightedColor
            selectedTitle:(NSString *)selectedTitle
             selectedIcon:(FBSDKIcon *)selectedIcon
            selectedColor:(UIColor *)selectedColor
 selectedHighlightedColor:(UIColor *)selectedHighlightedColor;
- (UIColor *)defaultBackgroundColor;
- (UIColor *)defaultDisabledColor;
- (UIFont *)defaultFont;
- (UIColor *)defaultHighlightedColor;
- (FBSDKIcon *)defaultIcon;
- (UIColor *)defaultSelectedColor;
- (CGSize)sizeThatFits:(CGSize)size title:(NSString *)title;

@end
