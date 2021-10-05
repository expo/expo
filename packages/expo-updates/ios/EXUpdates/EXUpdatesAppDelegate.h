// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXSingletonModule.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppDelegate : EXSingletonModule <UIApplicationDelegate>

- (const NSInteger)priority;

@end

NS_ASSUME_NONNULL_END
