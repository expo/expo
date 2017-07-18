// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernelReactAppManager.h"
#import "EXScreenOrientationManager.h"

NSNotificationName kEXChangeForegroundTaskSupportedOrientationsNotification = @"EXChangeForegroundTaskSupportedOrientations";

@implementation EXScreenOrientationManager

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_changeSupportedOrientations:)
                                                 name:kEXChangeForegroundTaskSupportedOrientationsNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setSupportInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations forExperienceId:(NSString *)experienceId
{
  EXKernelBridgeRegistry *bridgeRegistry = [EXKernel sharedInstance].bridgeRegistry;
  for (id bridge in bridgeRegistry.bridgeEnumerator) {
    EXKernelBridgeRecord *bridgeRecord = [bridgeRegistry recordForBridge:bridge];
    if ([bridgeRecord.experienceId isEqualToString:experienceId] && bridgeRecord.appManager.frame) {
      bridgeRecord.appManager.frame.supportedInterfaceOrientations = supportedInterfaceOrientations;
      break;
    }
  }
}

- (void)setSupportedInterfaceOrientationsForForegroundExperience:(UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  EXKernelBridgeRegistry *bridgeRegistry = [EXKernel sharedInstance].bridgeRegistry;
  EXReactAppManager *foregroundAppManager = bridgeRegistry.lastKnownForegroundAppManager;
  if ([foregroundAppManager isKindOfClass:[EXFrameReactAppManager class]]) {
    EXFrame *frame = ((EXFrameReactAppManager *)foregroundAppManager).frame;
    if (frame) {
      frame.supportedInterfaceOrientations = supportedInterfaceOrientations;
    }
  }
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForForegroundExperience
{
  EXKernelBridgeRegistry *bridgeRegistry = [EXKernel sharedInstance].bridgeRegistry;
  EXReactAppManager *foregroundAppManager = bridgeRegistry.lastKnownForegroundAppManager;
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

- (void)_changeSupportedOrientations:(NSNotification *)notification
{
  NSNumber *orientationNumber = notification.userInfo[@"orientation"];
  [self setSupportedInterfaceOrientationsForForegroundExperience:(UIInterfaceOrientationMask)[orientationNumber longValue]];
}

@end
