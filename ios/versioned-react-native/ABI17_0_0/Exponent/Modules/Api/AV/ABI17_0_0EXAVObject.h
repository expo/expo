// Copyright 2017-present 650 Industries. All rights reserved.

@protocol ABI17_0_0EXAVObject <NSObject> // For ABI17_0_0EXAVPlayerData and ABI17_0_0EXVideoView to interact with the Audio Session properly

- (void)pauseImmediately;

- (BOOL)isUsingAudioSession; // TODO (clarity): is needsAudioSession a better name?

- (void)bridgeDidForeground:(NSNotification *)notification;

- (void)bridgeDidBackground:(NSNotification *)notification;

- (void)handleAudioSessionInterruption:(NSNotification*)notification;

- (void)handleMediaServicesReset:(void (^)())finishCallback;

@end
