// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI46_0_0EXFirebaseCore/ABI46_0_0EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <ABI46_0_0EXFirebaseCore/ABI46_0_0EXFirebaseCore.h>
#import <ABI46_0_0EXManifests/ABI46_0_0EXManifestsManifest.h>
#import "ABI46_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXScopedFirebaseCore : ABI46_0_0EXFirebaseCore

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI46_0_0EXManifestsManifest *)manifest constantsBinding:(ABI46_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
