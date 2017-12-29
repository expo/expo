// Copyright 2017-present 650 Industries. All rights reserved.

#import <ReactABI22_0_0/ABI22_0_0RCTBridgeModule.h>

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

@interface ABI22_0_0EXAV : NSObject <ABI22_0_0RCTBridgeModule>

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI22_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI22_0_0EXAVObject> *)video;

@end
