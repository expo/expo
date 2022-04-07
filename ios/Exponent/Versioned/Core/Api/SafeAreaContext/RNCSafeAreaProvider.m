#import "RNCSafeAreaProvider.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import "RNCSafeAreaUtils.h"

@implementation RNCSafeAreaProvider {
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
  // This gets called before the view size is set by react-native so
  // make sure to wait so we don't set wrong insets to JS.
  if (CGSizeEqualToSize(self.frame.size, CGSizeZero)) {
    return;
  }

  UIEdgeInsets safeAreaInsets = self.safeAreaInsets;
  CGRect frame = [self convertRect:self.bounds toView:nil];

  if (_initialInsetsSent &&
      UIEdgeInsetsEqualToEdgeInsetsWithThreshold(safeAreaInsets, _currentSafeAreaInsets, 1.0 / RCTScreenScale()) &&
      CGRectEqualToRect(frame, _currentFrame)) {
    return;
  }

  _initialInsetsSent = YES;
  _currentSafeAreaInsets = safeAreaInsets;
  _currentFrame = frame;

  [NSNotificationCenter.defaultCenter
   postNotificationName:RNCSafeAreaDidChange
   object:self
   userInfo:nil];

  self.onInsetsChange(@{
    @"insets" : @{
      @"top" : @(safeAreaInsets.top),
      @"right" : @(safeAreaInsets.right),
      @"bottom" : @(safeAreaInsets.bottom),
      @"left" : @(safeAreaInsets.left),
    },
    @"frame" : @{
      @"x" : @(frame.origin.x),
      @"y" : @(frame.origin.y),
      @"width" : @(frame.size.width),
      @"height" : @(frame.size.height),
    },
  });
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  [self invalidateSafeAreaInsets];
}

@end
