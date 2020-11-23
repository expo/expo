// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXBranch/ABI40_0_0RNBranch.h>)
#import <ABI40_0_0EXBranch/ABI40_0_0RNBranch.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI40_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI40_0_0EXScopedBranch : ABI40_0_0RNBranch <ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0UMInternalModule>

@property (nonatomic, strong) NSString *experienceId;

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
