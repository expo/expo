#import <UIKit/UIKit.h>
#import <React/RCTView.h>

static BOOL UIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold)
{
  return ABS(insets1.left - insets2.left) <= threshold &&
    ABS(insets1.right - insets2.right) <= threshold &&
    ABS(insets1.top - insets2.top) <= threshold &&
    ABS(insets1.bottom - insets2.bottom) <= threshold;
}

NS_ASSUME_NONNULL_BEGIN

@interface RCTView(SafeAreaCompat)

- (BOOL)nativeSafeAreaSupport;
- (UIEdgeInsets)realOrEmulateSafeAreaInsets:(BOOL)emulate;

@end

NS_ASSUME_NONNULL_END
