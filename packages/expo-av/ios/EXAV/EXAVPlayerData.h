// Copyright 2017-present 650 Industries. All rights reserved.

#pragma once

#import <AVFoundation/AVFoundation.h>

#import <EXAV/EXAV.h>

@interface EXAVPlayerData : NSObject <EXAVObject>

// TODO: REMOVE THIS THIS ONLY EXISTS SO EVERYTHING COMPILES
@property (nonatomic, strong) AVQueuePlayer *player;

@property (nonatomic, strong) AVAudioEngine *engine;
@property (nonatomic, strong) AVAudioPlayerNode *playerNode;
@property (nonatomic, strong) AVAudioFile *audioFile;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) NSDictionary *headers;
@property (nonatomic, strong) void (^statusUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^errorCallback)(NSString *);

+ (NSDictionary *)getUnloadedStatus;

- (instancetype)initWithEXAV:(EXAV *)exAV
                  withSource:(NSDictionary *)source
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock;

- (void)setStatus:(NSDictionary *)parameters
         resolver:(EXPromiseResolveBlock)resolve
         rejecter:(EXPromiseRejectBlock)reject;

- (NSDictionary *)getStatus;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(EXPromiseResolveBlock)resolve
                rejecter:(EXPromiseRejectBlock)reject;

typedef void (^SampleBufferCallback)(AVAudioPCMBuffer * _Nonnull buffer);

- (void)addSampleBufferCallback:(SampleBufferCallback)callback;
- (void)removeSampleBufferCallback;

@end
