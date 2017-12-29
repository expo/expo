// Copyright 2017-present 650 Industries. All rights reserved.

#import <ReactABI21_0_0/ABI21_0_0RCTBridgeModule.h>

#import "ABI21_0_0EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, ABI21_0_0EXAudioInterruptionMode)
{
  ABI21_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI21_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI21_0_0EXAudioInterruptionModeDuckOthers    = 2
};

typedef NS_OPTIONS(NSUInteger, ABI21_0_0EXAudioRecordingOptionBitRateStrategy)
{
  ABI21_0_0EXAudioRecordingOptionBitRateStrategyConstant            = 0,
  ABI21_0_0EXAudioRecordingOptionBitRateStrategyLongTermAverage     = 1,
  ABI21_0_0EXAudioRecordingOptionBitRateStrategyVariableConstrained = 2,
  ABI21_0_0EXAudioRecordingOptionBitRateStrategyVariable            = 3
};

@interface ABI21_0_0EXAV : NSObject <ABI21_0_0RCTBridgeModule>

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI21_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI21_0_0EXAVObject> *)video;

@end
