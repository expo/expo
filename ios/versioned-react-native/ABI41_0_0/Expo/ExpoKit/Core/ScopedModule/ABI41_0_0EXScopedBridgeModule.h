// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>

@interface ABI41_0_0EXScopedBridgeModule : NSObject <ABI41_0_0RCTBridgeModule>

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegates:(NSDictionary *)kernelServiceInstances
                              params:(NSDictionary *)params NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSString *experienceId;

@end
