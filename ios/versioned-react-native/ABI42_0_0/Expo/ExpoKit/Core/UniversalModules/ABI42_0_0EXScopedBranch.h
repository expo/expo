// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXBranch/ABI42_0_0RNBranch.h>)
#import <ABI42_0_0EXBranch/ABI42_0_0RNBranch.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI42_0_0EXScopedBranch : ABI42_0_0RNBranch <ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0UMInternalModule>

@property (nonatomic, strong) NSString *scopeKey;

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
#endif
