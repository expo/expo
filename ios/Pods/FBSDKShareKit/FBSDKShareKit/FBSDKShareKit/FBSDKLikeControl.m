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

#import "FBSDKLikeControl.h"
#import "FBSDKLikeControl+Internal.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLikeActionController.h"
#import "FBSDKLikeBoxView.h"
#import "FBSDKLikeButton+Internal.h"
#import "FBSDKLikeButton.h"

#define kFBLikeControlAnimationDuration 0.2
#define kFBLikeControlSocialSentenceAnimationOffset 10.0

static void *FBSDKLikeControlKVOLikeActionControllerContext = &FBSDKLikeControlKVOLikeActionControllerContext;

NSString *NSStringFromFBSDKLikeControlAuxiliaryPosition(FBSDKLikeControlAuxiliaryPosition auxiliaryPosition)
{
  switch (auxiliaryPosition) {
    case FBSDKLikeControlAuxiliaryPositionBottom:
      return @"bottom";
    case FBSDKLikeControlAuxiliaryPositionInline:
      return @"inline";
    case FBSDKLikeControlAuxiliaryPositionTop:
      return @"top";
  }
  return nil;
}

NSString *NSStringFromFBSDKLikeControlHorizontalAlignment(FBSDKLikeControlHorizontalAlignment horizontalAlignment)
{
  switch (horizontalAlignment) {
    case FBSDKLikeControlHorizontalAlignmentCenter:
      return @"center";
    case FBSDKLikeControlHorizontalAlignmentLeft:
      return @"left";
    case FBSDKLikeControlHorizontalAlignmentRight:
      return @"right";
  }
  return nil;
}

NSString *NSStringFromFBSDKLikeControlStyle(FBSDKLikeControlStyle style)
{
  switch (style) {
    case FBSDKLikeControlStyleBoxCount:
      return @"box_count";
    case FBSDKLikeControlStyleStandard:
      return @"standard";
  }
  return nil;
}

typedef struct FBSDKLikeControlLayout
{
  CGSize contentSize;
  CGRect likeButtonFrame;
  CGRect auxiliaryViewFrame;
} FBSDKLikeControlLayout;

typedef CGSize (^fbsdk_like_control_sizing_block_t)(UIView *subview, CGSize constrainedSize);

@implementation FBSDKLikeControl
{
  BOOL _isExplicitlyDisabled;
  FBSDKLikeBoxView *_likeBoxView;
  FBSDKLikeButton *_likeButton;
  UIView *_likeButtonContainer;
  UILabel *_socialSentenceLabel;
}

#pragma mark - Class Methods

+ (void)initialize
{
  if ([FBSDKLikeControl class] == self) {
    // ensure that we have updated the dialog configs if we haven't already
    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:NULL];
  }
}

#pragma mark - Object Lifecycle

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self _initializeContent];
    if (CGRectEqualToRect(frame, CGRectZero)) {
      [self sizeToFit];
    }
  }
  return self;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [super initWithCoder:decoder])) {
    [self _initializeContent];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_likeButton removeObserver:self forKeyPath:@"likeActionController"];
}

#pragma mark - Properties

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  super.backgroundColor = backgroundColor;
  _likeButtonContainer.backgroundColor = backgroundColor;
}

- (void)setForegroundColor:(UIColor *)foregroundColor
{
  if (![_foregroundColor isEqual:foregroundColor]) {
    _foregroundColor = foregroundColor;
    [_likeButton setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    _socialSentenceLabel.textColor = foregroundColor;
  }
}

- (void)setEnabled:(BOOL)enabled
{
  _isExplicitlyDisabled = !enabled;
  [self _updateEnabled];
}

- (void)setLikeControlAuxiliaryPosition:(FBSDKLikeControlAuxiliaryPosition)likeControlAuxiliaryPosition
{
  if (_likeControlAuxiliaryPosition != likeControlAuxiliaryPosition) {
    _likeControlAuxiliaryPosition = likeControlAuxiliaryPosition;
    [self _updateLikeBoxCaretPosition];
    [self setNeedsLayout];
    [self setNeedsUpdateConstraints];
    [self invalidateIntrinsicContentSize];
  }
}

- (void)setLikeControlHorizontalAlignment:(FBSDKLikeControlHorizontalAlignment)likeControlHorizontalAlignment
{
  if (_likeControlHorizontalAlignment != likeControlHorizontalAlignment) {
    _likeControlHorizontalAlignment = likeControlHorizontalAlignment;
    [self _updateLikeBoxCaretPosition];
    [self setNeedsLayout];
    [self setNeedsUpdateConstraints];
    [self invalidateIntrinsicContentSize];
  }
}

- (void)setLikeControlStyle:(FBSDKLikeControlStyle)likeControlStyle
{
  if (_likeControlStyle != likeControlStyle) {
    _likeControlStyle = likeControlStyle;
    [self _updateLikeBoxCaretPosition];
    [self setNeedsLayout];
    [self setNeedsUpdateConstraints];
    [self invalidateIntrinsicContentSize];
  }
}

- (NSString *)objectID
{
  return _likeButton.objectID;
}

- (void)setObjectID:(NSString *)objectID
{
  if (![_likeButton.objectID isEqualToString:objectID]) {
    _likeButton.objectID = objectID;
    [self _updateEnabled];
    [self setNeedsLayout];
  }
}

- (FBSDKLikeObjectType)objectType
{
  return _likeButton.objectType;
}

- (void)setObjectType:(FBSDKLikeObjectType)objectType
{
  if (_likeButton.objectType != objectType) {
    _likeButton.objectType = objectType;
    [self setNeedsLayout];
  }
}

- (void)setOpaque:(BOOL)opaque
{
  super.opaque = opaque;
  _likeButtonContainer.opaque = opaque;
}

- (BOOL)isSoundEnabled
{
  return _likeButton.soundEnabled;
}

- (void)setSoundEnabled:(BOOL)soundEnabled
{
  _likeButton.soundEnabled = soundEnabled;
}

#pragma mark - Layout

- (CGSize)intrinsicContentSize
{
  CGFloat width = self.preferredMaxLayoutWidth;
  if (width == 0) {
    width = CGFLOAT_MAX;
  }
  CGRect bounds = CGRectMake(0.0, 0.0, width, CGFLOAT_MAX);
  return [self _layoutWithBounds:bounds subviewSizingBlock:^CGSize(UIView *subview, CGSize constrainedSize) {
    if ([subview respondsToSelector:@selector(setPreferredMaxLayoutWidth:)]) {
      [(id)subview setPreferredMaxLayoutWidth:constrainedSize.width];
    }
    return subview.intrinsicContentSize;
  }].contentSize;
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  NSString *objectID = self.objectID;
  if (objectID) {
    FBSDKViewImpressionTracker *impressionTracker =
    [FBSDKViewImpressionTracker impressionTrackerWithEventName:FBSDKAppEventNameFBSDKLikeControlImpression];
    [impressionTracker logImpressionWithIdentifier:objectID parameters:[self analyticsParameters]];
  }

  [self _ensureLikeActionController];

  CGRect bounds = self.bounds;
  CGSize(^sizingBlock)(UIView *, CGSize) = ^CGSize(UIView *subview, CGSize constrainedSize) {
    return [subview sizeThatFits:constrainedSize];
  };
  FBSDKLikeControlLayout layout = [self _layoutWithBounds:bounds subviewSizingBlock:sizingBlock];

  UIView *auxiliaryView = [self _auxiliaryView];
  _likeBoxView.hidden = (_likeBoxView != auxiliaryView);
  _socialSentenceLabel.hidden = (_socialSentenceLabel != auxiliaryView);

  _likeButtonContainer.frame = layout.likeButtonFrame;
  _likeButton.frame = _likeButtonContainer.bounds;
  auxiliaryView.frame = layout.auxiliaryViewFrame;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  switch (self.likeControlAuxiliaryPosition) {
    case FBSDKLikeControlAuxiliaryPositionInline:{
      size.height = MAX(size.height, CGRectGetHeight(self.bounds));
      break;
    }
    case FBSDKLikeControlAuxiliaryPositionTop:
    case FBSDKLikeControlAuxiliaryPositionBottom:{
      size.width = MAX(size.width, CGRectGetWidth(self.bounds));
      break;
    }
  }

  CGRect bounds = CGRectMake(0.0, 0.0, size.width, size.height);
  return [self _layoutWithBounds:bounds subviewSizingBlock:^CGSize(UIView *subview, CGSize constrainedSize) {
    return [subview sizeThatFits:constrainedSize];
  }].contentSize;
}

#pragma mark - Internal Methods

- (NSDictionary *)analyticsParameters
{
  return @{
           @"auxiliary_position": NSStringFromFBSDKLikeControlAuxiliaryPosition(self.likeControlAuxiliaryPosition),
           @"horizontal_alignment": NSStringFromFBSDKLikeControlHorizontalAlignment(self.likeControlHorizontalAlignment),
           @"object_id": (self.objectID ?: [NSNull null]),
           @"object_type": (NSStringFromFBSDKLikeObjectType(self.objectType) ?: [NSNull null]),
           @"sound_enabled": @(self.soundEnabled),
           @"style": NSStringFromFBSDKLikeControlStyle(self.likeControlStyle),
           };
}

#pragma mark - Helper Methods

- (UIView *)_auxiliaryView
{
  [self _ensureLikeActionController];
  switch (_likeControlStyle) {
    case FBSDKLikeControlStyleStandard:{
      return (_socialSentenceLabel.text.length == 0 ? nil : _socialSentenceLabel);
    }
    case FBSDKLikeControlStyleBoxCount:{
      return (_likeButton.likeActionController.likeCountString == nil ? nil : _likeBoxView);
    }
  }
  return nil;
}

- (CGFloat)_auxiliaryViewPadding
{
  switch (_likeControlStyle) {
    case FBSDKLikeControlStyleStandard:{
      return 8.0;
    }
    case FBSDKLikeControlStyleBoxCount:{
      return 0.0;
    }
  }
  return 0.0;
}

- (void)_ensureLikeActionController
{
  FBSDKLikeActionController *likeActionController = _likeButton.likeActionController;
  if (likeActionController) {
    _socialSentenceLabel.text = likeActionController.socialSentence;
    _likeBoxView.text = likeActionController.likeCountString;
  }
}

- (void)_handleLikeButtonTap:(FBSDKLikeButton *)likeButton
{
  [self _ensureLikeActionController];
  [self sendActionsForControlEvents:UIControlEventTouchUpInside];
}

- (void)_initializeContent
{
  self.backgroundColor = [UIColor clearColor];
  _foregroundColor = [UIColor blackColor];

  _likeButtonContainer = [[UIView alloc] initWithFrame:CGRectZero];
  _likeButtonContainer.backgroundColor = self.backgroundColor;
  _likeButtonContainer.opaque = self.opaque;
  [self addSubview:_likeButtonContainer];

  _likeButton = [[FBSDKLikeButton alloc] initWithFrame:CGRectZero];
  [_likeButton addTarget:self action:@selector(_handleLikeButtonTap:) forControlEvents:UIControlEventTouchUpInside];
  [_likeButtonContainer addSubview:_likeButton];

  _socialSentenceLabel = [[UILabel alloc] initWithFrame:CGRectZero];
  _socialSentenceLabel.font = [UIFont systemFontOfSize:11.0];
  _socialSentenceLabel.numberOfLines = 2;
  [self addSubview:_socialSentenceLabel];

  _likeBoxView = [[FBSDKLikeBoxView alloc] initWithFrame:CGRectZero];
  [self addSubview:_likeBoxView];

  // use KVO to monitor changes to the likeActionController instance on FBSDKButton in order to avoid race conditions
  // between notification observers
  [_likeButton addObserver:self
                forKeyPath:@"likeActionController"
                   options:NSKeyValueObservingOptionInitial
                   context:FBSDKLikeControlKVOLikeActionControllerContext];

  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self
         selector:@selector(_likeActionControllerDidDisableNotification:)
             name:FBSDKLikeActionControllerDidDisableNotification
           object:nil];
  [nc addObserver:self
         selector:@selector(_likeActionControllerDidUpdateNotification:)
             name:FBSDKLikeActionControllerDidUpdateNotification
           object:nil];
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
  if (context == FBSDKLikeControlKVOLikeActionControllerContext) {
    [self _likeActionControllerDidUpdateWithAnimated:NO];
  } else {
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

static void FBSDKLikeControlApplyHorizontalAlignment(CGRect *frameRef,
                                                     CGRect bounds,
                                                     FBSDKLikeControlHorizontalAlignment alignment)
{
  if (frameRef == NULL) {
    return;
  }

  CGRect frame = *frameRef;
  switch (alignment) {
    case FBSDKLikeControlHorizontalAlignmentLeft:{
      frame.origin.x = CGRectGetMinX(bounds);
      break;
    }
    case FBSDKLikeControlHorizontalAlignmentCenter:{
      frame.origin.x = CGRectGetMinX(bounds) + floorf((CGRectGetWidth(bounds) - CGRectGetWidth(frame)) / 2);
      break;
    }
    case FBSDKLikeControlHorizontalAlignmentRight:{
      frame.origin.x = CGRectGetMinX(bounds) + CGRectGetWidth(bounds) - CGRectGetWidth(frame);
      break;
    }
  }
  *frameRef = frame;
}

static CGFloat FBSDKLikeControlPaddedDistance(CGFloat distance, CGFloat padding, BOOL includeDistance)
{
  return (distance == 0.0 ? 0.0 : (includeDistance ? distance : 0.0) + padding);
}

static CGSize FBSDKLikeControlCalculateContentSize(FBSDKLikeControlLayout layout)
{
  return CGSizeMake(MAX(CGRectGetMaxX(layout.likeButtonFrame), CGRectGetMaxX(layout.auxiliaryViewFrame)),
                    MAX(CGRectGetMaxY(layout.likeButtonFrame), CGRectGetMaxY(layout.auxiliaryViewFrame)));

}

- (FBSDKLikeControlLayout)_layoutWithBounds:(CGRect)bounds
                         subviewSizingBlock:(fbsdk_like_control_sizing_block_t)subviewSizingBlock
{
  FBSDKLikeControlLayout layout;

  CGSize likeButtonSize = subviewSizingBlock(_likeButton, bounds.size);
  layout.likeButtonFrame = CGRectMake(CGRectGetMinX(bounds),
                                      CGRectGetMinY(bounds),
                                      likeButtonSize.width,
                                      likeButtonSize.height);
  layout.auxiliaryViewFrame = CGRectZero;

  UIView *auxiliaryView = [self _auxiliaryView];
  CGFloat auxiliaryViewPadding = [self _auxiliaryViewPadding];
  CGSize auxiliaryViewSize = CGSizeZero;
  switch (self.likeControlAuxiliaryPosition) {
    case FBSDKLikeControlAuxiliaryPositionInline:{
      if (auxiliaryView) {
        auxiliaryViewSize = CGSizeMake((CGRectGetWidth(bounds) -
                                        auxiliaryViewPadding -
                                        CGRectGetWidth(layout.likeButtonFrame)),
                                       CGRectGetHeight(bounds));
        auxiliaryViewSize = subviewSizingBlock(auxiliaryView, auxiliaryViewSize);

        layout.auxiliaryViewFrame = CGRectMake(CGRectGetMinX(bounds),
                                               CGRectGetMinY(bounds),
                                               auxiliaryViewSize.width,
                                               MAX(auxiliaryViewSize.height,
                                                   CGRectGetHeight(layout.likeButtonFrame)));
      }

      // align the views next to each other for sizing
      FBSDKLikeControlApplyHorizontalAlignment(&layout.likeButtonFrame,
                                               bounds,
                                               FBSDKLikeControlHorizontalAlignmentLeft);
      if (auxiliaryView) {
        layout.auxiliaryViewFrame.origin.x = CGRectGetMaxX(layout.likeButtonFrame) + auxiliaryViewPadding;
      }

      // calculate the size before offsetting the horizontal alignment, using the total calculated width
      layout.contentSize = FBSDKLikeControlCalculateContentSize(layout);

      // layout the subviews next to each other
      switch (self.likeControlHorizontalAlignment) {
        case FBSDKLikeControlHorizontalAlignmentLeft:{
          // already done
          break;
        }
        case FBSDKLikeControlHorizontalAlignmentCenter:{
          layout.likeButtonFrame.origin.x = floorf((CGRectGetWidth(bounds) - layout.contentSize.width) / 2);
          if (auxiliaryView) {
            layout.auxiliaryViewFrame.origin.x = (CGRectGetMaxX(layout.likeButtonFrame) +
                                                  auxiliaryViewPadding);
          }
          break;
        }
        case FBSDKLikeControlHorizontalAlignmentRight:{
          layout.likeButtonFrame.origin.x = CGRectGetMaxX(bounds) - CGRectGetWidth(layout.likeButtonFrame);
          if (auxiliaryView) {
            layout.auxiliaryViewFrame.origin.x = (CGRectGetMinX(layout.likeButtonFrame) -
                                                  auxiliaryViewPadding -
                                                  CGRectGetWidth(layout.auxiliaryViewFrame));
          }
          break;
        }
      }

      break;
    }
    case FBSDKLikeControlAuxiliaryPositionTop:{
      if (auxiliaryView) {
        auxiliaryViewSize = CGSizeMake(CGRectGetWidth(bounds),
                                       (CGRectGetHeight(bounds) -
                                        auxiliaryViewPadding -
                                        CGRectGetHeight(layout.likeButtonFrame)));
        auxiliaryViewSize = subviewSizingBlock(auxiliaryView, auxiliaryViewSize);

        layout.auxiliaryViewFrame = CGRectMake(CGRectGetMinX(bounds),
                                               CGRectGetMinY(bounds),
                                               MAX(auxiliaryViewSize.width,
                                                   CGRectGetWidth(layout.likeButtonFrame)),
                                               auxiliaryViewSize.height);
      }
      layout.likeButtonFrame.origin.y = FBSDKLikeControlPaddedDistance(CGRectGetMaxY(layout.auxiliaryViewFrame),
                                                                       auxiliaryViewPadding,
                                                                       YES);

      // calculate the size before offsetting the horizontal alignment, using the total calculated width
      layout.contentSize = FBSDKLikeControlCalculateContentSize(layout);

      FBSDKLikeControlApplyHorizontalAlignment(&layout.likeButtonFrame, bounds, self.likeControlHorizontalAlignment);
      FBSDKLikeControlApplyHorizontalAlignment(&layout.auxiliaryViewFrame,
                                               bounds,
                                               self.likeControlHorizontalAlignment);
      break;
    }
    case FBSDKLikeControlAuxiliaryPositionBottom:{
      if (auxiliaryView) {
        auxiliaryViewSize = CGSizeMake(CGRectGetWidth(bounds),
                                       (CGRectGetHeight(bounds) -
                                        auxiliaryViewPadding -
                                        CGRectGetHeight(layout.likeButtonFrame)));
        auxiliaryViewSize = subviewSizingBlock(auxiliaryView, auxiliaryViewSize);

        layout.auxiliaryViewFrame = CGRectMake(CGRectGetMinX(bounds),
                                               CGRectGetMaxY(layout.likeButtonFrame) + auxiliaryViewPadding,
                                               MAX(auxiliaryViewSize.width,
                                                   CGRectGetWidth(layout.likeButtonFrame)),
                                               auxiliaryViewSize.height);
      }

      // calculate the size before offsetting the horizontal alignment, using the total calculated width
      layout.contentSize = FBSDKLikeControlCalculateContentSize(layout);

      FBSDKLikeControlApplyHorizontalAlignment(&layout.likeButtonFrame, bounds, self.likeControlHorizontalAlignment);
      FBSDKLikeControlApplyHorizontalAlignment(&layout.auxiliaryViewFrame,
                                               bounds,
                                               self.likeControlHorizontalAlignment);
      break;
    }
  }

  return layout;
}

- (void)_likeActionControllerDidDisableNotification:(NSNotification *)notification
{
  [self _updateEnabled];
}

- (void)_likeActionControllerDidUpdateNotification:(NSNotification *)notification
{
  [self _ensureLikeActionController];
  FBSDKLikeActionController *likeActionController = (FBSDKLikeActionController *)notification.object;
  NSString *objectID = likeActionController.objectID;
  if ([self.objectID isEqualToString:objectID]) {
    BOOL animated = [notification.userInfo[FBSDKLikeActionControllerAnimatedKey] boolValue];
    [self _likeActionControllerDidUpdateWithAnimated:animated];
  }
}

- (void)_likeActionControllerDidUpdateWithAnimated:(BOOL)animated
{
  FBSDKLikeActionController *likeActionController = _likeButton.likeActionController;
  NSString *objectID = likeActionController.objectID;
  if ([self.objectID isEqualToString:objectID]) {
    _likeBoxView.text = _likeButton.likeActionController.likeCountString;

    if (animated) {
      void(^hideView)(UIView *) = ^(UIView *view){
        view.alpha = 0.0;
        CGRect frame = view.frame;
        frame.origin.y += kFBLikeControlSocialSentenceAnimationOffset;
        view.frame = frame;
      };
      [UIView animateWithDuration:kFBLikeControlAnimationDuration animations:^{
        hideView(self->_socialSentenceLabel);
      } completion:^(BOOL finished) {
        self->_socialSentenceLabel.text = likeActionController.socialSentence;
        [self setNeedsLayout];
        [self setNeedsUpdateConstraints];
        [self invalidateIntrinsicContentSize];
        [self layoutIfNeeded];
        hideView(self->_socialSentenceLabel);

        [UIView animateWithDuration:kFBLikeControlAnimationDuration animations:^{
          self->_socialSentenceLabel.alpha = 1.0;
          [self setNeedsLayout];
          [self layoutIfNeeded];
        }];
      }];
    } else {
      _socialSentenceLabel.text = likeActionController.socialSentence;
      [self setNeedsLayout];
      [self setNeedsUpdateConstraints];
      [self invalidateIntrinsicContentSize];
    }

    [self sendActionsForControlEvents:UIControlEventValueChanged];
  }
}

- (void)_updateEnabled
{
  BOOL enabled = (!_isExplicitlyDisabled &&
                  self.objectID &&
                  ![FBSDKLikeActionController isDisabled]);
  BOOL currentEnabled = self.enabled;
  super.enabled = enabled;
  if (currentEnabled != enabled) {
    [self invalidateIntrinsicContentSize];
    [self setNeedsLayout];
  }
}

- (void)_updateLikeBoxCaretPosition
{
  if (self.likeControlStyle != FBSDKLikeControlStyleBoxCount) {
    return;
  }

  switch (self.likeControlAuxiliaryPosition) {
    case FBSDKLikeControlAuxiliaryPositionInline:{
      switch (self.likeControlHorizontalAlignment) {
        case FBSDKLikeControlHorizontalAlignmentLeft:
        case FBSDKLikeControlHorizontalAlignmentCenter:{
          _likeBoxView.caretPosition = FBSDKLikeBoxCaretPositionLeft;
          break;
        }
        case FBSDKLikeControlHorizontalAlignmentRight:{
          _likeBoxView.caretPosition = FBSDKLikeBoxCaretPositionRight;
          break;
        }
      }
      break;
    }
    case FBSDKLikeControlAuxiliaryPositionTop:{
      _likeBoxView.caretPosition = FBSDKLikeBoxCaretPositionBottom;
      break;
    }
    case FBSDKLikeControlAuxiliaryPositionBottom:{
      _likeBoxView.caretPosition = FBSDKLikeBoxCaretPositionTop;
      break;
    }
  }
}

@end
