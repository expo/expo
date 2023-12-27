#import "ABI43_0_0RNCSafeAreaProvider.h"

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import "ABI43_0_0RCTView+SafeAreaCompat.h"

@implementation ABI43_0_0RNCSafeAreaProvider
{
  UIEdgeInsets _currentSafeAreaInsets;
  CGRect _currentFrame;
  BOOL _initialInsetsSent;
}

- (void)safeAreaInsetsDidChange
{
  [self invalidateSafeAreaInsets];
}

- (void)invalidateSafeAreaInsets
{
  // This gets called before the view size is set by ABI43_0_0React-native so
  // make sure to wait so we don't set wrong insets to JS.
  if (CGSizeEqualToSize(self.frame.size, CGSizeZero)) {
    return;
  }

  UIEdgeInsets safeAreaInsets = [self safeAreaInsetsOrEmulate];
  CGRect frame = [self convertRect:self.bounds toView:nil];

  if (
    _initialInsetsSent &&
    ABI43_0_0UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / ABI43_0_0RCTScreenScale()) &&
    CGRectEqualToRect(frame, _currentFrame)
  ) {
    return;
  }

  _initialInsetsSent = YES;
  _currentSafeAreaInsets = safeAreaInsets;
  _currentFrame = frame;

  self.onInsetsChange(@{
    @"insets": @{
      @"top": @(safeAreaInsets.top),
      @"right": @(safeAreaInsets.right),
      @"bottom": @(safeAreaInsets.bottom),
      @"left": @(safeAreaInsets.left),
    },
    @"frame": @{
      @"x": @(frame.origin.x),
      @"y": @(frame.origin.y),
      @"width": @(frame.size.width),
      @"height": @(frame.size.height),
    },
  });
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  [self invalidateSafeAreaInsets];
}

@end
