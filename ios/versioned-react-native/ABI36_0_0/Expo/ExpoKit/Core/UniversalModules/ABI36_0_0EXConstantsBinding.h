// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI36_0_0EXConstants/ABI36_0_0EXConstantsService.h>)
#import <Foundation/Foundation.h>
#import <ABI36_0_0EXConstants/ABI36_0_0EXConstantsService.h>
#import <ABI36_0_0UMConstantsInterface/ABI36_0_0UMConstantsInterface.h>

@interface ABI36_0_0EXConstantsBinding : ABI36_0_0EXConstantsService <ABI36_0_0UMInternalModule, ABI36_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
