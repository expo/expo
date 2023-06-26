/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0UIView+ComponentViewProtocol.h"

#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>

#import "ABI49_0_0RCTConversions.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

@implementation UIView (ComponentViewProtocol)

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  ABI49_0_0RCTAssert(NO, @"`-[ABI49_0_0RCTComponentViewProtocol componentDescriptorProvider]` must be implemented in a concrete class.");
  return {};
}

+ (std::vector<ABI49_0_0facebook::ABI49_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
{
  return {};
}

- (void)mountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  ABI49_0_0RCTAssert(
      childComponentView.superview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));
  [self insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  ABI49_0_0RCTAssert(
      childComponentView.superview == self,
      @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
      self,
      childComponentView,
      @(index));
  ABI49_0_0RCTAssert(
      (self.subviews.count > index) && [self.subviews objectAtIndex:index] == childComponentView,
      @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
      self,
      childComponentView,
      @(index),
      @([self.subviews indexOfObject:childComponentView]),
      @([[self.subviews objectAtIndex:index] tag]));

  [childComponentView removeFromSuperview];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  // Default implementation does nothing.
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter
{
  // Default implementation does nothing.
}

- (void)updateState:(ABI49_0_0facebook::ABI49_0_0React::State::Shared const &)state
           oldState:(ABI49_0_0facebook::ABI49_0_0React::State::Shared const &)oldState
{
  // Default implementation does nothing.
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args
{
  // Default implementation does nothing.
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  bool forceUpdate = oldLayoutMetrics == EmptyLayoutMetrics;

  if (forceUpdate || (layoutMetrics.frame != oldLayoutMetrics.frame)) {
    CGRect frame = ABI49_0_0RCTCGRectFromRect(layoutMetrics.frame);

    if (!std::isfinite(frame.origin.x) || !std::isfinite(frame.origin.y) || !std::isfinite(frame.size.width) ||
        !std::isfinite(frame.size.height)) {
      // CALayer will crash if we pass NaN or Inf values.
      // It's unclear how to detect this case on cross-platform manner holistically, so we have to do it on the mounting
      // layer as well. NaN/Inf is a kinda valid result of some math operations. Even if we can (and should) detect (and
      // report early) incorrect (NaN and Inf) values which come from JavaScript side, we sometimes cannot backtrace the
      // sources of a calculation that produced an incorrect/useless result.
      ABI49_0_0RCTLogWarn(
          @"-[UIView(ComponentViewProtocol) updateLayoutMetrics:oldLayoutMetrics:]: Received invalid layout metrics (%@) for a view (%@).",
          NSStringFromCGRect(frame),
          self);
    } else {
      // Note: Changing `frame` when `layer.transform` is not the `identity transform` is undefined behavior.
      // Therefore, we must use `center` and `bounds`.
      self.center = CGPoint{CGRectGetMidX(frame), CGRectGetMidY(frame)};
      self.bounds = CGRect{CGPointZero, frame.size};
    }
  }

  if (forceUpdate || (layoutMetrics.layoutDirection != oldLayoutMetrics.layoutDirection)) {
    self.semanticContentAttribute = layoutMetrics.layoutDirection == LayoutDirection::RightToLeft
        ? UISemanticContentAttributeForceRightToLeft
        : UISemanticContentAttributeForceLeftToRight;
  }

  if (forceUpdate || (layoutMetrics.displayType != oldLayoutMetrics.displayType)) {
    self.hidden = layoutMetrics.displayType == DisplayType::None;
  }
}

- (void)finalizeUpdates:(ABI49_0_0RNComponentViewUpdateMask)updateMask
{
  // Default implementation does nothing.
}

- (void)prepareForRecycle
{
  // Default implementation does nothing.
}

- (ABI49_0_0facebook::ABI49_0_0React::Props::Shared)props
{
  ABI49_0_0RCTAssert(NO, @"props access should be implemented by ABI49_0_0RCTViewComponentView.");
  return nullptr;
}

- (BOOL)isJSResponder
{
  // Default implementation always returns `NO`.
  return NO;
}

- (void)setIsJSResponder:(BOOL)isJSResponder
{
  // Default implementation does nothing.
}

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)propKeys
{
  // Default implementation does nothing.
}

- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN
{
  return nil;
}

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  clipRect = [clipView convertRect:clipRect toView:self];

  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it
  for (UIView *subview in self.subviews) {
    [subview updateClippedSubviewsWithClipRect:clipRect relativeToView:self];
  }
}

@end
