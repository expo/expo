// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXSingletonModule.h>

@interface EXUtilService : EXSingletonModule

- (nullable UIViewController *)currentViewController;

- (nullable NSDictionary *)launchOptions;

@end
