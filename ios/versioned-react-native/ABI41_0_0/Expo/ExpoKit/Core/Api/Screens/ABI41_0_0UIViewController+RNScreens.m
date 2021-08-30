#import "ABI41_0_0UIViewController+RNScreens.h"
#import "ABI41_0_0RNSScreenContainer.h"

#import <objc/runtime.h>

@implementation UIViewController (ABI41_0_0RNScreens)

#if !TARGET_OS_TV
- (UIViewController *)ABI41_0_0ReactNativeScreensChildViewControllerForStatusBarStyle
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ?: [self ABI41_0_0ReactNativeScreensChildViewControllerForStatusBarStyle];
}

- (UIViewController *)ABI41_0_0ReactNativeScreensChildViewControllerForStatusBarHidden
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ?: [self ABI41_0_0ReactNativeScreensChildViewControllerForStatusBarHidden];
}

- (UIStatusBarAnimation)ABI41_0_0ReactNativeScreensPreferredStatusBarUpdateAnimation
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ? childVC.preferredStatusBarUpdateAnimation : [self ABI41_0_0ReactNativeScreensPreferredStatusBarUpdateAnimation];
}

- (UIInterfaceOrientationMask)ABI41_0_0ReactNativeScreensSupportedInterfaceOrientations
{
  UIViewController *childVC = [self findChildRNScreensViewController];
  return childVC ? childVC.supportedInterfaceOrientations : [self ABI41_0_0ReactNativeScreensSupportedInterfaceOrientations];
}

- (UIViewController *)findChildRNScreensViewController
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if ([lastViewController conformsToProtocol:@protocol(ABI41_0_0RNScreensViewControllerDelegate)]) {
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
                                  class_getInstanceMethod(uiVCClass, @selector(ABI41_0_0ReactNativeScreensChildViewControllerForStatusBarStyle)));

   method_exchangeImplementations(class_getInstanceMethod(uiVCClass, @selector(childViewControllerForStatusBarHidden)),
                                  class_getInstanceMethod(uiVCClass, @selector(ABI41_0_0ReactNativeScreensChildViewControllerForStatusBarHidden)));
   
   method_exchangeImplementations(class_getInstanceMethod(uiVCClass, @selector(preferredStatusBarUpdateAnimation)),
                                  class_getInstanceMethod(uiVCClass, @selector(ABI41_0_0ReactNativeScreensPreferredStatusBarUpdateAnimation)));

   method_exchangeImplementations(class_getInstanceMethod(uiVCClass, @selector(supportedInterfaceOrientations)),
                                  class_getInstanceMethod(uiVCClass, @selector(ABI41_0_0ReactNativeScreensSupportedInterfaceOrientations)));
  });
}
#endif

@end
