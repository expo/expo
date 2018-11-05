// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppViewController.h"
#import "EXKernel.h"
#import "EXKernelAppRegistry.h"
#import "EXScreenOrientationManager.h"

NSNotificationName kEXChangeForegroundTaskSupportedOrientationsNotification = @"EXChangeForegroundTaskSupportedOrientations";

@implementation EXScreenOrientationManager

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

#pragma mark - scoped module delegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  [self setSupportInterfaceOrientations:supportedInterfaceOrientations forExperienceId:((EXScopedBridgeModule *)scopedOrientationModule).experienceId];
}

@end
