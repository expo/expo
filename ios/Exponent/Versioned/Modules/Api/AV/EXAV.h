// Copyright 2017-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

#import "EXAVObject.h"

typedef NS_OPTIONS(NSUInteger, EXAudioInterruptionMode)
{
  EXAudioInterruptionModeMixWithOthers = 0,
  EXAudioInterruptionModeDoNotMix      = 1,
  EXAudioInterruptionModeDuckOthers    = 2
};

@interface EXAV : NSObject <RCTBridgeModule>

- (NSError *)activateAudioSessionIfNecessary;

- (NSError *)deactivateAudioSessionIfUnused;

- (void)registerVideoForAudioLifecycle:(NSObject<EXAVObject> *)video;

- (void)unregisterVideoForAudioLifecycle:(NSObject<EXAVObject> *)video;

@end
