// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExponentViewManager.h"
#import "EXViewController.h"

@interface ExponentViewManager ()

@property (nonatomic, nullable, strong) EXViewController *rootViewController;

@end

@implementation ExponentViewManager

+ (nonnull instancetype)sharedInstance
{
  static ExponentViewManager *theExponent = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theExponent) {
      theExponent = [[ExponentViewManager alloc] init];
    }
  });
  return theExponent;
}

- (EXViewController *)rootViewController
{
  if (!_rootViewController) {
    // TODO: launch options
    _rootViewController = [[EXViewController alloc] initWithLaunchOptions:@{}];
  }
  return _rootViewController;
}

@end
