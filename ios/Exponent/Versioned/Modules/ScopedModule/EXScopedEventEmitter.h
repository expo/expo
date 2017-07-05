// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTEventEmitter.h>

@interface EXScopedEventEmitter : RCTEventEmitter

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSString *experienceId;

@end
