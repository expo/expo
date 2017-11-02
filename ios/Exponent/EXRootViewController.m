// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXRootViewController.h"

#import <React/RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXRootViewController

#pragma mark - Public

- (void)applicationWillEnterForeground
{
  if (!self.isLoading && ![self.contentView isKindOfClass:[RCTRootView class]]) {
    [self loadReactApplication];
  }
}

@end

NS_ASSUME_NONNULL_END
