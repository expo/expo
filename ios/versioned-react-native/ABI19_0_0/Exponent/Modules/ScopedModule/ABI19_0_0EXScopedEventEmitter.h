// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI19_0_0/ABI19_0_0RCTEventEmitter.h>

@interface ABI19_0_0EXScopedEventEmitter : ABI19_0_0RCTEventEmitter

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSString *experienceId;

@end
