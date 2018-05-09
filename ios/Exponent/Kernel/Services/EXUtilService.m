// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUtilService.h"
#import "EXViewController.h"
#import "ExpoKit.h"

@implementation EXUtilService

- (UIViewController *)currentViewController
{
  EXViewController *exViewController = [[ExpoKit sharedInstance] rootViewController];
  UIViewController *controller = [exViewController contentViewController];
  while (controller.presentedViewController != nil) {
    controller = controller.presentedViewController;
  }
  return controller;
}

@end
