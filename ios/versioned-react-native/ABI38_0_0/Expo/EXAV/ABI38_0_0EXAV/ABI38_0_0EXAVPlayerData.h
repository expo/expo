// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI38_0_0EXAV/ABI38_0_0EXAV.h>

@interface ABI38_0_0EXAVPlayerData : NSObject <ABI38_0_0EXAVObject>

@property (nonatomic, strong) AVQueuePlayer *player;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) NSDictionary *headers;
@property (nonatomic, strong) void (^statusUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^errorCallback)(NSString *);

+ (NSDictionary *)getUnloadedStatus;

- (instancetype)initWithEXAV:(ABI38_0_0EXAV *)exAV
                  withSource:(NSDictionary *)source
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock;

- (void)setStatus:(NSDictionary *)parameters
         resolver:(ABI38_0_0UMPromiseResolveBlock)resolve
         rejecter:(ABI38_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getStatus;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(ABI38_0_0UMPromiseResolveBlock)resolve
                rejecter:(ABI38_0_0UMPromiseRejectBlock)reject;

@end
