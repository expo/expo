// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI21_0_0/ABI21_0_0RCTEventEmitter.h>

@interface ABI21_0_0EXScopedEventEmitter : ABI21_0_0RCTEventEmitter

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSString *experienceId;

@end
