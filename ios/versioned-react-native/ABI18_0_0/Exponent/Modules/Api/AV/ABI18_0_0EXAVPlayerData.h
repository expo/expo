// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import "ABI18_0_0EXAV.h"

@interface ABI18_0_0EXAVPlayerData : NSObject <ABI18_0_0EXAVObject>

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) void (^statusUpdateCallback)(NSDictionary *);
@property (nonatomic, strong) void (^errorCallback)(NSString *);

+ (NSDictionary *)getUnloadedStatus;

- (instancetype)initWithEXAV:(ABI18_0_0EXAV *)exAV
                     withURL:(NSURL *)url
                  withStatus:(NSDictionary *)parameters
         withLoadFinishBlock:(void (^)(BOOL success, NSDictionary *successStatus, NSString *error))loadFinishBlock;

- (void)setStatus:(NSDictionary *)parameters
         resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
         rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject;

- (NSDictionary *)getStatus;

@end
