// Copyright 2015-present 650 Industries. All rights reserved.

#import "LinkPreviewNativeNavigation.h"
#import <Foundation/Foundation.h>
#include <Foundation/NSObjCRuntime.h>
#import <RNScreens/RNSScreen.h>
#import <RNScreens/RNSScreenStack.h>

@implementation LinkPreviewNativeNavigationObjC {
}

+ (BOOL)isRNSScreenStackView:(UIView *)view {
  if (view != nil) {
    return [view isKindOfClass:[RNSScreenStackView class]];
  }

  return NO;
}

+ (BOOL)isRNSBottomTabsScreenComponentView:(UIView *)view {
  if (view != nil) {
    return [view isKindOfClass:[RNSBottomTabsScreenComponentView class]];
  }

  return NO;
}

+ (BOOL)isRNSBottomTabsHostComponentView:(UIView *)view {
  if (view != nil) {
    return [view isKindOfClass:[RNSBottomTabsHostComponentView class]];
  }

  return NO;
}

+ (nullable UITabBarController *)getBottomTabControllerFromView:(UIView *)view {
  if ([view isKindOfClass:[RNSBottomTabsScreenComponentView class]]) {
    RNSBottomTabsScreenComponentView *bottomTabsView =
        (RNSBottomTabsScreenComponentView *)view;
    UIViewController *reactVC = [bottomTabsView reactViewController];
    if (reactVC != nil &&
        [reactVC.tabBarController isKindOfClass:[RNSTabBarController class]]) {
      RNSTabBarController *tabBarController =
          (RNSTabBarController *)reactVC.tabBarController;
      return tabBarController;
    }
  }
  if ([view isKindOfClass:[RNSBottomTabsHostComponentView class]]) {
    RNSBottomTabsHostComponentView *bottomTabsView =
        (RNSBottomTabsHostComponentView *)view;
    return [bottomTabsView controller];
  }
  return nil;
}

+ (nullable UIView *)getTab:(UITabBarController *)controller
                    withKey:(NSString *)key {
  if (controller != nil) {
    for (UIViewController *subcontroller in controller.viewControllers) {
      if ([subcontroller.view
              isKindOfClass:[RNSBottomTabsScreenComponentView class]]) {
        if (((RNSBottomTabsScreenComponentView *)subcontroller.view).tabKey ==
            key) {
          return subcontroller.view;
        }
      }
    }
  }

  return nil;
}

+ (nonnull NSArray<NSString *> *)getStackViewScreenIds:(UIView *)view {
  if (view != nil && [view isKindOfClass:[RNSScreenStackView class]]) {
    RNSScreenStackView *stackView = (RNSScreenStackView *)view;
    return stackView.screenIds;
  }
  return @[];
}

+ (nonnull NSArray<UIView *> *)getScreenViews:(UIView *)view {
  if (view != nil && [view isKindOfClass:[RNSScreenStackView class]]) {
    RNSScreenStackView *stackView = (RNSScreenStackView *)view;
    return stackView.reactSubviews;
  }
  return @[];
}

+ (nonnull NSString *)getScreenId:(UIView *)view {
  if (view != nil && [view isKindOfClass:[RNSScreenView class]]) {
    RNSScreenView *screenView = (RNSScreenView *)view;
    return screenView.screenId;
  }
  return nil;
}

+ (nonnull NSString *)getTabKey:(UIView *)view {
  if (view != nil &&
      [view isKindOfClass:[RNSBottomTabsScreenComponentView class]]) {
    RNSBottomTabsScreenComponentView *tabScreenView =
        (RNSBottomTabsScreenComponentView *)view;
    return tabScreenView.tabKey;
  }
  return @"";
}

+ (void)pushPreloadedView:(nonnull UIView *)view
            ontoStackView:(nonnull UIView *)rawStackView {
  if (![LinkPreviewNativeNavigationObjC isRNSScreenStackView:rawStackView]) {
    NSLog(@"ExpoRouter: The provided stack view is not a RNSScreenStackView.");
    return;
  }
  if (![view isKindOfClass:[RNSScreenView class]]) {
    NSLog(@"ExpoRouter: The provided view is not a RNSScreenView.");
    return;
  }
  RNSScreenStackView *stackView = (RNSScreenStackView *)rawStackView;
  RNSScreenView *preloadedScreenView = (RNSScreenView *)view;
  if (preloadedScreenView != nil && stackView != nil) {
    // Instead of pushing the preloaded screen view, we set its activity state
    // React native screens will then handle the rest.
    [preloadedScreenView setActivityState:2];
    [stackView markChildUpdated];
    // If the screen is modal with header then it will have exactly one child -
    // RNSNavigationController.
    // https://github.com/software-mansion/react-native-screens/blob/8b82e081e8fdfa6e0864821134bda9e87a745b00/src/components/ScreenStackItem.tsx#L146-L160
    if (preloadedScreenView.isModal &&
        preloadedScreenView.controller.childViewControllers.count == 1) {
      // The first child should be RNSNavigationController (<ScreenStack>).
      UIViewController *navController =
          preloadedScreenView.controller.childViewControllers[0];
      if ([navController isKindOfClass:[RNSNavigationController class]]) {
        RNSNavigationController *rnsNavController =
            (RNSNavigationController *)navController;
        // The delegate of RNSNavigationController is RNSScreenStackView.
        id<UINavigationControllerDelegate> delegate = rnsNavController.delegate;
        if ([delegate isKindOfClass:[RNSScreenStackView class]]) {
          RNSScreenStackView *innerScreenStack = (RNSScreenStackView *)delegate;
          // The first and only child of the inner screen stack should be
          // RNSScreenView (<ScreenStackItem>).
          UIView *firstChild = innerScreenStack.reactSubviews != nil
                                   ? innerScreenStack.reactSubviews[0]
                                   : nil;
          if (firstChild != nil &&
              [firstChild isKindOfClass:[RNSScreenView class]]) {
            RNSScreenView *screenContentView = (RNSScreenView *)firstChild;
            // Same as above, we let React Native Screens handle the transition.
            // We need to set the activity of inner screen as well, because its
            // react value is the same as the preloaded screen - 0.
            // https://github.com/software-mansion/react-native-screens/blob/8b82e081e8fdfa6e0864821134bda9e87a745b00/src/components/ScreenStackItem.tsx#L151
            [screenContentView setActivityState:2];
            [innerScreenStack markChildUpdated];
          }
        }
      }
    }
    NSLog(@"ExpoRouter: Preloaded screen view pushed.");
  } else {
    NSLog(@"ExpoRouter: No preloaded screen view found. Relying on JS "
          @"navigation.");
  }
}

@end
