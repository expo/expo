// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI37_0_0EXConstants/ABI37_0_0EXConstantsService.h>)
#import <Foundation/Foundation.h>
#import <ABI37_0_0EXConstants/ABI37_0_0EXConstantsService.h>
#import <ABI37_0_0UMConstantsInterface/ABI37_0_0UMConstantsInterface.h>

@interface ABI37_0_0EXConstantsBinding : ABI37_0_0EXConstantsService <ABI37_0_0UMInternalModule, ABI37_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
