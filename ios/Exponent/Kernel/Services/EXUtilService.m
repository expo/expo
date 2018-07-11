// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUtilService.h"
#import "EXViewController.h"
#import "ExpoKit.h"

#import <EXCore/EXDefines.h>

@implementation EXUtilService

+ (NSString *)name
{
  return @"Util";
}

- (UIViewController *)currentViewController
{
  return [[ExpoKit sharedInstance] currentViewController];
}

@end
