#import "UIViewController+ABI42_0_0RNScreens.h"
#import "ABI42_0_0RNSScreenContainer.h"

#import <objc/runtime.h>

@implementation UIViewController (ABI42_0_0RNScreens)

#if !TARGET_OS_TV
- (UIViewController *)reactNativeScreensChildViewControllerForStatusBarStyle
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ?: [self reactNativeScreensChildViewControllerForStatusBarStyle];
}

- (UIViewController *)reactNativeScreensChildViewControllerForStatusBarHidden
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ?: [self reactNativeScreensChildViewControllerForStatusBarHidden];
}

- (UIStatusBarAnimation)reactNativeScreensPreferredStatusBarUpdateAnimation
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ? childVC.preferredStatusBarUpdateAnimation : [self reactNativeScreensPreferredStatusBarUpdateAnimation];
}

- (UIInterfaceOrientationMask)reactNativeScreensSupportedInterfaceOrientations
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ? childVC.supportedInterfaceOrientations : [self reactNativeScreensSupportedInterfaceOrientations];
}

- (UIViewController *)findChildRNScreensViewController
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if ([lastViewController conformsToProtocol:@protocol(ABI42_0_0RNScreensViewControllerDelegate)]) {
    return lastViewController;
  }
  return nil;
}

+ (void)load
{
  static dispatch_once_t once_token;
  dispatch_once(&once_token,  ^{
   Class uiVCClass = [UIViewController class];
   
   method_exchangeImplementations(class_getInstanceMethod(uiVCClass, @selector(childViewControllerForStatusBarStyle)),
                                  class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensChildViewControllerForStatusBarStyle)));

   method_exchangeImplementations(class_getInstanceMethod(uiVCClass, @selector(childViewControllerForStatusBarHidden)),
                                  class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensChildViewControllerForStatusBarHidden)));
   
   method_exchangeImplementations(class_getInstanceMethod(uiVCClass, @selector(preferredStatusBarUpdateAnimation)),
                                  class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensPreferredStatusBarUpdateAnimation)));

   method_exchangeImplementations(class_getInstanceMethod(uiVCClass, @selector(supportedInterfaceOrientations)),
                                  class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensSupportedInterfaceOrientations)));
  });
}
#endif

@end
