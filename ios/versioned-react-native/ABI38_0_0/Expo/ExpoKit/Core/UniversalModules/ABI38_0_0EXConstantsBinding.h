// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXConstants/ABI38_0_0EXConstantsService.h>)
#import <Foundation/Foundation.h>
#import <ABI38_0_0EXConstants/ABI38_0_0EXConstantsService.h>
#import <ABI38_0_0UMConstantsInterface/ABI38_0_0UMConstantsInterface.h>

@interface ABI38_0_0EXConstantsBinding : ABI38_0_0EXConstantsService <ABI38_0_0UMInternalModule, ABI38_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
