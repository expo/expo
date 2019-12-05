// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXScreenOrientation/EXScreenOrientationModule.h>)
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
  return [[self sharedRegistry] orientationMaskForAppId:_experienceId];
}

- (void)setOrientationMask:(UIInterfaceOrientationMask)mask
{
  return [[self sharedRegistry] setOrientationMask:mask forAppId:_experienceId];
}

@end
#endif
