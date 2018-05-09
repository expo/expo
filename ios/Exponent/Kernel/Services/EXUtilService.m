// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUtilService.h"
#import "EXViewController.h"
#import "ExpoKit.h"

@implementation EXUtilService

- (UIViewController *)currentViewController
{
  return [[ExpoKit sharedInstance] currentViewController];
}

@end
