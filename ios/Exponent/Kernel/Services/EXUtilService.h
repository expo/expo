// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <UMCore/UMSingletonModule.h>

@interface EXUtilService : UMSingletonModule

- (UIViewController *)currentViewController;

- (nullable NSDictionary *)launchOptions;

@end
