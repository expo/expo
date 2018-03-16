// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>

#import "ABI23_0_0EXScopedEventEmitter.h"
#import "ABI23_0_0EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, ABI23_0_0EXAudioInterruptionMode)
{
  ABI23_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI23_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI23_0_0EXAudioInterruptionModeDuckOthers    = 2
};

typedef NS_OPTIONS(NSUInteger, ABI23_0_0EXAudioRecordingOptionBitRateStrategy)
{
  ABI23_0_0EXAudioRecordingOptionBitRateStrategyConstant            = 0,
  ABI23_0_0EXAudioRecordingOptionBitRateStrategyLongTermAverage     = 1,
  ABI23_0_0EXAudioRecordingOptionBitRateStrategyVariableConstrained = 2,
  ABI23_0_0EXAudioRecordingOptionBitRateStrategyVariable            = 3
};

@protocol ABI23_0_0EXAVScopedModuleDelegate

- (void)scopedModuleDidBackground:(id)scopedModule;
- (void)scopedModuleDidForeground:(id)scopedModule;
- (void)scopedModuleWillDeallocate:(id)scopedModule;
- (NSError *)setActive:(BOOL)active forScopedModule:(id)scopedModule;
- (NSError *)setCategory:(NSString *)category withOptions:(AVAudioSessionCategoryOptions)options forScopedModule:(id)scopedModule;

@end

@interface ABI23_0_0EXAV : ABI23_0_0EXScopedEventEmitter <ABI23_0_0RCTBridgeModule>

- (void)handleMediaServicesReset:(NSNotification *)notification;
- (void)handleAudioSessionInterruption:(NSNotification *)notification;

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI23_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI23_0_0EXAVObject> *)video;

@end
