// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI48_0_0EXAV/ABI48_0_0EXAV.h>
#import <ABI48_0_0EXAV/ABI48_0_0EXAudioSampleCallback.h>

@interface ABI48_0_0EXAVPlayerData : NSObject <ABI48_0_0EXAVObject>

@property (nonatomic, strong) AVQueuePlayer *player;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) NSDictionary *headers;
@property (nonatomic, strong) ABI48_0_0EXAudioSampleCallback *sampleBufferCallback;
@property (nonatomic, strong) void (^statusUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^metadataUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^errorCallback)(NSString *);

+ (NSDictionary *)getUnloadedStatus;

- (instancetype)initWithEXAV:(ABI48_0_0EXAV *)exAV
                  withSource:(NSDictionary *)source
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock;

- (void)setStatus:(NSDictionary *)parameters
         resolver:(ABI48_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI48_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getStatus;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI48_0_0EXPromiseResolveBlock)resolve
                rejecter:(ABI48_0_0EXPromiseRejectBlock)reject;

- (void)cleanup;

@end
