// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import "ABI17_0_0EXAV.h"

@interface ABI17_0_0EXAVPlayerData : NSObject <ABI17_0_0EXAVObject>

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) void (^statusUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^errorCallback)(NSString *);

+ (NSDictionary *)getUnloadedStatus;

- (instancetype)initWithEXAV:(ABI17_0_0EXAV *)exAV
                     withURL:(NSURL *)url
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock;

- (void)setStatus:(NSDictionary *)parameters
         resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject;

- (NSDictionary *)getStatus;

@end
