// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>


@interface EXDevMenuInstance : NSObject <RCTBridgeDelegate>

@property (strong, nonatomic) RCTBridge *appBridge;
@property (strong, nonatomic) RCTBridge *bridge;
@property (strong, nonatomic) NSDictionary *manifest;

- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (instancetype)initWithBridge:(RCTBridge *)bridge andManifest:(NSDictionary *)manifest;
- (NSDictionary *)getBuildInfo;
- (NSDictionary *)getDevSettings;

@end

