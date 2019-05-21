// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0EXConstants/ABI33_0_0EXConstantsService.h>
#import <ABI33_0_0UMConstantsInterface/ABI33_0_0UMConstantsInterface.h>

@interface ABI33_0_0EXConstantsBinding : ABI33_0_0EXConstantsService <ABI33_0_0UMInternalModule, ABI33_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
