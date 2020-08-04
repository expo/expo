// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXBranch/ABI38_0_0RNBranch.h>)
#import <ABI38_0_0EXBranch/ABI38_0_0RNBranch.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMInternalModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI38_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI38_0_0EXScopedBranch : ABI38_0_0RNBranch <ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0UMInternalModule>

@property (nonatomic, strong) NSString *experienceId;

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
#endif
