#import "RNSScreenContainer.h"
#import "UIViewController+RNScreens.h"

#import <objc/runtime.h>

@implementation UIViewController (RNScreens)

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
  return childVC ? childVC.preferredStatusBarUpdateAnimation
                 : [self reactNativeScreensPreferredStatusBarUpdateAnimation];
}

- (UIInterfaceOrientationMask)reactNativeScreensSupportedInterfaceOrientations
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ? childVC.supportedInterfaceOrientations : [self reactNativeScreensSupportedInterfaceOrientations];
}

- (UIViewController *)reactNativeScreensChildViewControllerForHomeIndicatorAutoHidden
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ?: [self reactNativeScreensChildViewControllerForHomeIndicatorAutoHidden];
}

- (UIViewController *)findChildRNScreensViewController
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if ([lastViewController conformsToProtocol:@protocol(RNScreensViewControllerDelegate)]) {
    return lastViewController;
  }
  return nil;
}

+ (void)load
{
  static dispatch_once_t once_token;
  dispatch_once(&once_token, ^{
    Class uiVCClass = [UIViewController class];

    method_exchangeImplementations(
        class_getInstanceMethod(uiVCClass, @selector(childViewControllerForStatusBarStyle)),
        class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensChildViewControllerForStatusBarStyle)));

    method_exchangeImplementations(
        class_getInstanceMethod(uiVCClass, @selector(childViewControllerForStatusBarHidden)),
        class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensChildViewControllerForStatusBarHidden)));

    method_exchangeImplementations(
        class_getInstanceMethod(uiVCClass, @selector(preferredStatusBarUpdateAnimation)),
        class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensPreferredStatusBarUpdateAnimation)));

    method_exchangeImplementations(
        class_getInstanceMethod(uiVCClass, @selector(supportedInterfaceOrientations)),
        class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensSupportedInterfaceOrientations)));

    method_exchangeImplementations(
        class_getInstanceMethod(uiVCClass, @selector(childViewControllerForHomeIndicatorAutoHidden)),
        class_getInstanceMethod(uiVCClass, @selector(reactNativeScreensChildViewControllerForHomeIndicatorAutoHidden)));
  });
}
#endif

@end
