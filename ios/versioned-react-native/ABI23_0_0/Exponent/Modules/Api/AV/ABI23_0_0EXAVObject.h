// Copyright 2017-present 650 Industries. All rights reserved.

typedef NS_OPTIONS(NSUInteger, ABI23_0_0EXAVAudioSessionMode)
{
  // These are enumerated in ascending order of priority.
  // The ABI23_0_0EXAVAudioSessionMode of the current experience (managed by ABI23_0_0EXAV) should be
  // the maximum of the ABI23_0_0EXAVAudioSessionModes required by each of the live ABI23_0_0EXAVObjects.
  ABI23_0_0EXAVAudioSessionModeInactive    = 0,
  ABI23_0_0EXAVAudioSessionModeActiveMuted = 1,
  ABI23_0_0EXAVAudioSessionModeActive      = 2
};

@protocol ABI23_0_0EXAVObject <NSObject> // For ABI23_0_0EXAVPlayerData and ABI23_0_0EXVideoView to interact with the Audio Session properly

- (void)pauseImmediately;

- (ABI23_0_0EXAVAudioSessionMode)getAudioSessionModeRequired; // TODO (clarity): is needsAudioSession a better name?

- (void)bridgeDidForeground:(NSNotification *)notification;

- (void)bridgeDidBackground:(NSNotification *)notification;

- (void)handleAudioSessionInterruption:(NSNotification*)notification;

- (void)handleMediaServicesReset:(void (^)())finishCallback;

@end
