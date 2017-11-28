// Copyright 2017-present 650 Industries. All rights reserved.

typedef NS_OPTIONS(NSUInteger, EXAVAudioSessionMode)
{
  // These are enumerated in ascending order of priority.
  // The EXAVAudioSessionMode of the current experience (managed by EXAV) should be
  // the maximum of the EXAVAudioSessionModes required by each of the live EXAVObjects.
  EXAVAudioSessionModeInactive    = 0,
  EXAVAudioSessionModeActiveMuted = 1,
  EXAVAudioSessionModeActive      = 2
};

@protocol EXAVObject <NSObject> // For EXAVPlayerData and EXVideoView to interact with the Audio Session properly

- (void)pauseImmediately;

- (EXAVAudioSessionMode)getAudioSessionModeRequired; // TODO (clarity): is needsAudioSession a better name?

- (void)bridgeDidForeground:(NSNotification *)notification;

- (void)bridgeDidBackground:(NSNotification *)notification;

- (void)handleAudioSessionInterruption:(NSNotification*)notification;

- (void)handleMediaServicesReset:(void (^)(void))finishCallback;

@end
