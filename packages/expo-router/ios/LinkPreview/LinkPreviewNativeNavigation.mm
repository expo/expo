// Copyright 2015-present 650 Industries. All rights reserved.

#import "LinkPreviewNativeNavigation.h"
#import <Foundation/Foundation.h>
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

- (nonnull NSArray<RNSScreenStackView *> *)findAllScreenStackViewsInResponderChain:
    (nonnull UIResponder *)responder {
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

- (nullable RNSScreenView *)findPreloadedScreenView:
                       (nonnull NSArray<RNSScreenView *> *)screenViews
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
