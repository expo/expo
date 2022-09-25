// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI45_0_0EXBranch/ABI45_0_0RNBranch.h>)
#import <ABI45_0_0EXBranch/ABI45_0_0RNBranch.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI45_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI45_0_0EXScopedBranch : ABI45_0_0RNBranch <ABI45_0_0EXModuleRegistryConsumer, ABI45_0_0EXInternalModule>

@property (nonatomic, strong) NSString *scopeKey;

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
#endif
