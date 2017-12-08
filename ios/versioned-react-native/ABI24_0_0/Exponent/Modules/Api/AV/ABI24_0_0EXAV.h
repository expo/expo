// Copyright 2017-present 650 Industries. All rights reserved.

#import <ReactABI24_0_0/ABI24_0_0RCTBridgeModule.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventEmitter.h>

#import "ABI24_0_0EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, ABI24_0_0EXAudioInterruptionMode)
{
  ABI24_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI24_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI24_0_0EXAudioInterruptionModeDuckOthers    = 2
};

typedef NS_OPTIONS(NSUInteger, ABI24_0_0EXAudioRecordingOptionBitRateStrategy)
{
  ABI24_0_0EXAudioRecordingOptionBitRateStrategyConstant            = 0,
  ABI24_0_0EXAudioRecordingOptionBitRateStrategyLongTermAverage     = 1,
  ABI24_0_0EXAudioRecordingOptionBitRateStrategyVariableConstrained = 2,
  ABI24_0_0EXAudioRecordingOptionBitRateStrategyVariable            = 3
};

@interface ABI24_0_0EXAV : ABI24_0_0RCTEventEmitter <ABI24_0_0RCTBridgeModule>

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI24_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI24_0_0EXAVObject> *)video;

@end
