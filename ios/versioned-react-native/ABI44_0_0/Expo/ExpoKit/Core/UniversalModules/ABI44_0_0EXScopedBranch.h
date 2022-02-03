// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXBranch/ABI44_0_0RNBranch.h>)
#import <ABI44_0_0EXBranch/ABI44_0_0RNBranch.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI44_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI44_0_0EXScopedBranch : ABI44_0_0RNBranch <ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXInternalModule>

@property (nonatomic, strong) NSString *scopeKey;

- (instancetype)initWithScopeKey:(NSString *)scopeKey;

@end

NS_ASSUME_NONNULL_END
#endif
