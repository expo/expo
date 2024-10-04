// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <React/RCTBridgeModule.h>

#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXAppLifecycleListener.h>
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <EXAV/EXAVObject.h>

typedef NS_OPTIONS(NSUInteger, EXAudioInterruptionMode)
{
  EXAudioInterruptionModeMixWithOthers = 0,
  EXAudioInterruptionModeDoNotMix      = 1,
  EXAudioInterruptionModeDuckOthers    = 2
};

typedef NS_OPTIONS(NSUInteger, EXAudioRecordingOptionBitRateStrategy)
{
  EXAudioRecordingOptionBitRateStrategyConstant            = 0,
  EXAudioRecordingOptionBitRateStrategyLongTermAverage     = 1,
  EXAudioRecordingOptionBitRateStrategyVariableConstrained = 2,
  EXAudioRecordingOptionBitRateStrategyVariable            = 3
};

@protocol EXAVScopedModuleDelegate

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
- (AVAudioSessionPortDescription *) activeInput;
- (NSError *)setActiveInput:(AVAudioSessionPortDescription *)activeInput;

@end

@protocol EXAVInterface

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<EXAVObject> *)video;

@end

@interface EXAV : EXExportedModule <RCTBridgeModule, EXEventEmitter, EXAppLifecycleListener, EXModuleRegistryConsumer, EXAVInterface>

- (void)handleMediaServicesReset:(NSNotification *)notification;
- (void)handleAudioSessionInterruption:(NSNotification *)notification;

@end
