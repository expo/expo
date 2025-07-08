// Copyright 2015-present 650 Industries. All rights reserved.

#import "LinkPreviewNativeNavigation.h"
#import <Foundation/Foundation.h>
#include <Foundation/NSObjCRuntime.h>
#import <RNScreens/RNSScreen.h>
#import <RNScreens/RNSScreenStack.h>

@implementation LinkPreviewNativeNavigation {
  RNSScreenView *preloadedScreenView;
  RNSScreenStackView *stackView;
}

- (void)pushPreloadedView {
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
            // We need to set the activity of inner screen as well, because its react value is the same as the preloaded screen - 0.
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

- (void)updatePreloadedView:(nullable NSString *)screenId
            withUiResponder:(nonnull UIResponder *)responder {
  if (screenId != nil && [screenId length] > 0) {
    if ([self setPreloadedScreenViewWithScreenId:screenId
                                 withUiResponder:responder]) {
      NSLog(@"ExpoRouter: Preloaded screen view updated.");
    } else {
      NSLog(@"ExpoRouter: No native screen view found with screenId: %@",
            screenId);
    }
  } else {
    preloadedScreenView = nil;
  }
}

- (nonnull NSArray<RNSScreenStackView *> *)
    findAllScreenStackViewsInResponderChain:(nonnull UIResponder *)responder {
  NSMutableArray<RNSScreenStackView *> *stackViews = [NSMutableArray array];

  while (responder) {
    responder = [responder nextResponder];
    if ([responder isKindOfClass:[RNSScreenStackView class]]) {
      [stackViews addObject:(RNSScreenStackView *)responder];
    }
  }

  return stackViews;
}

- (nonnull NSArray<RNSScreenView *> *)extractScreenViewsFromSubviews:
    (nonnull NSArray<UIView *> *)subviews {
  NSMutableArray<RNSScreenView *> *screenViews = [NSMutableArray array];

  for (UIView *subview in subviews) {
    if ([subview isKindOfClass:[RNSScreenView class]]) {
      [screenViews addObject:(RNSScreenView *)subview];
    }
  }
  return screenViews;
}

- (BOOL)setPreloadedScreenViewWithScreenId:(nonnull NSString *)screenId
                           withUiResponder:(nonnull UIResponder *)responder {
  NSArray<RNSScreenStackView *> *stacks =
      [self findAllScreenStackViewsInResponderChain:responder];

  for (RNSScreenStackView *stack in stacks) {
    if ([stack.screenIds containsObject:screenId] &&
        [self setPreloadedScreenViewWithScreenId:screenId
                                   withStackView:stack]) {
      return YES;
    }
  }
  return NO;
}

- (BOOL)setPreloadedScreenViewWithScreenId:(nonnull NSString *)screenId
                             withStackView:(nonnull RNSScreenStackView *)stack {
  NSArray<RNSScreenView *> *screenSubviews =
      [self extractScreenViewsFromSubviews:stack.reactSubviews];
  RNSScreenView *screenView = [self findPreloadedScreenView:screenSubviews
                                               withScreenId:screenId];
  if (screenView != nil) {
    preloadedScreenView = screenView;
    stackView = stack;
    return YES;
  }
  return NO;
}

- (nullable RNSScreenView *)
    findPreloadedScreenView:(nonnull NSArray<RNSScreenView *> *)screenViews
               withScreenId:(nonnull NSString *)screenId {
  for (RNSScreenView *screenView in screenViews) {
    if (screenView.activityState == 0 &&
        [screenView.screenId isEqualToString:screenId]) {
      return screenView;
    }
  }
  return nil;
}

@end
