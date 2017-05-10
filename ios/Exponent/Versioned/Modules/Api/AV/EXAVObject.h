// Copyright 2017-present 650 Industries. All rights reserved.

@protocol EXAVObject <NSObject> // For EXAVPlayerData and EXVideoView to interact with the Audio Session properly

- (void)pauseImmediately;

- (BOOL)isUsingAudioSession; // TODO (clarity): is needsAudioSession a better name?

- (void)bridgeDidForeground:(NSNotification *)notification;

- (void)bridgeDidBackground:(NSNotification *)notification;

- (void)handleAudioSessionInterruption:(NSNotification*)notification;

- (void)handleMediaServicesReset:(void (^)())finishCallback;

@end
