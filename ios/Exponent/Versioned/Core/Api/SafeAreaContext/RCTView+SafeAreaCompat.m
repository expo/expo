#import "RCTView+SafeAreaCompat.h"

#import <React/RCTUIManager.h>

@implementation RCTView(SafeAreaCompat)

- (BOOL)nativeSafeAreaSupport
{
  return [self respondsToSelector:@selector(safeAreaInsets)];
}

- (UIEdgeInsets)realOrEmulateSafeAreaInsets:(BOOL)emulate
{
  #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
  if (self.nativeSafeAreaSupport) {
    if (@available(iOS 11.0, *)) {
       return self.safeAreaInsets;
    }
  }
  #endif
  return emulate ? self.emulatedSafeAreaInsets : UIEdgeInsetsZero;
}

- (UIEdgeInsets)emulatedSafeAreaInsets
{
  UIViewController* vc = self.reactViewController;

  if (!vc) {
    return UIEdgeInsetsZero;
  }

  CGFloat topLayoutOffset = vc.topLayoutGuide.length;
  CGFloat bottomLayoutOffset = vc.bottomLayoutGuide.length;
  CGRect safeArea = vc.view.bounds;
  safeArea.origin.y += topLayoutOffset;
  safeArea.size.height -= topLayoutOffset + bottomLayoutOffset;
  CGRect localSafeArea = [vc.view convertRect:safeArea toView:self];
  UIEdgeInsets safeAreaInsets = UIEdgeInsetsMake(0, 0, 0, 0);
  if (CGRectGetMinY(localSafeArea) > CGRectGetMinY(self.bounds)) {
    safeAreaInsets.top = CGRectGetMinY(localSafeArea) - CGRectGetMinY(self.bounds);
  }
  if (CGRectGetMaxY(localSafeArea) < CGRectGetMaxY(self.bounds)) {
    safeAreaInsets.bottom = CGRectGetMaxY(self.bounds) - CGRectGetMaxY(localSafeArea);
  }

  return safeAreaInsets;
}

@end
