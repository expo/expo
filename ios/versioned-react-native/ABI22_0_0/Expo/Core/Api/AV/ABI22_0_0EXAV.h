// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTBridgeModule.h>

#import "ABI22_0_0EXScopedEventEmitter.h"
#import "ABI22_0_0EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, ABI22_0_0EXAudioInterruptionMode)
{
  ABI22_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI22_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI22_0_0EXAudioInterruptionModeDuckOthers    = 2
};

typedef NS_OPTIONS(NSUInteger, ABI22_0_0EXAudioRecordingOptionBitRateStrategy)
{
  ABI22_0_0EXAudioRecordingOptionBitRateStrategyConstant            = 0,
  ABI22_0_0EXAudioRecordingOptionBitRateStrategyLongTermAverage     = 1,
  ABI22_0_0EXAudioRecordingOptionBitRateStrategyVariableConstrained = 2,
  ABI22_0_0EXAudioRecordingOptionBitRateStrategyVariable            = 3
};

@protocol ABI22_0_0EXAVScopedModuleDelegate

- (void)scopedModuleDidBackground:(id)scopedModule;
- (void)scopedModuleDidForeground:(id)scopedModule;
- (void)scopedModuleWillDeallocate:(id)scopedModule;
- (NSError *)setActive:(BOOL)active forScopedModule:(id)scopedModule;
- (NSError *)setCategory:(NSString *)category withOptions:(AVAudioSessionCategoryOptions)options forScopedModule:(id)scopedModule;

@end

@interface ABI22_0_0EXAV : ABI22_0_0EXScopedEventEmitter <ABI22_0_0RCTBridgeModule>

- (void)handleMediaServicesReset:(NSNotification *)notification;
- (void)handleAudioSessionInterruption:(NSNotification *)notification;

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI22_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI22_0_0EXAVObject> *)video;

@end
