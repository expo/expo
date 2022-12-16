#import "ABI45_0_0RNCSafeAreaUtils.h"

#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>

NSString * const ABI45_0_0RNCSafeAreaDidChange = @"ABI45_0_0RNCSafeAreaDidChange";

BOOL ABI45_0_0UIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold)
{
  return ABS(insets1.left - insets2.left) <= threshold && ABS(insets1.right - insets2.right) <= threshold &&
      ABS(insets1.top - insets2.top) <= threshold && ABS(insets1.bottom - insets2.bottom) <= threshold;
}
