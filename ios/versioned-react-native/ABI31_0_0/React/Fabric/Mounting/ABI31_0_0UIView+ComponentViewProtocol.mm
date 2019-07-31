/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0UIView+ComponentViewProtocol.h"

#import <ReactABI31_0_0/ABI31_0_0RCTAssert.h>
#import "ABI31_0_0RCTConversions.h"

using namespace facebook::ReactABI31_0_0;

@implementation UIView (ComponentViewProtocol)

- (void)mountChildComponentView:(UIView<ABI31_0_0RCTComponentViewProtocol> *)childComponentView
                          index:(NSInteger)index
{
  [self insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<ABI31_0_0RCTComponentViewProtocol> *)childComponentView
                            index:(NSInteger)index
{
  ABI31_0_0RCTAssert(childComponentView.superview == self, @"Attempt to unmount improperly mounted component view.");
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(SharedProps)props
           oldProps:(SharedProps)oldProps
{
  // Default implementation does nothing.
}

- (void)updateEventEmitter:(SharedEventEmitter)eventEmitter
{
  // Default implementation does nothing.
}

- (void)updateLocalData:(SharedLocalData)localData
           oldLocalData:(SharedLocalData)oldLocalData
{
  // Default implementation does nothing.
}

- (void)updateLayoutMetrics:(LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics)oldLayoutMetrics
{
  if (layoutMetrics.frame != oldLayoutMetrics.frame) {
    self.frame = ABI31_0_0RCTCGRectFromRect(layoutMetrics.frame);
  }

  if (layoutMetrics.layoutDirection != oldLayoutMetrics.layoutDirection) {
    self.semanticContentAttribute =
      layoutMetrics.layoutDirection == LayoutDirection::RightToLeft ?
        UISemanticContentAttributeForceRightToLeft :
        UISemanticContentAttributeForceLeftToRight;
  }

  if (layoutMetrics.displayType != oldLayoutMetrics.displayType) {
    self.hidden = layoutMetrics.displayType == DisplayType::None;
  }
}

- (void)prepareForRecycle
{
  // Default implementation does nothing.
}

@end
