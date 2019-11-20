// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI35_0_0EXConstants/ABI35_0_0EXConstantsService.h>)
#import <Foundation/Foundation.h>
#import <ABI35_0_0EXConstants/ABI35_0_0EXConstantsService.h>
#import <ABI35_0_0UMConstantsInterface/ABI35_0_0UMConstantsInterface.h>

@interface ABI35_0_0EXConstantsBinding : ABI35_0_0EXConstantsService <ABI35_0_0UMInternalModule, ABI35_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
