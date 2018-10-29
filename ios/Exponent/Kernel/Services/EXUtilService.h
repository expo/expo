// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <EXCore/EXSingletonModule.h>

@interface EXUtilService : EXSingletonModule

- (UIViewController *)currentViewController;

- (nullable NSDictionary *)launchOptions;

@end
