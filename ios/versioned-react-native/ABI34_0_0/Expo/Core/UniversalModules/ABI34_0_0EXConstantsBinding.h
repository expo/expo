// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI34_0_0EXConstants/ABI34_0_0EXConstantsService.h>)
#import <Foundation/Foundation.h>
#import <ABI34_0_0EXConstants/ABI34_0_0EXConstantsService.h>
#import <ABI34_0_0UMConstantsInterface/ABI34_0_0UMConstantsInterface.h>

@interface ABI34_0_0EXConstantsBinding : ABI34_0_0EXConstantsService <ABI34_0_0UMInternalModule, ABI34_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
