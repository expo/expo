// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUtilService.h"
#import "EXViewController.h"
#import "ExpoKit.h"

#import <UMCore/UMDefines.h>

@implementation EXUtilService

UM_REGISTER_SINGLETON_MODULE(Util)

- (UIViewController *)currentViewController
{
  return [[ExpoKit sharedInstance] currentViewController];
}

- (nullable NSDictionary *)launchOptions
{
  return [[ExpoKit sharedInstance] launchOptions];
}

@end
