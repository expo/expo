// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI44_0_0EXAV/ABI44_0_0EXAV.h>
#import <ABI44_0_0EXAV/ABI44_0_0EXAudioSampleCallback.h>

@interface ABI44_0_0EXAVPlayerData : NSObject <ABI44_0_0EXAVObject>

@property (nonatomic, strong) AVQueuePlayer *player;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) NSDictionary *headers;
@property (nonatomic, strong) ABI44_0_0EXAudioSampleCallback *sampleBufferCallback;
@property (nonatomic, strong) void (^statusUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^metadataUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^errorCallback)(NSString *);

+ (NSDictionary *)getUnloadedStatus;

- (instancetype)initWithEXAV:(ABI44_0_0EXAV *)exAV
                  withSource:(NSDictionary *)source
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock;

- (void)setStatus:(NSDictionary *)parameters
         resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
         rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getStatus;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                rejecter:(ABI44_0_0EXPromiseRejectBlock)reject;

@end
