// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#if __has_include(<ABI40_0_0EXConstants/ABI40_0_0EXConstantsService.h>)
#import <ABI40_0_0EXConstants/ABI40_0_0EXConstantsService.h>
#import <ABI40_0_0UMConstantsInterface/ABI40_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXConstantsBinding : ABI40_0_0EXConstantsService <ABI40_0_0UMInternalModule, ABI40_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
