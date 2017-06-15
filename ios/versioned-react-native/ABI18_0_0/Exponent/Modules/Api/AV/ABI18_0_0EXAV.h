// Copyright 2017-present 650 Industries. All rights reserved.

#import <ReactABI18_0_0/ABI18_0_0RCTBridgeModule.h>

#import "ABI18_0_0EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, ABI18_0_0EXAudioInterruptionMode)
{
  ABI18_0_0EXAudioInterruptionModeMixWithOthers = 0,
  ABI18_0_0EXAudioInterruptionModeDoNotMix      = 1,
  ABI18_0_0EXAudioInterruptionModeDuckOthers    = 2
};

@interface ABI18_0_0EXAV : NSObject <ABI18_0_0RCTBridgeModule>

- (NSError *)promoteAudioSessionIfNecessary;

- (NSError *)demoteAudioSessionIfPossible;

- (void)registerVideoForAudioLifecycle:(NSObject<ABI18_0_0EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI18_0_0EXAVObject> *)video;

@end
