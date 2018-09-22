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

#import "FBSDKLikeButton.h"
#import "FBSDKLikeButton+Internal.h"

#import "FBSDKCheckmarkIcon.h"
#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLikeActionController.h"
#import "FBSDKLikeControl+Internal.h"

#define FBSDK_LIKE_BUTTON_ANIMATION_DURATION 0.2
#define FBSDK_LIKE_BUTTON_ANIMATION_SPRING_DAMPING 0.3
#define FBSDK_LIKE_BUTTON_ANIMATION_SPRING_VELOCITY 0.2

@implementation FBSDKLikeButton
{
  BOOL _isExplicitlyDisabled;
  FBSDKLikeActionController *_likeActionController;
  NSString *_objectID;
  FBSDKLikeObjectType _objectType;
}

#pragma mark - Class Methods

+ (void)initialize
{
  if ([FBSDKLikeButton class] == self) {
    // ensure that we have updated the dialog configs if we haven't already
    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:NULL];
  }
}

#pragma mark - Object Lifecycle

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_likeActionController endContentAccess];
}

#pragma mark - Properties

- (FBSDKLikeActionController *)likeActionController
{
  [self _ensureLikeActionController:NO];
  return _likeActionController;
}

- (void)setLikeActionController:(FBSDKLikeActionController *)likeActionController
{
  [self _setLikeActionController:likeActionController];
}

- (NSString *)objectID
{
  return _objectID;
}

- (void)setObjectID:(NSString *)objectID
{
  if (![_objectID isEqualToString:objectID]) {
    _objectID = objectID;
    [self checkImplicitlyDisabled];
    [self _resetLikeActionController];
  }
}

- (FBSDKLikeObjectType)objectType
{
  return _objectType;
}

- (void)setObjectType:(FBSDKLikeObjectType)objectType
{
  if (_objectType != objectType) {
    _objectType = objectType;
    [self _resetLikeActionController];
  }
}

#pragma mark - Layout

- (void)layoutSubviews
{
  [self _ensureLikeActionController:YES];
  [super layoutSubviews];
}

#pragma mark - FBSDKButtonImpressionTracking

- (NSDictionary *)analyticsParameters
{
  UIView *superview = self.superview;
  while (superview && ![superview isKindOfClass:[FBSDKLikeControl class]]) {
    superview = superview.superview;
  }
  if ([superview isKindOfClass:[FBSDKLikeControl class]]) {
    return ((FBSDKLikeControl *)superview).analyticsParameters;
  }
  return @{
           @"object_id": (self.objectID ?: [NSNull null]),
           @"object_type": (NSStringFromFBSDKLikeObjectType(self.objectType) ?: [NSNull null]),
           @"sound_enabled": @(self.soundEnabled),
           };
}

- (NSString *)impressionTrackingEventName
{
  return FBSDKAppEventNameFBSDKLikeButtonImpression;
}

- (NSString *)impressionTrackingIdentifier
{
  return self.objectID;
}

#pragma mark - FBSDKButton

- (void)configureButton
{
  self.soundEnabled = YES;

  NSString *title =
  NSLocalizedStringWithDefaultValue(@"LikeButton.Like", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                    @"Like",
                                    @"The label for the FBSDKLikeButton when the object is not currently liked.");
  NSString *selectedTitle =
  NSLocalizedStringWithDefaultValue(@"LikeButton.Liked", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                    @"Liked",
                                    @"The label for the FBSDKLikeButton when the object is currently liked.");

  UIColor *backgroundColor = [self defaultBackgroundColor];
  UIColor *highlightedColor = [self defaultHighlightedColor];
  UIColor *selectedColor = [self defaultSelectedColor];
  UIColor *selectedHighlightedColor = [UIColor colorWithRed:99.0/255.0 green:119.0/255.0 blue:178.0/255.0 alpha:1.0];

  [self configureWithIcon:nil
                    title:title
          backgroundColor:backgroundColor
         highlightedColor:highlightedColor
            selectedTitle:selectedTitle
             selectedIcon:[[FBSDKCheckmarkIcon alloc] init]
            selectedColor:selectedColor
 selectedHighlightedColor:selectedHighlightedColor];

  [self addTarget:self action:@selector(_handleTap:) forControlEvents:UIControlEventTouchUpInside];
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self
         selector:@selector(_likeActionControllerDidDisableNotification:)
             name:FBSDKLikeActionControllerDidDisableNotification
           object:nil];
  [nc addObserver:self
         selector:@selector(_likeActionControllerDidResetNotification:)
             name:FBSDKLikeActionControllerDidResetNotification
           object:nil];
  [nc addObserver:self
         selector:@selector(_likeActionControllerDidUpdateNotification:)
             name:FBSDKLikeActionControllerDidUpdateNotification
           object:nil];
}

- (BOOL)isImplicitlyDisabled
{
  return !self.objectID || [FBSDKLikeActionController isDisabled];
}

#pragma mark - Helper Methods

- (void)_ensureLikeActionController:(BOOL)notifyKVO
{
  if (!_likeActionController) {
    FBSDKLikeActionController *likeActionController = [FBSDKLikeActionController likeActionControllerForObjectID:_objectID
                                                                                                      objectType:_objectType];
    if (notifyKVO) {
      self.likeActionController = likeActionController;
    } else {
      [self _setLikeActionController:likeActionController];
    }
    [likeActionController endContentAccess];
    self.selected = _likeActionController.objectIsLiked;
  }
}

- (void)_handleTap:(FBSDKLikeButton *)likeButton
{
  [self logTapEventWithEventName:FBSDKAppEventNameFBSDKLikeButtonDidTap parameters:[self analyticsParameters]];
  [self _ensureLikeActionController:YES];
  [_likeActionController toggleLikeWithSoundEnabled:self.soundEnabled
                                analyticsParameters:[self analyticsParameters]
                                 fromViewController:[FBSDKInternalUtility viewControllerForView:self]];
}

- (void)_like:(id)sender
{
  [_likeActionController toggleLikeWithSoundEnabled:_soundEnabled
                                analyticsParameters:[self analyticsParameters]
                                 fromViewController:[FBSDKInternalUtility viewControllerForView:self]];
}

- (void)_likeActionControllerDidDisableNotification:(NSNotification *)notification
{
  [self checkImplicitlyDisabled];
}

- (void)_likeActionControllerDidResetNotification:(NSNotification *)notification
{
  [self _resetLikeActionController];
  [self _ensureLikeActionController:YES];
}

- (void)_likeActionControllerDidUpdateNotification:(NSNotification *)notification
{
  [self _ensureLikeActionController:YES];
  FBSDKLikeActionController *likeActionController = (FBSDKLikeActionController *)notification.object;
  NSString *objectID = likeActionController.objectID;
  if ([self.objectID isEqualToString:objectID]) {
    BOOL animated = [notification.userInfo[FBSDKLikeActionControllerAnimatedKey] boolValue];
    [self _setSelected:likeActionController.objectIsLiked animated:animated];
  }
}

- (void)_resetLikeActionController
{
  self.likeActionController = nil;
  [self setNeedsLayout];
}

- (void)_setLikeActionController:(FBSDKLikeActionController *)likeActionController
{
  if (_likeActionController != likeActionController) {
    [_likeActionController endContentAccess];
    _likeActionController = likeActionController;
    [_likeActionController beginContentAccess];
  }
}

- (void)_setSelected:(BOOL)selected animated:(BOOL)animated
{
  if (self.selected != selected) {
    if (animated) {
      CFTimeInterval duration = FBSDK_LIKE_BUTTON_ANIMATION_DURATION;
      UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState;
      UIImageView *imageView = self.imageView;
      imageView.frame = [self imageRectForContentRect:UIEdgeInsetsInsetRect(self.bounds, self.contentEdgeInsets)];
      [UIView animateWithDuration:duration delay:0.0 options:options animations:^{
        CGPoint iconImageViewCenter = imageView.center;
        imageView.frame = CGRectMake(iconImageViewCenter.x, iconImageViewCenter.y, 0.0, 0.0);
      } completion:^(BOOL animateOutFinished) {
        self.selected = selected;
        CGPoint iconImageViewCenter = imageView.center;
        imageView.frame = CGRectMake(iconImageViewCenter.x, iconImageViewCenter.y, 0.0, 0.0);

        void(^animations)(void) = ^{
          imageView.frame = [self imageRectForContentRect:UIEdgeInsetsInsetRect(self.bounds, self.contentEdgeInsets)];
        };
        if ([UIView respondsToSelector:@selector(animateWithDuration:delay:usingSpringWithDamping:initialSpringVelocity:options:animations:completion:)]) {
          [UIView animateWithDuration:(duration * 2)
                                delay:0.0
               usingSpringWithDamping:FBSDK_LIKE_BUTTON_ANIMATION_SPRING_DAMPING
                initialSpringVelocity:FBSDK_LIKE_BUTTON_ANIMATION_SPRING_VELOCITY
                              options:options
                           animations:animations
                           completion:NULL];
        } else {
          [UIView animateWithDuration:(duration * 2)
                                delay:0.0
                              options:options
                           animations:animations
                           completion:NULL];
        }
      }];
    } else {
      self.selected = selected;
    }
  }
}

@end
