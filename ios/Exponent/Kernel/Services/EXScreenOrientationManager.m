// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernelReactAppManager.h"
#import "EXScreenOrientationManager.h"

NSNotificationName kEXChangeForegroundTaskSupportedOrientationsNotification = @"EXChangeForegroundTaskSupportedOrientations";

@implementation EXScreenOrientationManager

- (void)setSupportInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations forExperienceId:(NSString *)experienceId
{
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  for (NSString *recordId in appRegistry.appEnumerator) {
    EXKernelAppRecord *appRecord = [appRegistry recordForId:recordId];
    if (!appRecord || appRecord.status != EXKernelAppRecordStatusRunning) {
      continue;
    }
    if (appRecord.experienceId && [appRecord.experienceId isEqualToString:experienceId] && appRecord.appManager && appRecord.appManager.frame) {
      appRecord.appManager.frame.supportedInterfaceOrientations = supportedInterfaceOrientations;
      break;
    }
  }
}

- (void)setSupportedInterfaceOrientationsForForegroundExperience:(UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  EXReactAppManager *foregroundAppManager = appRegistry.lastKnownForegroundAppManager;
  if ([foregroundAppManager isKindOfClass:[EXFrameReactAppManager class]]) {
    EXFrame *frame = ((EXFrameReactAppManager *)foregroundAppManager).frame;
    if (frame) {
      frame.supportedInterfaceOrientations = supportedInterfaceOrientations;
    }
  }
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForForegroundExperience
{
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  EXReactAppManager *foregroundAppManager = appRegistry.lastKnownForegroundAppManager;
  if ([foregroundAppManager isKindOfClass:[EXFrameReactAppManager class]]) {
    EXFrame *frame = ((EXFrameReactAppManager *)foregroundAppManager).frame;
    if (frame) {
      return frame.supportedInterfaceOrientations;
    }
  }
  // kernel or unknown bridge: lock to portrait
  return UIInterfaceOrientationMaskPortrait;
}

#pragma mark - scoped module delegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  [self setSupportInterfaceOrientations:supportedInterfaceOrientations forExperienceId:((EXScopedBridgeModule *)scopedOrientationModule).experienceId];
}

@end
