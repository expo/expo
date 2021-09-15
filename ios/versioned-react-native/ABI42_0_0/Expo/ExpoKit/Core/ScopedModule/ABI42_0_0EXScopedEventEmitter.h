// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>

@interface ABI42_0_0EXScopedEventEmitter : ABI42_0_0RCTEventEmitter

+ (NSString *)getExperienceIdFromEventEmitter:(id)eventEmitter;

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

@end
