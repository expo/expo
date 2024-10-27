// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

@interface EXScopedBridgeModule : NSObject <RCTBridgeModule>

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                        scopeKey:(NSString *)scopeKey
                                    easProjectId:(NSString *)easProjectId
                           kernelServiceDelegate:(id)kernelServiceInstance
                                          params:(NSDictionary *)params NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                        scopeKey:(NSString *)scopeKey
                                    easProjectId:(NSString *)easProjectId
                          kernelServiceDelegates:(NSDictionary *)kernelServiceInstances
                                          params:(NSDictionary *)params NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSString *scopeKey;
@property (nonatomic, readonly, nullable) NSString *experienceStableLegacyId;
@property (nonatomic, readonly, nullable) NSString *easProjectId;

@end
