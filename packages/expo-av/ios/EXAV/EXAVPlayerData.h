// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import "EXAV.h"

@interface EXAVPlayerData : NSObject <EXAVObject>

@property (nonatomic, strong) AVQueuePlayer *player;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) void (^statusUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^errorCallback)(NSString *);

+ (NSDictionary *)getUnloadedStatus;

- (instancetype)initWithEXAV:(EXAV *)exAV
                  withSource:(NSDictionary *)source
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock;

- (void)setStatus:(NSDictionary *)parameters
         resolver:(RCTPromiseResolveBlock)resolve
         rejecter:(RCTPromiseRejectBlock)reject;

- (NSDictionary *)getStatus;

- (void)replayWithStatus:(NSDictionary *)status
                resolver:(RCTPromiseResolveBlock)resolve
                rejecter:(RCTPromiseRejectBlock)reject;

@end
