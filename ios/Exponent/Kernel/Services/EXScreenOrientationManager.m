// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppViewController.h"
#import "EXKernel.h"
#import "EXKernelAppRegistry.h"
#import "EXScreenOrientationManager.h"

NSNotificationName kEXChangeForegroundTaskSupportedOrientationsNotification = @"EXChangeForegroundTaskSupportedOrientations";

@implementation EXScreenOrientationManager

- (instancetype)init
{
  if (self = [super init]) {
    _subscribedModules = [NSMapTable strongToWeakObjectsMapTable];
  }
  return self;
}

- (void)setSupportInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations forExperienceId:(NSString *)experienceId
{
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  EXKernelAppRecord *recordForId = [appRegistry newestRecordWithExperienceId:experienceId];
  if (recordForId) {
    [recordForId.viewController setSupportedInterfaceOrientations:supportedInterfaceOrientations];
  }
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp
{
  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  return [visibleApp.viewController supportedInterfaceOrientations];
}

- (void)handleScreenOrientationChange:(UITraitCollection *)traitCollection
{
  for(NSString *experienceId in _subscribedModules) {
    EXScreenOrientation *subscribedModule = [_subscribedModules objectForKey:experienceId];
    [subscribedModule handleScreenOrientationChange:traitCollection];
  }
}

- (UITraitCollection *)getTraitCollection
{
  EXKernelAppRecord *visibleApp = [EXKernel sharedInstance].visibleApp;
  return [visibleApp.viewController traitCollection];
}

#pragma mark - scoped module delegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  [self setSupportInterfaceOrientations:supportedInterfaceOrientations forExperienceId:((EXScopedBridgeModule *)scopedOrientationModule).experienceId];
}


- (void)removeOrientationChangeListener:(NSString *)experienceId
{
  [_subscribedModules removeObjectForKey:experienceId];
}

- (void)addOrientationChangeListener:(NSString *)experienceId subscriberModule:(id)subscriberModule
{
  [_subscribedModules setObject:subscriberModule forKey:experienceId];
}

@end
