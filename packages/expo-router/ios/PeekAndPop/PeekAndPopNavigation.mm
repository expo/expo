//
//  PeekAndPopNavigation.m
//  ScreensWrapper
//
//  Created by Jakub Tkacz on 04/06/2025.
//

#import "PeekAndPopNavigation.h"
#import <Foundation/Foundation.h>
#import <RNScreens/RNSScreen.h>
#import <RNScreens/RNSScreenStack.h>

@interface PeekAndPopNavigation ()

@end

@implementation PeekAndPopNavigation {
    RNSScreenView *preloadedScreenView;
}

- (void)pushPreloadedView:(UIResponder *)responder{
  RNSScreenStackView *stack = [self findScreenStackViewInResponderChain:responder];

  if (preloadedScreenView != nil && stack != nil) {
    [preloadedScreenView setActivityState:2];
    [stack markChildUpdated];
    NSLog(@"Preloaded screen view pushed.");
  } else {
    NSLog(@"No preloaded screen view found.");
  }
}

- (void)updatePreloadedView:(int)tag withUiResponder:(UIResponder *)responder {
  if (tag > 0) {
    preloadedScreenView = [self findPreloadedScreenViewWithScreenKey:tag withUiResponder:responder];
  } else {
    preloadedScreenView = nil;
  }
}

- (RNSScreenStackView *)findScreenStackViewInResponderChain:(UIResponder *)responder {
  while (responder) {
    responder = [responder nextResponder];
    if ([responder isKindOfClass:[RNSScreenStackView class]]) {
      return (RNSScreenStackView *)responder;
    }
  }
  return nil; // No RNSScreenStackView found in the responder chain.
}

// Helper function to extract RNSScreenView objects from a list of subviews.
- (NSArray<RNSScreenView *> *)extractScreenViewsFromSubviews:
    (NSArray<UIView *> *)subviews {
  NSMutableArray<RNSScreenView *> *screenSubviews = [NSMutableArray array];
  for (UIView *subview in subviews) {
    if ([subview isKindOfClass:[RNSScreenView class]]) {
      [screenSubviews addObject:(RNSScreenView *)subview];
    }
  }
  return [screenSubviews copy]; // Return an immutable copy.
}

// Helper function to find the preloaded screen view (activityState == 0).
- (RNSScreenView *)findPreloadedScreenView:
    (NSArray<RNSScreenView *> *)screenViews {
  for (RNSScreenView *screenView in screenViews) {
    NSLog(@"ScreenView activityState: %ld", (long)screenView.activityState);
    if (screenView.activityState == 0) {
      return screenView;
    }
  }
  return nil; // No preloaded screen view found.
}

- (RNSScreenView *)findPreloadedScreenViewWithScreenKey:(int)screenKey withUiResponder:(UIResponder *)responder {
  RNSScreenStackView *stack = [self findScreenStackViewInResponderChain:responder];

  NSLog(@"Screen Key: %d", screenKey);
  if (stack) {
    NSArray<UIView *> *subviews = stack.reactSubviews;

    NSArray<RNSScreenView *> *screenSubviews =
        [self extractScreenViewsFromSubviews:subviews];
    for (RNSScreenView *screenView in screenSubviews) {
      if (screenView.activityState == 0 && screenView.tag == screenKey) {
        return screenView;
      }
    }
  }
  return nil; // No preloaded screen view found.
}

@end
