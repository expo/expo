/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTMultilineTextInputView.h>

#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>

#import <ABI48_0_0React/ABI48_0_0RCTUITextView.h>

@implementation ABI48_0_0RCTMultilineTextInputView {
  ABI48_0_0RCTUITextView *_backedTextInputView;
}

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    _backedTextInputView = [[ABI48_0_0RCTUITextView alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<ABI48_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  ABI48_0_0RCTDirectEventBlock onScroll = self.onScroll;

  if (onScroll) {
    CGPoint contentOffset = scrollView.contentOffset;
    CGSize contentSize = scrollView.contentSize;
    CGSize size = scrollView.bounds.size;
    UIEdgeInsets contentInset = scrollView.contentInset;

    onScroll(@{
      @"contentOffset" : @{@"x" : @(contentOffset.x), @"y" : @(contentOffset.y)},
      @"contentInset" : @{
        @"top" : @(contentInset.top),
        @"left" : @(contentInset.left),
        @"bottom" : @(contentInset.bottom),
        @"right" : @(contentInset.right)
      },
      @"contentSize" : @{@"width" : @(contentSize.width), @"height" : @(contentSize.height)},
      @"layoutMeasurement" : @{@"width" : @(size.width), @"height" : @(size.height)},
      @"zoomScale" : @(scrollView.zoomScale ?: 1),
    });
  }
}

@end
