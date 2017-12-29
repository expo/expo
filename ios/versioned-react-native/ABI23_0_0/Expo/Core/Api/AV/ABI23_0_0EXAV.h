// Copyright 2017-present 650 Industries. All rights reserved.

#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>

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

@interface ABI23_0_0EXAV : NSObject <ABI23_0_0RCTBridgeModule>

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI23_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI23_0_0EXAVObject> *)video;

@end
