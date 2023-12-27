// Copyright 2019-present 650 Industries. All rights reserved.
#if __has_include(<ABI43_0_0EXBranch/ABI43_0_0RNBranch.h>)
#import "ABI43_0_0EXScopedBranch.h"

@interface ABI43_0_0EXScopedBranch ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@protocol ABI43_0_0EXDummyBranchProtocol
@end

@implementation ABI43_0_0EXScopedBranch

@synthesize bridge = _bridge;

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI43_0_0EXDummyBranchProtocol)];
}

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI43_0_0RNBranchLinkOpenedNotification object:nil];
    _scopeKey = scopeKey;
  }
  return self;
}

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  [(id<ABI43_0_0EXBranchScopedModuleDelegate>)[_moduleRegistry getSingletonModuleForName:@"BranchManager"] branchModuleDidInit:self];
}

- (void)setBridge:(ABI43_0_0RCTBridge *)bridge
{
  _bridge = bridge;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onInitSessionFinished:) name:ABI43_0_0RNBranchLinkOpenedNotification object:nil];
#pragma clang diagnostic pop
}

@end
#endif
