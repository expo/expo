// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI39_0_0EXConstants/ABI39_0_0EXConstantsService.h>)
#import <Foundation/Foundation.h>
#import <ABI39_0_0EXConstants/ABI39_0_0EXConstantsService.h>
#import <ABI39_0_0UMConstantsInterface/ABI39_0_0UMConstantsInterface.h>

@interface ABI39_0_0EXConstantsBinding : ABI39_0_0EXConstantsService <ABI39_0_0UMInternalModule, ABI39_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
