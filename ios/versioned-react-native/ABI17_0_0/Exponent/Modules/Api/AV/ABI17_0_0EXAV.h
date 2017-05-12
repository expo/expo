// Copyright 2017-present 650 Industries. All rights reserved.

#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>

#import "ABI17_0_0EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, ABI17_0_0EXAudioInterruptionMode)
{
  ABI17_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI17_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI17_0_0EXAudioInterruptionModeDuckOthers    = 2
};

@interface ABI17_0_0EXAV : NSObject <ABI17_0_0RCTBridgeModule>

- (NSError *)activateAudioSessionIfNecessary;

- (NSError *)deactivateAudioSessionIfUnused;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI17_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI17_0_0EXAVObject> *)video;

@end
