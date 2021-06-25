// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleListener.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0EXAV/ABI40_0_0EXAVObject.h>

typedef NS_OPTIONS(NSUInteger, ABI40_0_0EXAudioInterruptionMode)
{
  ABI40_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI40_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI40_0_0EXAudioInterruptionModeDuckOthers    = 2
};

typedef NS_OPTIONS(NSUInteger, ABI40_0_0EXAudioRecordingOptionBitRateStrategy)
{
  ABI40_0_0EXAudioRecordingOptionBitRateStrategyConstant            = 0,
  ABI40_0_0EXAudioRecordingOptionBitRateStrategyLongTermAverage     = 1,
  ABI40_0_0EXAudioRecordingOptionBitRateStrategyVariableConstrained = 2,
  ABI40_0_0EXAudioRecordingOptionBitRateStrategyVariable            = 3
};

@protocol ABI40_0_0EXAVScopedModuleDelegate

// Call this when your module knows it won't use the audio session now
// but may do in the future (settings persist).
- (void)moduleDidBackground:(id)module;
// Call this when your module knows it will use the audio session now.
- (void)moduleDidForeground:(id)module;
// Call this when your module knows it won't use the audio session now
// or in the future (forget settings).
- (void)moduleWillDeallocate:(id)module;
- (BOOL)isActiveForModule:(id)module;
- (NSString *)activeCategory;
- (AVAudioSessionCategoryOptions)activeCategoryOptions;
- (NSError *)setActive:(BOOL)active forModule:(id)module;
- (NSError *)setCategory:(NSString *)category withOptions:(AVAudioSessionCategoryOptions)options forModule:(id)module;

@end

@protocol ABI40_0_0EXAVInterface

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI40_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI40_0_0EXAVObject> *)video;

@end

@interface ABI40_0_0EXAV : ABI40_0_0UMExportedModule <ABI40_0_0UMEventEmitter, ABI40_0_0UMAppLifecycleListener, ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0EXAVInterface>

- (void)handleMediaServicesReset:(NSNotification *)notification;
- (void)handleAudioSessionInterruption:(NSNotification *)notification;

@end
