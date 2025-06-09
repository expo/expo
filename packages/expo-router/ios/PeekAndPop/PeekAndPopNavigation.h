// Copyright 2015-present 650 Industries. All rights reserved.

@class PeekAndPopNavigation;

@interface PeekAndPopNavigation:NSObject

- (void)updatePreloadedView:(NSString *)screenId withUiResponder:(UIResponder *)responder;

- (void)pushPreloadedView:(UIResponder *)responder;

@end

