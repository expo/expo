// Copyright © 2019-present 650 Industries. All rights reserved.

#import "EXAppViewController.h"
#import "EXScopedScreenOrientation.h"

@interface EXScopedScreenOrientation()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXScopedScreenOrientation

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (UIInterfaceOrientationMask)orientationMask
{
  return [[EXScreenOrientationModule sharedRegistry] orientationMaskForAppId:_experienceId];
}

- (void)setOrientationMask:(UIInterfaceOrientationMask)mask
{
  return [[EXScreenOrientationModule sharedRegistry] setOrientationMask:mask forAppId:_experienceId];
}

@end
