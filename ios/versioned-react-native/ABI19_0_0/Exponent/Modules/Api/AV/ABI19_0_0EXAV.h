// Copyright 2017-present 650 Industries. All rights reserved.

#import <ReactABI19_0_0/ABI19_0_0RCTBridgeModule.h>

#import "ABI19_0_0EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, ABI19_0_0EXAudioInterruptionMode)
{
  ABI19_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI19_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI19_0_0EXAudioInterruptionModeDuckOthers    = 2
};

typedef NS_OPTIONS(NSUInteger, ABI19_0_0EXAudioRecordingOptionBitRateStrategy)
{
  ABI19_0_0EXAudioRecordingOptionBitRateStrategyConstant            = 0,
  ABI19_0_0EXAudioRecordingOptionBitRateStrategyLongTermAverage     = 1,
  ABI19_0_0EXAudioRecordingOptionBitRateStrategyVariableConstrained = 2,
  ABI19_0_0EXAudioRecordingOptionBitRateStrategyVariable            = 3
};

@interface ABI19_0_0EXAV : NSObject <ABI19_0_0RCTBridgeModule>

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI19_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI19_0_0EXAVObject> *)video;

@end
